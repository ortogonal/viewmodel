export interface IRealtimeSource<Params, Update> {
    subscribe(params: Params, onUpdate: (update: Update) => void): () => void;
}
