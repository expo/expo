/**
 * A class that represents an instance of the SQLite session extension.
 * @see [Session Extension](https://www.sqlite.org/sessionintro.html)
 */
export class SQLiteSession {
    nativeDatabase;
    nativeSession;
    constructor(nativeDatabase, nativeSession) {
        this.nativeDatabase = nativeDatabase;
        this.nativeSession = nativeSession;
    }
    //#region Asynchronous API
    /**
     * Attach a table to the session asynchronously.
     * @see [`sqlite3session_attach`](https://www.sqlite.org/session/sqlite3session_attach.html)
     * @param table The table to attach. If `null`, all tables are attached.
     */
    attachAsync(table) {
        return this.nativeSession.attachAsync(this.nativeDatabase, table);
    }
    /**
     * Enable or disable the session asynchronously.
     * @see [`sqlite3session_enable`](https://www.sqlite.org/session/sqlite3session_enable.html)
     * @param enabled Whether to enable or disable the session.
     */
    enableAsync(enabled) {
        return this.nativeSession.enableAsync(this.nativeDatabase, enabled);
    }
    /**
     * Close the session asynchronously.
     * @see [`sqlite3session_delete`](https://www.sqlite.org/session/sqlite3session_delete.html)
     */
    closeAsync() {
        return this.nativeSession.closeAsync(this.nativeDatabase);
    }
    /**
     * Create a changeset asynchronously.
     * @see [`sqlite3session_changeset`](https://www.sqlite.org/session/sqlite3session_changeset.html)
     */
    createChangesetAsync() {
        return this.nativeSession.createChangesetAsync(this.nativeDatabase);
    }
    /**
     * Create an inverted changeset asynchronously.
     * This is a shorthand for [`createChangesetAsync()`](#createchangesetasync) + [`invertChangesetAsync()`](#invertchangesetasyncchangeset).
     */
    createInvertedChangesetAsync() {
        return this.nativeSession.createInvertedChangesetAsync(this.nativeDatabase);
    }
    /**
     * Apply a changeset asynchronously.
     * @see [`sqlite3changeset_apply`](https://www.sqlite.org/session/sqlite3changeset_apply.html)
     * @param changeset The changeset to apply.
     */
    applyChangesetAsync(changeset) {
        return this.nativeSession.applyChangesetAsync(this.nativeDatabase, changeset);
    }
    /**
     * Invert a changeset asynchronously.
     * @see [`sqlite3changeset_invert`](https://www.sqlite.org/session/sqlite3changeset_invert.html)
     * @param changeset The changeset to invert.
     */
    invertChangesetAsync(changeset) {
        return this.nativeSession.invertChangesetAsync(this.nativeDatabase, changeset);
    }
    //#endregion
    //#region Synchronous API
    /**
     * Attach a table to the session synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param table The table to attach.
     * @see [`sqlite3session_attach`](https://www.sqlite.org/session/sqlite3session_attach.html)
     */
    attachSync(table) {
        this.nativeSession.attachSync(this.nativeDatabase, table);
    }
    /**
     * Enable or disable the session synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param enabled Whether to enable or disable the session.
     * @see [`sqlite3session_enable`](https://www.sqlite.org/session/sqlite3session_enable.html)
     */
    enableSync(enabled) {
        this.nativeSession.enableSync(this.nativeDatabase, enabled);
    }
    /**
     * Close the session synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @see [`sqlite3session_delete`](https://www.sqlite.org/session/sqlite3session_delete.html)
     */
    closeSync() {
        this.nativeSession.closeSync(this.nativeDatabase);
    }
    /**
     * Create a changeset synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @see [`sqlite3session_changeset`](https://www.sqlite.org/session/sqlite3session_changeset.html)
     */
    createChangesetSync() {
        return this.nativeSession.createChangesetSync(this.nativeDatabase);
    }
    /**
     * Create an inverted changeset synchronously.
     * This is a shorthand for [`createChangesetSync()`](#createchangesetsync) + [`invertChangesetSync()`](#invertchangesetsyncchangeset).
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     */
    createInvertedChangesetSync() {
        return this.nativeSession.createInvertedChangesetSync(this.nativeDatabase);
    }
    /**
     * Apply a changeset synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param changeset The changeset to apply.
     * @see [`sqlite3changeset_apply`](https://www.sqlite.org/session/sqlite3changeset_apply.html)
     */
    applyChangesetSync(changeset) {
        this.nativeSession.applyChangesetSync(this.nativeDatabase, changeset);
    }
    /**
     * Invert a changeset synchronously.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param changeset The changeset to invert.
     * @see [`sqlite3changeset_invert`](https://www.sqlite.org/session/sqlite3changeset_invert.html)
     */
    invertChangesetSync(changeset) {
        return this.nativeSession.invertChangesetSync(this.nativeDatabase, changeset);
    }
}
//# sourceMappingURL=SQLiteSession.js.map