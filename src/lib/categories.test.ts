import { beforeEach, describe, expect, it } from 'vitest';
import { categories } from '../../db/schema';
import { createTestDatabase } from '../../db/test-helpers';
import type { Database } from './db';
import { getAllCategories } from './categories';

describe('getAllCategories', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns category ids and names ordered by name', async () => {
        await db.insert(categories).values([
            { name: 'Zeta Genre', description: 'Last alphabetically' },
            { name: 'Alpha Genre', description: 'First alphabetically' },
        ]);

        const result = await getAllCategories(db);

        expect(result).toEqual([
            { id: expect.any(Number), name: 'Alpha Genre' },
            { id: expect.any(Number), name: 'Zeta Genre' },
        ]);
    });

    it('returns an empty list when no categories exist', async () => {
        expect(await getAllCategories(db)).toEqual([]);
    });
});
