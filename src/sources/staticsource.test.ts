import { describe, it, expect } from 'vitest';
import { StaticSource } from './staticsource';

describe('StaticSource', () => {
    it('returns the provided data when loaded', async () => {
        const data = [1, 2, 3];
        const source = new StaticSource<number>(data);

        const loaded = await source.load(undefined);

        expect(loaded).toBe(data);
        expect(loaded).toEqual([1, 2, 3]);
    });

    it('returns an empty array when constructed empty', async () => {
        const data: string[] = [];
        const source = new StaticSource<string>(data);

        const loaded = await source.load(undefined);

        expect(loaded).toBe(data);
        expect(loaded).toHaveLength(0);
    });

    it('reflects mutations to the original array', async () => {
        const data = ['a'];
        const source = new StaticSource<string>(data);

        data.push('b');

        const loaded = await source.load(undefined);

        expect(loaded).toEqual(['a', 'b']);
    });
});
