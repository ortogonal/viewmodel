import type { IRealtimeSource } from './irealtimesource';
import type { RealtimeUpdate } from './irealtimeupdate';

export class RealtimeSource<Type, Params> implements IRealtimeSource<Params, RealtimeUpdate<Type>> {
    private subscribers = new Set<(update: RealtimeUpdate<Type>) => void>();

    subscribe(_params: Params, onUpdate: (update: RealtimeUpdate<Type>) => void): () => void {
        this.subscribers.add(onUpdate);
        return () => this.subscribers.delete(onUpdate);
    }

    protected add(item: Type): void {
        const update: RealtimeUpdate<Type> = { operation: 'add', value: item };
        this.emit(update);
    }

    protected update(uniqueId: string, item: Type): void {
        const update: RealtimeUpdate<Type> = { operation: 'update', uniqueId: uniqueId, value: item };
        this.emit(update);
    }

    protected delete(uniqueId: string): void {
        const update: RealtimeUpdate<Type> = { operation: 'delete', uniqueId: uniqueId};
        this.emit(update);
    }

    protected batch(operations: RealtimeUpdate<Type>[]): void {
        const update: RealtimeUpdate<Type> = { operation: 'batch', operations };
        this.emit(update);
    }

    private emit(update: RealtimeUpdate<Type>) {
        for (const subscriber of this.subscribers) {
            subscriber(update);
        }
    }
}
