/**
 * Provides data-access helpers for retrieving category information.
 */

import { asc } from 'drizzle-orm';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';
import type { Database } from './db';

/**
 * Retrieves all categories ordered by name.
 *
 * @param db - The database instance used to query categories.
 * @returns A list containing the id and name of every category.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    return db
        .select({
            id: categories.id,
            name: categories.name,
        })
        .from(categories)
        .orderBy(asc(categories.name));
}
