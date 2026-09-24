import { beforeEach, describe, expect, it } from 'vitest';
import { publishers } from '../../db/schema';
import { createTestDatabase } from '../../db/test-helpers';
import type { Database } from './db';
import { getAllPublishers } from './publishers';

describe('getAllPublishers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns publisher ids and names ordered by name', async () => {
        await db.insert(publishers).values([
            { name: 'Zeta Games', description: 'Last alphabetically' },
            { name: 'Alpha Games', description: 'First alphabetically' },
        ]);

        const result = await getAllPublishers(db);

        expect(result).toEqual([
            { id: expect.any(Number), name: 'Alpha Games' },
            { id: expect.any(Number), name: 'Zeta Games' },
        ]);
    });

    it('returns an empty list when no publishers exist', async () => {
        expect(await getAllPublishers(db)).toEqual([]);
    });
});
