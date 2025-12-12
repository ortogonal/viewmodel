import type { Decoder } from '../core/ihttpclient';
import type { IWebsocketClient } from '../core/iwebsocketclient';
import { RealtimeSource } from './realtimesource';
import type { RealtimeUpdate } from './irealtimeupdate';

export class WebsocketSource<Type, Params> extends RealtimeSource<Type, Params> {
    private readonly websocket: IWebsocketClient;
    private readonly decode: Decoder<Type>;
    private readonly unsubscribe: () => void;


    constructor(websocket: IWebsocketClient, decode: Decoder<Type>) {
        super();
        this.websocket = websocket;
        this.decode = decode;

        this.unsubscribe = this.websocket.subscribe((message: string) => {
            const parsed = this.parseMessage(message);
            if (!parsed) {
                return;
            }

            this.handleUpdate(parsed);
        });
    }

    private parseMessage(message: string): RealtimeUpdate<Type> | undefined {
        let parsed: unknown;
        try {
            parsed = JSON.parse(message);
        } catch {
            return undefined;
        }

        return this.parseUpdate(parsed);
    }

    private parseUpdate(parsed: unknown): RealtimeUpdate<Type> | undefined {
        if (!parsed || typeof parsed !== 'object') {
            return undefined;
        }

        const operation = (parsed as { operation?: unknown }).operation;

        switch (operation) {
            case 'add': {
                let value: Type;
                try {
                    value = this.decode((parsed as { value?: unknown }).value);
                } catch {
                    return undefined;
                }

                return { operation, value };
            }
            case 'update': {
                if (typeof (parsed as { uniqueId?: unknown }).uniqueId !== 'string') {
                    return undefined;
                }

                let value: Type;
                try {
                    value = this.decode((parsed as { value?: unknown }).value);
                } catch {
                    return undefined;
                }

                return { operation, uniqueId: (parsed as { uniqueId: string }).uniqueId, value };
            }
            case 'delete': {
                if (typeof (parsed as { uniqueId?: unknown }).uniqueId !== 'string') {
                    return undefined;
                }

                return { operation, uniqueId: (parsed as { uniqueId: string }).uniqueId };
            }
            case 'batch': {
                const operations = (parsed as { operations?: unknown }).operations;
                if (!Array.isArray(operations)) {
                    return undefined;
                }

                const parsedOperations: RealtimeUpdate<Type>[] = [];
                for (const op of operations) {
                    const parsedOp = this.parseUpdate(op);
                    if (!parsedOp) {
                        return undefined;
                    }
                    parsedOperations.push(parsedOp);
                }

                return { operation, operations: parsedOperations };
            }
            default:
                return undefined;
        }
    }

    dispose() {
        this.unsubscribe();
    }

    private handleUpdate(update: RealtimeUpdate<Type>) {
        switch (update.operation) {
            case 'batch':
                this.batch(update.operations);
                return;
            case 'add':
                this.add(update.value);
                return;
            case 'update':
                this.update(update.uniqueId, update.value);
                return;
            case 'delete':
                this.delete(update.uniqueId);
                return;
            default:
                return;
        }
    }
}
