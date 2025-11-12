/**
 * Information about a parsed SQL query
 */
export interface SQLParsedInfo {
    canReturnRows: boolean;
}
/**
 * Parse SQL query to determine if it can return rows
 * Uses a priority-based approach for accurate detection
 *
 * A reimplementation of Bun's SQLite query parser.
 * https://github.com/oven-sh/bun/blob/e0aae8adc1ca0d84046f973e563387d0a0abeb4e/src/js/internal/sql/sqlite.ts#L53-L207
 *
 * @param query - The SQL query to parse
 * @returns Information about whether the query can return rows
 *
 * @example
 * ```ts
 * parseSQLQuery('SELECT * FROM users') // { canReturnRows: true }
 * parseSQLQuery('INSERT INTO users VALUES (1)') // { canReturnRows: false }
 * parseSQLQuery('INSERT INTO users VALUES (1) RETURNING *') // { canReturnRows: true }
 * parseSQLQuery('INSERT INTO users SELECT * FROM temp') // { canReturnRows: false }
 * ```
 */
export declare function parseSQLQuery(query: string): SQLParsedInfo;
//# sourceMappingURL=queryUtils.d.ts.map