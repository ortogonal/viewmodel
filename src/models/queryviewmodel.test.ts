import { describe, it, expect, vi } from 'vitest';
import { QueryViewModel } from './queryviewmodel';
import type { IQuerySource } from '../sources/iquerysource';

describe('QueryViewModel', () => {
    it('sets loading then ready on successful load and notifies listeners', async () => {
        const rest: IQuerySource<string, { id: number }> = {
            load: vi.fn().mockResolvedValue('data'),
        };
        const vm = new QueryViewModel(rest);
        const listener = vi.fn();
        vm.subscribe(listener);

        const loadPromise = vm.load({ id: 1 });

        // Immediately after calling load, status should be loading
        expect(vm.getSnapshot().status).toBe('loading');
        expect(vm.getSnapshot().value).toBeUndefined();

        await loadPromise;

        expect(rest.load).toHaveBeenCalledWith({ id: 1 });
        expect(vm.getSnapshot()).toEqual({ status: 'ready', value: 'data' });
        expect(listener).toHaveBeenCalledTimes(2); // loading -> ready
    });

    it('sets loading then error on failed load and preserves previous value', async () => {
        const rest: IQuerySource<string, void> = {
            load: vi.fn().mockRejectedValue(new Error('boom')),
        };
        const vm = new QueryViewModel(rest);
        const listener = vi.fn();
        vm.subscribe(listener);

        // Seed previous value to ensure it is preserved on error
        // @ts-expect-error accessing protected for test setup
        vm['setSnapshot']({ status: 'ready', value: 'old' });

        const loadPromise = vm.load(undefined as void);
        expect(vm.getSnapshot().status).toBe('loading');
        expect(vm.getSnapshot().value).toBe('old');

        await loadPromise;

        expect(rest.load).toHaveBeenCalled();
        expect(vm.getSnapshot().status).toBe('error');
        expect(vm.getSnapshot().value).toBe('old');
        expect(vm.getSnapshot().error).toBeInstanceOf(Error);
        expect(listener).toHaveBeenCalledTimes(3); // loading -> error
    });
});
