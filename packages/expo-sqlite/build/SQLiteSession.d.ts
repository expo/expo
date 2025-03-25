import { type NativeDatabase } from './NativeDatabase';
import { NativeSession, type Changeset } from './NativeSession';
export { type Changeset };
/**
 * A class that represents an instance of the SQLite session extension.
 * @see [Session Extension](https://www.sqlite.org/sessionintro.html)
 */
export declare class SQLiteSession {
    private readonly nativeDatabase;
    private readonly nativeSession;
    constructor(nativeDatabase: NativeDatabase, nativeSession: NativeSession);
    /**
     * Attach a table to the session asynchronously.
     * @see [`sqlite3session_attach`](https://www.sqlite.org/session/sqlite3session_attach.html)
     * @param table The table to attach. If `null`, all tables are attached.
     */
    attachAsync(table: string | null): Promise<void>;
    /**
     * Enable or disable the session asynchronously.
     * @see [`sqlite3session_enable`](https://www.sqlite.org/session/sqlite3session_enable.html)
     * @param enabled Whether to enable or disable the session.
     */
    enableAsync(enabled: boolean): Promise<void>;
    /**
     * Close the session asynchronously.
     * @see [`sqlite3session_delete`](https://www.sqlite.org/session/sqlite3session_delete.html)
     */
    closeAsync(): Promise<void>;
    /**
     * Create a changeset asynchronously.
     * @see [`sqlite3session_changeset`](https://www.sqlite.org/session/sqlite3session_changeset.html)
     */
    createChangesetAsync(): Promise<Changeset>;
    /**
     * Create an inverted changeset asynchronously.
     * This is a shorthand for [`createChangesetAsync()`](#createchangesetasync) + [`invertChangesetAsync()`](#invertchangesetasync).
     */
    createInvertedChangesetAsync(): Promise<Changeset>;
    /**
     * Apply a changeset asynchronously.
     * @see [`sqlite3changeset_apply`](https://www.sqlite.org/session/sqlite3changeset_apply.html)
     * @param changeset The changeset to apply.
     */
    applyChangesetAsync(changeset: Changeset): Promise<void>;
    /**
     * Invert a changeset asynchronously.
     * @see [`sqlite3changeset_invert`](https://www.sqlite.org/session/sqlite3changeset_invert.html)
     * @param changeset The changeset to invert.
     */
    invertChangesetAsync(changeset: Changeset): Promise<Changeset>;
    /**
     * Attach a table to the session synchronously.
     * @see [`sqlite3session_attach`](https://www.sqlite.org/session/sqlite3session_attach.html)
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param table The table to attach.
     */
    attachSync(table: string | null): void;
    /**
     * Enable or disable the session synchronously.
     * @see [`sqlite3session_enable`](https://www.sqlite.org/session/sqlite3session_enable.html)
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param enabled Whether to enable or disable the session.
     */
    enableSync(enabled: boolean): void;
    /**
     * Close the session synchronously.
     * @see [`sqlite3session_delete`](https://www.sqlite.org/session/sqlite3session_delete.html)
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     */
    closeSync(): void;
    /**
     * Create a changeset synchronously.
     * @see [`sqlite3session_changeset`](https://www.sqlite.org/session/sqlite3session_changeset.html)
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     */
    createChangesetSync(): Changeset;
    /**
     * Create an inverted changeset synchronously.
     * This is a shorthand for [`createChangesetSync()`](#createchangesetsync) + [`invertChangesetSync()`](#invertchangesetsync).
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     */
    createInvertedChangesetSync(): Changeset;
    /**
     * Apply a changeset synchronously.
     * @see [`sqlite3changeset_apply`](https://www.sqlite.org/session/sqlite3changeset_apply.html)
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param changeset The changeset to apply.
     */
    applyChangesetSync(changeset: Changeset): void;
    /**
     * Invert a changeset synchronously.
     * @see [`sqlite3changeset_invert`](https://www.sqlite.org/session/sqlite3changeset_invert.html)
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param changeset The changeset to invert.
     */
    invertChangesetSync(changeset: Changeset): Changeset;
}
//# sourceMappingURL=SQLiteSession.d.ts.map