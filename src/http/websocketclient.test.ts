import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebsocketClient } from './websocketclient';

let socketInstance: FakeWebSocket | undefined;

class FakeWebSocket {
    public url: string;
    public addEventListener = vi.fn((type: 'message', handler: (event: MessageEvent) => void) => {
        this.handlers.add(handler);
    });
    private handlers = new Set<(event: MessageEvent) => void>();

    constructor(url: string) {
        socketInstance = this;
        this.url = url;
    }

    emit(data: unknown) {
        for (const handler of this.handlers) {
            handler({ data } as MessageEvent);
        }
    }
}

describe('WebsocketClient', () => {
    const originalWebSocket = globalThis.WebSocket;

    beforeEach(() => {
        vi.restoreAllMocks();
        socketInstance = undefined;
        // @ts-expect-error override global for test
        globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
    });

    afterEach(() => {
        // @ts-expect-error restore global
        globalThis.WebSocket = originalWebSocket;
    });

    it('creates a websocket and delivers messages to subscribers', () => {
        const client = new WebsocketClient<string>('ws://test');
        const onMessage = vi.fn();

        client.subscribe(onMessage);

        expect(socketInstance).toBeDefined();
        expect(socketInstance?.url).toBe('ws://test');
        expect(socketInstance?.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));

        socketInstance?.emit('hello');

        expect(onMessage).toHaveBeenCalledWith('hello');
    });

    it('stops sending messages to a subscriber after unsubscribe', () => {
        const client = new WebsocketClient<string>('ws://multi');
        const first = vi.fn();
        const second = vi.fn();

        const unsubscribeFirst = client.subscribe(first);
        client.subscribe(second);

        socketInstance?.emit('msg1');
        expect(first).toHaveBeenCalledWith('msg1');
        expect(second).toHaveBeenCalledWith('msg1');

        first.mockClear();
        second.mockClear();

        unsubscribeFirst();
        socketInstance?.emit('msg2');

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledWith('msg2');
    });
});
