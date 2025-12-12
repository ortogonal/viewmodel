
export interface IWebsocketClient {
    subscribe(handle: (message: string) => void): () => void;
}
