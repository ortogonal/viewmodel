export type Decoder<T> = (input: unknown) => T;

export interface IHttpClient {
    get<T>(path: string, decode: Decoder<T>, init?: RequestInit): Promise<T>;
}
