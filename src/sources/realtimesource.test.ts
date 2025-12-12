import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimeSource } from './realtimesource';
import type { RealtimeUpdate } from './irealtimeupdate';

class TestRealtimeSource extends RealtimeSource<string, { scope: string }> {
    emitAdd(value: string) {
        this.add(value);
    }

    emitUpdate(uniqueId: string, value: string) {
        this.update(uniqueId, value);
    }

    emitDelete(uniqueId: string) {
        this.delete(uniqueId);
    }

    emitBatch(operations: RealtimeUpdate<string>[]) {
        this.batch(operations);
    }
}

describe('RealtimeSource', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('emits add, update, and delete operations to subscribers', () => {
        const source = new TestRealtimeSource();
        const received: RealtimeUpdate<string>[] = [];

        const unsubscribe = source.subscribe({ scope: 'alpha' }, (update) => received.push(update));

        source.emitAdd('first');
        source.emitUpdate('42', 'second');
        source.emitDelete('99');

        expect(received).toEqual([
            { operation: 'add', value: 'first' },
            { operation: 'update', uniqueId: '42', value: 'second' },
            { operation: 'delete', uniqueId: '99' },
        ]);

        unsubscribe();
        source.emitAdd('ignored');

        expect(received).toHaveLength(3);
    });

    it('emits a single batched operation, preserving nesting', () => {
        const source = new TestRealtimeSource();
        const received: RealtimeUpdate<string>[] = [];

        source.subscribe({ scope: 'gamma' }, (update) => received.push(update));

        const operations: RealtimeUpdate<string>[] = [
            { operation: 'add', value: 'one' },
            {
                operation: 'batch',
                operations: [
                    { operation: 'update', uniqueId: 'id1', value: 'two' },
                    { operation: 'delete', uniqueId: 'gone' },
                ],
            },
        ];

        source.emitBatch(operations);

        expect(received).toEqual([{ operation: 'batch', operations }]);
    });

    it('supports multiple subscribers and removes each independently', () => {
        const source = new TestRealtimeSource();
        const first = vi.fn();
        const second = vi.fn();

        const unsubscribeFirst = source.subscribe({ scope: 'beta' }, first);
        const unsubscribeSecond = source.subscribe({ scope: 'beta' }, second);

        source.emitAdd('one');
        expect(first).toHaveBeenCalledWith({ operation: 'add', value: 'one' });
        expect(second).toHaveBeenCalledWith({ operation: 'add', value: 'one' });

        unsubscribeFirst();
        source.emitDelete('gone');

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledWith({ operation: 'delete', uniqueId: 'gone' });

        unsubscribeSecond();
        source.emitAdd('three');

        expect(second).toHaveBeenCalledTimes(2);
    });
});
