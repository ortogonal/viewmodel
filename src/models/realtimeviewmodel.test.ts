import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimeViewModel } from './realtimeviewmodel';
import type { IQuerySource } from '../sources/iquerysource';
import type { IRealtimeSource } from '../sources/irealtimesource';

describe('RealtimeViewModel', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('loads initial data and applies realtime updates', async () => {
        const rest: IQuerySource<number, { id: string }> = {
            load: vi.fn().mockResolvedValue(5),
        };

        let capturedUpdate: ((update: number) => void) | undefined;
        const unsubscribe = vi.fn();
        const realtime: IRealtimeSource<{ id: string }, number> = {
            subscribe: vi.fn((params, onUpdate) => {
                capturedUpdate = onUpdate;
                return unsubscribe;
            }),
        };

        const applyUpdate = vi.fn((prev: number | undefined, update: number) => (prev ?? 0) + update);

        const vm = new RealtimeViewModel(rest, realtime, applyUpdate);
        const snapshots: unknown[] = [];
        vm.subscribe(() => snapshots.push(vm.getSnapshot()));

        await vm.start({ id: 'abc' });

        expect(rest.load).toHaveBeenCalledWith({ id: 'abc' });
        expect(realtime.subscribe).toHaveBeenCalledWith({ id: 'abc' }, expect.any(Function));
        expect(vm.getSnapshot()).toEqual({ status: 'ready', value: 5 });
        expect(applyUpdate).not.toHaveBeenCalled();
        expect(snapshots[0]).toEqual({
            status: 'loading',
            value: undefined,
            error: undefined,
        });
        expect(snapshots[1]).toEqual({ status: 'ready', value: 5 });

        capturedUpdate?.(2);

        expect(applyUpdate).toHaveBeenCalledWith(5, 2);
        expect(vm.getSnapshot()).toEqual({ status: 'ready', value: 7 });
        expect(snapshots.at(-1)).toEqual({ status: 'ready', value: 7 });
        expect(snapshots).toHaveLength(3); // loading, ready, updated ready
    });

    it('unsubscribes from realtime updates when stopped', async () => {
        const rest: IQuerySource<number, string> = {
            load: vi.fn().mockResolvedValue(1),
        };
        const unsubscribe = vi.fn();
        const realtime: IRealtimeSource<string, number> = {
            subscribe: vi.fn(() => unsubscribe),
        };

        const vm = new RealtimeViewModel(rest, realtime, (prev, update) => (prev ?? 0) + update);

        await vm.start('x');
        expect(unsubscribe).not.toHaveBeenCalled();

        vm.stop();
        expect(unsubscribe).toHaveBeenCalledTimes(1);

        vm.stop(); // idempotent
        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
});
