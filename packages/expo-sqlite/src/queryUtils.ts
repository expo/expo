/**
 * Information about a parsed SQL query
 */
export interface SQLParsedInfo {
  canReturnRows: boolean;
}

const SINGLE_QUOTED_STRING = /'(?:[^']|'')*'/g;
const DOUBLE_QUOTED_STRING = /"(?:[^"]|"")*"/g;
const RETURNING_KEYWORD = /\bRETURNING\b/i;
const MUTATION_KEYWORDS = /\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i;
const QUERY_KEYWORDS = /\b(SELECT|PRAGMA|WITH|EXPLAIN)\b/i;

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
export function parseSQLQuery(query: string): SQLParsedInfo {
  // Remove quoted strings to avoid false positives
  // SQLite uses doubled quotes for escaping: 'don''t' or "test""quote"
  const cleaned = query
    .replace(SINGLE_QUOTED_STRING, "''") // Remove single-quoted strings
    .replace(DOUBLE_QUOTED_STRING, '""'); // Remove double-quoted strings

  // Priority 1: Check for RETURNING (highest priority - makes any query return rows)
  if (RETURNING_KEYWORD.test(cleaned)) {
    return { canReturnRows: true };
  }

  // Priority 2: Check for mutations (these don't return rows unless they have RETURNING)
  if (MUTATION_KEYWORDS.test(cleaned)) {
    return { canReturnRows: false };
  }

  // Priority 3: Check for queries (these return rows)
  if (QUERY_KEYWORDS.test(cleaned)) {
    return { canReturnRows: true };
  }

  // Default: doesn't return rows
  return { canReturnRows: false };
}
