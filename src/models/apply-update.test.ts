import { describe, it, expect } from 'vitest';
import { makeApplyUpdate } from './apply-update';
import type { RealtimeUpdate } from '../sources/irealtimeupdate';

type Item = { id: string; name: string };

describe('makeApplyUpdate', () => {
    const applyUpdate = makeApplyUpdate<Item>((item) => item.id);

    it('adds, updates, and deletes items based on operation', () => {
        const add: RealtimeUpdate<Item> = { operation: 'add', value: { id: '1', name: 'one' } };
        const afterAdd = applyUpdate(undefined, add);
        expect(afterAdd).toEqual([{ id: '1', name: 'one' }]);

        const update: RealtimeUpdate<Item> = {
            operation: 'update',
            uniqueId: '1',
            value: { id: '1', name: 'updated' },
        };
        const afterUpdate = applyUpdate(afterAdd, update);
        expect(afterUpdate).toEqual([{ id: '1', name: 'updated' }]);

        const del: RealtimeUpdate<Item> = { operation: 'delete', uniqueId: '1' };
        const afterDelete = applyUpdate(afterUpdate, del);
        expect(afterDelete).toEqual([]);
    });

    it('ignores updates for unknown ids and unknown operations', () => {
        const initial: Item[] = [
            { id: '1', name: 'one' },
            { id: '2', name: 'two' },
        ];

        const unknownIdUpdate: RealtimeUpdate<Item> = {
            operation: 'update',
            uniqueId: '99',
            value: { id: '99', name: 'noop' },
        };
        expect(applyUpdate(initial, unknownIdUpdate)).toEqual(initial);

        const unknownIdDelete: RealtimeUpdate<Item> = { operation: 'delete', uniqueId: '99' };
        expect(applyUpdate(initial, unknownIdDelete)).toEqual(initial);

        const unknownOp = { operation: 'noop' } as RealtimeUpdate<Item>;
        expect(applyUpdate(initial, unknownOp)).toEqual(initial);
    });

    it('applies batched operations recursively in a single call', () => {
        const initial: Item[] = [
            { id: '1', name: 'one' },
            { id: '2', name: 'two' },
        ];

        const batch: RealtimeUpdate<Item> = {
            operation: 'batch',
            operations: [
                { operation: 'add', value: { id: '3', name: 'three' } },
                {
                    operation: 'batch',
                    operations: [
                        { operation: 'update', uniqueId: '1', value: { id: '1', name: 'one-updated' } },
                        { operation: 'delete', uniqueId: '2' },
                    ],
                },
            ],
        };

        const result = applyUpdate(initial, batch);

        expect(result).toEqual([
            { id: '1', name: 'one-updated' },
            { id: '3', name: 'three' },
        ]);
    });

    it('defaults to an empty snapshot when an accumulator is undefined in batch reduce', () => {
        const applyUpdate = makeApplyUpdate<Item>((item) => item.id);

        const operationsLikeReduce = {
            reduce: (cb: (acc: Item[] | undefined, op: RealtimeUpdate<Item>) => Item[], _initial: Item[]) =>
                cb(undefined, { operation: 'add', value: { id: '1', name: 'one' } }),
        } as unknown as RealtimeUpdate<Item>[];

        const result = applyUpdate(undefined, {
            operation: 'batch',
            operations: operationsLikeReduce,
        });

        expect(result).toEqual([{ id: '1', name: 'one' }]);
    });
});
