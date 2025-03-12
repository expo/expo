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
  public async attachAsync(table: string | null): Promise<void> {
    await this.nativeSession.attachAsync(this.nativeDatabase, table);
  }

  /**
   * Enable or disable the session asynchronously.
   * @see [`sqlite3session_enable`](https://www.sqlite.org/session/sqlite3session_enable.html)
   * @param enabled Whether to enable or disable the session.
   */
  public async enableAsync(enabled: boolean): Promise<void> {
    await this.nativeSession.enableAsync(this.nativeDatabase, enabled);
  }

  /**
   * Close the session asynchronously.
   * @see [`sqlite3session_delete`](https://www.sqlite.org/session/sqlite3session_delete.html)
   */
  public async closeAsync(): Promise<void> {
    await this.nativeSession.closeAsync(this.nativeDatabase);
  }

  /**
   * Create a changeset asynchronously.
   * @see [`sqlite3session_changeset`](https://www.sqlite.org/session/sqlite3session_changeset.html)
   */
  public async createChangesetAsync(): Promise<Changeset> {
    return this.nativeSession.createChangesetAsync(this.nativeDatabase);
  }

  /**
   * Create an inverted changeset asynchronously.
   * This is a shorthand for [`createChangesetAsync()`](#createchangesetasync) + [`invertChangesetAsync()`](#invertchangesetasync).
   */
  public async createInvertedChangesetAsync(): Promise<Changeset> {
    return this.nativeSession.createInvertedChangesetAsync(this.nativeDatabase);
  }

  /**
   * Apply a changeset asynchronously.
   * @see [`sqlite3changeset_apply`](https://www.sqlite.org/session/sqlite3changeset_apply.html)
   * @param changeset The changeset to apply.
   */
  public async applyChangesetAsync(changeset: Changeset): Promise<void> {
    await this.nativeSession.applyChangesetAsync(this.nativeDatabase, changeset);
  }

  /**
   * Invert a changeset asynchronously.
   * @see [`sqlite3changeset_invert`](https://www.sqlite.org/session/sqlite3changeset_invert.html)
   * @param changeset The changeset to invert.
   */
  public async invertChangesetAsync(changeset: Changeset): Promise<Changeset> {
    return this.nativeSession.invertChangesetAsync(this.nativeDatabase, changeset);
  }

  //#endregion

  //#region Synchronous API

  /**
   * Attach a table to the session synchronously.
   * @see [`sqlite3session_attach`](https://www.sqlite.org/session/sqlite3session_attach.html)
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @param table The table to attach.
   */
  public attachSync(table: string | null): void {
    this.nativeSession.attachSync(this.nativeDatabase, table);
  }

  /**
   * Enable or disable the session synchronously.
   * @see [`sqlite3session_enable`](https://www.sqlite.org/session/sqlite3session_enable.html)
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @param enabled Whether to enable or disable the session.
   */
  public enableSync(enabled: boolean): void {
    this.nativeSession.enableSync(this.nativeDatabase, enabled);
  }

  /**
   * Close the session synchronously.
   * @see [`sqlite3session_delete`](https://www.sqlite.org/session/sqlite3session_delete.html)
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   */
  public closeSync(): void {
    this.nativeSession.closeSync(this.nativeDatabase);
  }

  /**
   * Create a changeset synchronously.
   * @see [`sqlite3session_changeset`](https://www.sqlite.org/session/sqlite3session_changeset.html)
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   */
  public createChangesetSync(): Changeset {
    return this.nativeSession.createChangesetSync(this.nativeDatabase);
  }

  /**
   * Create an inverted changeset synchronously.
   * This is a shorthand for [`createChangesetSync()`](#createchangesetsync) + [`invertChangesetSync()`](#invertchangesetsync).
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   */
  public createInvertedChangesetSync(): Changeset {
    return this.nativeSession.createInvertedChangesetSync(this.nativeDatabase);
  }

  /**
   * Apply a changeset synchronously.
   * @see [`sqlite3changeset_apply`](https://www.sqlite.org/session/sqlite3changeset_apply.html)
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @param changeset The changeset to apply.
   */
  public applyChangesetSync(changeset: Changeset): void {
    this.nativeSession.applyChangesetSync(this.nativeDatabase, changeset);
  }

  /**
   * Invert a changeset synchronously.
   * @see [`sqlite3changeset_invert`](https://www.sqlite.org/session/sqlite3changeset_invert.html)
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @param changeset The changeset to invert.
   */
  public invertChangesetSync(changeset: Changeset): Changeset {
    return this.nativeSession.invertChangesetSync(this.nativeDatabase, changeset);
  }

  //#endregion
}
