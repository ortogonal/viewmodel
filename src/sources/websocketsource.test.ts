import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { WebsocketSource } from './websocketsource';
import type { IWebsocketClient } from '../http/iwebsocketclient';
import type { RealtimeUpdate } from './irealtimeupdate';

type Message = RealtimeUpdate<{ id: string }>;

describe('WebsocketSource', () => {
    let emitMessage: (msg: string) => void;
    let websocket: IWebsocketClient;

    beforeEach(() => {
        vi.restoreAllMocks();
        emitMessage = () => undefined;
        websocket = {
            subscribe: vi.fn((handler) => {
                emitMessage = handler;
                return vi.fn();
            }),
        };
    });

    it('parses JSON messages, validates payload, and emits realtime updates', () => {
        const schema = z.object({ id: z.string() });
        const decode = vi.fn((input) => schema.parse(input));
        const source = new WebsocketSource<{ id: string }, { scope: string }>(websocket, decode);
        const updates: Message[] = [];
        source.subscribe({ scope: 'any' }, (update) => updates.push(update));

        emitMessage(JSON.stringify({ operation: 'add', value: { id: '1' } } satisfies Message));
        emitMessage(JSON.stringify({ operation: 'update', uniqueId: '1', value: { id: '1' } } satisfies Message));
        emitMessage(JSON.stringify({ operation: 'delete', uniqueId: '1' } satisfies Message));

        expect(decode).toHaveBeenCalledTimes(2); // add + update
        expect(updates).toEqual([
            { operation: 'add', value: { id: '1' } },
            { operation: 'update', uniqueId: '1', value: { id: '1' } },
            { operation: 'delete', uniqueId: '1' },
        ]);
    });

    it('ignores malformed or invalid messages', () => {
        const schema = z.object({ id: z.string() });
        const decode = vi.fn((input) => schema.parse(input));
        const source = new WebsocketSource<{ id: string }, { scope: string }>(websocket, decode);
        const onUpdate = vi.fn();
        source.subscribe({ scope: 'any' }, onUpdate);

        emitMessage('not-json');
        emitMessage(JSON.stringify({ operation: 'unknown' }));
        emitMessage(JSON.stringify({ operation: 'update' })); // missing uniqueId/value
        emitMessage(JSON.stringify({ operation: 'update', uniqueId: 123, value: { id: '1' } }));
        emitMessage(JSON.stringify({ operation: 'delete' })); // missing uniqueId
        emitMessage(JSON.stringify({ operation: 'add' })); // missing value
        emitMessage(JSON.stringify({ operation: 'add', value: { id: 1 } })); // schema invalid
        emitMessage(JSON.stringify({ operation: 'batch', operations: 'not-an-array' }));

        expect(onUpdate).not.toHaveBeenCalled();
        expect(decode).toHaveBeenCalledTimes(2); // two add messages reach decoder and fail validation
    });

    it('parses JSON batched messages and emits a single batch update with nested operations', () => {
        const schema = z.object({ id: z.string() });
        const decode = vi.fn((input) => schema.parse(input));
        const source = new WebsocketSource<{ id: string }, { scope: string }>(websocket, decode);
        const updates: Message[] = [];
        source.subscribe({ scope: 'any' }, (update) => updates.push(update));

        emitMessage(
            JSON.stringify({
                operation: 'batch',
                operations: [
                    { operation: 'add', value: { id: '1' } },
                    {
                        operation: 'batch',
                        operations: [
                            { operation: 'add', value: { id: '2' } },
                            { operation: 'update', uniqueId: '1', value: { id: '1a' } },
                        ],
                    },
                    { operation: 'delete', uniqueId: '2' },
                ],
            }),
        );

        const expectedOperations: Message[] = [
            { operation: 'add', value: { id: '1' } },
            {
                operation: 'batch',
                operations: [
                    { operation: 'add', value: { id: '2' } },
                    { operation: 'update', uniqueId: '1', value: { id: '1a' } },
                ],
            },
            { operation: 'delete', uniqueId: '2' },
        ];

        expect(decode).toHaveBeenCalledTimes(3);
        expect(updates).toEqual([{ operation: 'batch', operations: expectedOperations }]);
    });

    it('returns undefined for non-object payloads, failed update decodes, and invalid batch entries', () => {
        const schema = z.object({ id: z.string() });
        const decode = vi.fn((input) => schema.parse(input));
        const source = new WebsocketSource<{ id: string }, { scope: string }>(websocket, decode);
        const onUpdate = vi.fn();
        source.subscribe({ scope: 'any' }, onUpdate);

        emitMessage('null'); // parsed value is null, parseUpdate early exits
        emitMessage(JSON.stringify({ operation: 'update', uniqueId: '1', value: { id: 123 } })); // decode throws for update
        emitMessage(
            JSON.stringify({
                operation: 'batch',
                operations: [
                    { operation: 'add', value: { id: 'ok' } },
                    { operation: 'update', uniqueId: '2', value: { id: 0 } }, // nested decode fails, batch aborts
                ],
            }),
        );

        expect(onUpdate).not.toHaveBeenCalled();
        expect(decode).toHaveBeenCalledTimes(3);
        source.dispose();
    });

    it('no-ops on unknown operations passed directly to handleUpdate', () => {
        const decode = vi.fn((input) => input as { id: string });
        const source = new WebsocketSource<{ id: string }, { scope: string }>(websocket, decode);
        const updates: Message[] = [];
        source.subscribe({ scope: 'any' }, (update) => updates.push(update));

        (source as any).handleUpdate({ operation: 'noop' } as RealtimeUpdate<{ id: string }>);

        expect(updates).toEqual([]);
        source.dispose();
    });
});
