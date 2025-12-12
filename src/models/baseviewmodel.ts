import type { IViewModel, ViewSnapShot } from '@/core/iviewmodel';

export abstract class BaseViewModel<Type> implements IViewModel<Type> {
    protected snapshot: ViewSnapShot<Type[]> = { status: 'idle' };
    private listeners = new Set<() => void>();

    getSnapshot(): ViewSnapShot<Type[]> {
        return this.snapshot;
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    protected setSnapshot(next: ViewSnapShot<Type[]>) {
        this.snapshot = next;
        for (const listerner of this.listeners) {
            listerner();
        }
    }

    protected patch(patchFunction: (prev: ViewSnapShot<Type[]>) => ViewSnapShot<Type[]>) {
        this.setSnapshot(patchFunction(this.snapshot));
    }
}
