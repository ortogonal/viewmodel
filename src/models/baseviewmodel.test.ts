import { describe, it, expect, vi } from 'vitest';
import { BaseViewModel } from './baseviewmodel';
import type { ViewSnapShot } from '@/core/iviewmodel';

class TestViewModel extends BaseViewModel<string> {
    update(next: ViewSnapShot<string>) {
        this.setSnapshot(next);
    }

    patchWith(fn: (prev: ViewSnapShot<string>) => ViewSnapShot<string>) {
        this.patch(fn);
    }
}

describe('BaseViewModel', () => {
    it('returns the current snapshot via getSnapshot', () => {
        const vm = new TestViewModel();
        expect(vm.getSnapshot()).toEqual({ status: 'idle' });

        vm.update({ status: 'ready', value: 'foo' });
        expect(vm.getSnapshot()).toEqual({ status: 'ready', value: 'foo' });
    });

    it('notifies listeners and allows unsubscribe', () => {
        const vm = new TestViewModel();
        const listener = vi.fn();

        const unsubscribe = vm.subscribe(listener);
        vm.update({ status: 'ready', value: 'foo' });
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();
        vm.update({ status: 'error', error: new Error('boom') });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('patch updates snapshot based on the previous value', () => {
        const vm = new TestViewModel();
        const listener = vi.fn();
        vm.subscribe(listener);

        vm.update({ status: 'ready', value: 'a' });
        vm.patchWith((prev) => ({
            status: 'ready',
            value: (prev.value ?? '') + 'b',
        }));

        expect(vm.getSnapshot()).toEqual({ status: 'ready', value: 'ab' });
        expect(listener).toHaveBeenCalledTimes(2); // one for update, one for patch
    });
});
