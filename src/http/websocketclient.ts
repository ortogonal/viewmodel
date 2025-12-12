import type { IWebsocketClient } from './iwebsocketclient';

export class WebsocketClient<Type> implements IWebsocketClient {
    private subscribers = new Set<(message: string) => void>();
    private webSocket: WebSocket;

    constructor(baseUrl: string) {
        this.webSocket = new WebSocket(baseUrl);

        const onMessage = (event: MessageEvent) => {
            for (const subscriber of this.subscribers) {
                subscriber(event.data)
            }
        };

        this.webSocket.addEventListener('message', onMessage);
    }
    subscribe(callback: (message: string) => void): () => void {
        this.subscribers.add(callback);
        return () => {
            this.subscribers.delete(callback);
        };
    }
}
