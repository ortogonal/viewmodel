export type ViewStatus = 'idle' | 'loading' | 'ready' | 'error';

export type ViewSnapShot<TypeArray> = {
    status: ViewStatus;
    value?: TypeArray;
    error?: unknown;
};

export interface IViewModel<Type> {
    getSnapshot(): ViewSnapShot<Type[]>;
    subscribe(listener: () => void): () => void;
}
