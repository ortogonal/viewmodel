import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from './httpclient';

describe('HttpClient.get', () => {
    const decode = <T>(raw: unknown) => raw as T;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('calls fetch with baseUrl + path and decodes JSON', async () => {
        const payload = { message: 'ok' };
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(payload), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        const client = new HttpClient('https://api.test');
        const result = await client.get('/foo', decode);

        expect(fetch).toHaveBeenCalledWith('https://api.test/foo', {
            method: 'GET',
        });
        expect(result).toEqual(payload);
    });

    it('throws when response is not ok', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 500 }));

        const client = new HttpClient('https://api.test');

        await expect(client.get('/foo', decode)).rejects.toThrow(/500/);
    });
});
