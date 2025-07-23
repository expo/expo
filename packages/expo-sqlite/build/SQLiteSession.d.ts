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
     * This is a shorthand for [`createChangesetAsync()`](#createchangesetasync) + [`invertChangesetAsync()`](#invertchangesetasyncchangeset).
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
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param table The table to attach.
     * @see [`sqlite3session_attach`](https://www.sqlite.org/session/sqlite3session_attach.html)
     */
    attachSync(table: string | null): void;
    /**
     * Enable or disable the session synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param enabled Whether to enable or disable the session.
     * @see [`sqlite3session_enable`](https://www.sqlite.org/session/sqlite3session_enable.html)
     */
    enableSync(enabled: boolean): void;
    /**
     * Close the session synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @see [`sqlite3session_delete`](https://www.sqlite.org/session/sqlite3session_delete.html)
     */
    closeSync(): void;
    /**
     * Create a changeset synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @see [`sqlite3session_changeset`](https://www.sqlite.org/session/sqlite3session_changeset.html)
     */
    createChangesetSync(): Changeset;
    /**
     * Create an inverted changeset synchronously.
     * This is a shorthand for [`createChangesetSync()`](#createchangesetsync) + [`invertChangesetSync()`](#invertchangesetsyncchangeset).
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     */
    createInvertedChangesetSync(): Changeset;
    /**
     * Apply a changeset synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param changeset The changeset to apply.
     * @see [`sqlite3changeset_apply`](https://www.sqlite.org/session/sqlite3changeset_apply.html)
     */
    applyChangesetSync(changeset: Changeset): void;
    /**
     * Invert a changeset synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param changeset The changeset to invert.
     * @see [`sqlite3changeset_invert`](https://www.sqlite.org/session/sqlite3changeset_invert.html)
     */
    invertChangesetSync(changeset: Changeset): Changeset;
}
//# sourceMappingURL=SQLiteSession.d.ts.map