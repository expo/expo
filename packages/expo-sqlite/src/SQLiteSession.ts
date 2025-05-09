import { type NativeDatabase } from './NativeDatabase';
import { NativeSession, type Changeset } from './NativeSession';

export { type Changeset };

/**
 * A class that represents an instance of the SQLite session extension.
 * @see [Session Extension](https://www.sqlite.org/sessionintro.html)
 */
export class SQLiteSession {
  constructor(
    private readonly nativeDatabase: NativeDatabase,
    private readonly nativeSession: NativeSession
  ) {}

  //#region Asynchronous API

  /**
   * Attach a table to the session asynchronously.
   * @see [`sqlite3session_attach`](https://www.sqlite.org/session/sqlite3session_attach.html)
   * @param table The table to attach. If `null`, all tables are attached.
   */
  public attachAsync(table: string | null): Promise<void> {
    return this.nativeSession.attachAsync(this.nativeDatabase, table);
  }

  /**
   * Enable or disable the session asynchronously.
   * @see [`sqlite3session_enable`](https://www.sqlite.org/session/sqlite3session_enable.html)
   * @param enabled Whether to enable or disable the session.
   */
  public enableAsync(enabled: boolean): Promise<void> {
    return this.nativeSession.enableAsync(this.nativeDatabase, enabled);
  }

  /**
   * Close the session asynchronously.
   * @see [`sqlite3session_delete`](https://www.sqlite.org/session/sqlite3session_delete.html)
   */
  public closeAsync(): Promise<void> {
    return this.nativeSession.closeAsync(this.nativeDatabase);
  }

  /**
   * Create a changeset asynchronously.
   * @see [`sqlite3session_changeset`](https://www.sqlite.org/session/sqlite3session_changeset.html)
   */
  public createChangesetAsync(): Promise<Changeset> {
    return this.nativeSession.createChangesetAsync(this.nativeDatabase);
  }

  /**
   * Create an inverted changeset asynchronously.
   * This is a shorthand for [`createChangesetAsync()`](#createchangesetasync) + [`invertChangesetAsync()`](#invertchangesetasyncchangeset).
   */
  public createInvertedChangesetAsync(): Promise<Changeset> {
    return this.nativeSession.createInvertedChangesetAsync(this.nativeDatabase);
  }

  /**
   * Apply a changeset asynchronously.
   * @see [`sqlite3changeset_apply`](https://www.sqlite.org/session/sqlite3changeset_apply.html)
   * @param changeset The changeset to apply.
   */
  public applyChangesetAsync(changeset: Changeset): Promise<void> {
    return this.nativeSession.applyChangesetAsync(this.nativeDatabase, changeset);
  }

  /**
   * Invert a changeset asynchronously.
   * @see [`sqlite3changeset_invert`](https://www.sqlite.org/session/sqlite3changeset_invert.html)
   * @param changeset The changeset to invert.
   */
  public invertChangesetAsync(changeset: Changeset): Promise<Changeset> {
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
  public attachSync(table: string | null): void {
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
  public enableSync(enabled: boolean): void {
    this.nativeSession.enableSync(this.nativeDatabase, enabled);
  }

  /**
   * Close the session synchronously.
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @see [`sqlite3session_delete`](https://www.sqlite.org/session/sqlite3session_delete.html)
   */
  public closeSync(): void {
    this.nativeSession.closeSync(this.nativeDatabase);
  }

  /**
   * Create a changeset synchronously.
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @see [`sqlite3session_changeset`](https://www.sqlite.org/session/sqlite3session_changeset.html)
   */
  public createChangesetSync(): Changeset {
    return this.nativeSession.createChangesetSync(this.nativeDatabase);
  }

  /**
   * Create an inverted changeset synchronously.
   * This is a shorthand for [`createChangesetSync()`](#createchangesetsync) + [`invertChangesetSync()`](#invertchangesetsyncchangeset).
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   */
  public createInvertedChangesetSync(): Changeset {
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
  public applyChangesetSync(changeset: Changeset): void {
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
  public invertChangesetSync(changeset: Changeset): Changeset {
    return this.nativeSession.invertChangesetSync(this.nativeDatabase, changeset);
  }

  //#endregion
}
