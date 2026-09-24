import { and, eq, asc, inArray, type SQL } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

/** Optional criteria for narrowing {@link getAllGames} results. */
export interface GameFilterOptions {
    /** When non-empty, only games in one of these category ids are returned. */
    categoryIds?: number[];
    /** When non-empty, only games from one of these publisher ids are returned. */
    publisherIds?: number[];
}

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/** Builds the combined `WHERE` clause for the given filter options, or `undefined` when none apply. */
function buildGameFilterCondition(filters?: GameFilterOptions): SQL | undefined {
    const conditions: SQL[] = [];

    if (filters?.categoryIds && filters.categoryIds.length > 0) {
        conditions.push(inArray(games.categoryId, filters.categoryIds));
    }
    if (filters?.publisherIds && filters.publisherIds.length > 0) {
        conditions.push(inArray(games.publisherId, filters.publisherIds));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Games ordered by title, optionally narrowed by category and/or publisher.
 *
 * Multiple ids within a single filter (e.g. several category ids) are combined
 * with OR; the category and publisher filters are combined with AND.
 */
export async function getAllGames(db: Database, filters?: GameFilterOptions): Promise<Game[]> {
    const rows = await baseGamesQuery(db)
        .where(buildGameFilterCondition(filters))
        .orderBy(asc(games.title));
    return rows.map(mapGame);
}

/** All game ids ordered by title. */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/** A single game by id, or null when it does not exist. */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}
