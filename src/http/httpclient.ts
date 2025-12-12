import type { Decoder, IHttpClient } from './ihttpclient';

export class HttpClient implements IHttpClient {
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async get<T>(path: string, decode: Decoder<T>, init?: RequestInit): Promise<T> {
        const res = await fetch(this.baseUrl + path, {
            method: 'GET',
            ...init,
        });

        if (!res.ok) {
            throw new Error(`GET ${this.baseUrl}${path} failed: ${res.status}`);
        }

        const raw = (await res.json()) as unknown;
        return decode(raw);
    }
}
