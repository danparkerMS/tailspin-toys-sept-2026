/**
 * Provides data-access helpers for retrieving publisher information.
 */

import { asc } from 'drizzle-orm';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';
import type { Database } from './db';

/**
 * Retrieves all publishers ordered by name.
 *
 * @param db - The database instance used to query publishers.
 * @returns A list containing the id and name of every publisher.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    return db
        .select({
            id: publishers.id,
            name: publishers.name,
        })
        .from(publishers)
        .orderBy(asc(publishers.name));
}
