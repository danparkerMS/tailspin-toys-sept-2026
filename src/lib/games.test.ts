import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
} from './games';

/** Seeds two categories, two publishers, and one game for every category/publisher pair. */
async function seedGamesAcrossCategoriesAndPublishers(db: Database): Promise<{
    strategyId: number;
    puzzleId: number;
    codeForgeId: number;
    devMastersId: number;
}> {
    const [strategy, puzzle] = await db
        .insert(categories)
        .values([
            { name: 'Strategy', description: 'strategy games' },
            { name: 'Puzzle', description: 'puzzle games' },
        ])
        .returning({ id: categories.id });
    const [codeForge, devMasters] = await db
        .insert(publishers)
        .values([
            { name: 'CodeForge Studios', description: 'codeforge' },
            { name: 'DevMasters Inc.', description: 'devmasters' },
        ])
        .returning({ id: publishers.id });

    await db.insert(games).values([
        {
            title: 'Strategy by CodeForge',
            description: 'd1',
            starRating: 4,
            categoryId: strategy.id,
            publisherId: codeForge.id,
        },
        {
            title: 'Strategy by DevMasters',
            description: 'd2',
            starRating: 4,
            categoryId: strategy.id,
            publisherId: devMasters.id,
        },
        {
            title: 'Puzzle by CodeForge',
            description: 'd3',
            starRating: 4,
            categoryId: puzzle.id,
            publisherId: codeForge.id,
        },
        {
            title: 'Puzzle by DevMasters',
            description: 'd4',
            starRating: 4,
            categoryId: puzzle.id,
            publisherId: devMasters.id,
        },
    ]);

    return {
        strategyId: strategy.id,
        puzzleId: puzzle.id,
        codeForgeId: codeForge.id,
        devMastersId: devMasters.id,
    };
}

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    describe('filtering', () => {
        it('returns all games when no filters are provided', async () => {
            await seedGamesAcrossCategoriesAndPublishers(db);
            const all = await getAllGames(db);
            expect(all).toHaveLength(4);
        });

        it('returns all games when filter arrays are empty', async () => {
            await seedGamesAcrossCategoriesAndPublishers(db);
            const all = await getAllGames(db, { categoryIds: [], publisherIds: [] });
            expect(all).toHaveLength(4);
        });

        it('filters by a single category', async () => {
            const { strategyId } = await seedGamesAcrossCategoriesAndPublishers(db);
            const result = await getAllGames(db, { categoryIds: [strategyId] });
            expect(result.map((g) => g.title)).toEqual(['Strategy by CodeForge', 'Strategy by DevMasters']);
        });

        it('filters by multiple categories combined with OR', async () => {
            const { strategyId, puzzleId } = await seedGamesAcrossCategoriesAndPublishers(db);
            const result = await getAllGames(db, { categoryIds: [strategyId, puzzleId] });
            expect(result).toHaveLength(4);
        });

        it('filters by a single publisher', async () => {
            const { codeForgeId } = await seedGamesAcrossCategoriesAndPublishers(db);
            const result = await getAllGames(db, { publisherIds: [codeForgeId] });
            expect(result.map((g) => g.title)).toEqual(['Puzzle by CodeForge', 'Strategy by CodeForge']);
        });

        it('combines category and publisher filters with AND', async () => {
            const { strategyId, codeForgeId } = await seedGamesAcrossCategoriesAndPublishers(db);
            const result = await getAllGames(db, {
                categoryIds: [strategyId],
                publisherIds: [codeForgeId],
            });
            expect(result.map((g) => g.title)).toEqual(['Strategy by CodeForge']);
        });

        it('returns an empty list when no games match the combined filters', async () => {
            const { strategyId, devMastersId } = await seedGamesAcrossCategoriesAndPublishers(db);
            const result = await getAllGames(db, {
                categoryIds: [strategyId],
                publisherIds: [devMastersId + 999],
            });
            expect(result).toEqual([]);
        });
    });
});
