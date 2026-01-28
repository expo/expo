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
  public async createChangesetAsync(): Promise<Changeset> {
    const changesetBuffer = await this.nativeSession.createChangesetAsync(this.nativeDatabase);
    return new Uint8Array(changesetBuffer);
  }

  /**
   * Create an inverted changeset asynchronously.
   * This is a shorthand for [`createChangesetAsync()`](#createchangesetasync) + [`invertChangesetAsync()`](#invertchangesetasyncchangeset).
   */
  public async createInvertedChangesetAsync(): Promise<Changeset> {
    const changesetBuffer = await this.nativeSession.createInvertedChangesetAsync(
      this.nativeDatabase
    );
    return new Uint8Array(changesetBuffer);
  }

  /**
   * Apply a changeset asynchronously.
   * @see [`sqlite3changeset_apply`](https://www.sqlite.org/session/sqlite3changeset_apply.html)
   * @param changeset The changeset to apply.
   */
  public applyChangesetAsync(changeset: Changeset): Promise<void> {
    return this.nativeSession.applyChangesetAsync(
      this.nativeDatabase,
      changeset.buffer as ArrayBuffer
    );
  }

  /**
   * Invert a changeset asynchronously.
   * @see [`sqlite3changeset_invert`](https://www.sqlite.org/session/sqlite3changeset_invert.html)
   * @param changeset The changeset to invert.
   */
  public async invertChangesetAsync(changeset: Changeset): Promise<Changeset> {
    const changesetBuffer = await this.nativeSession.invertChangesetAsync(
      this.nativeDatabase,
      changeset.buffer as ArrayBuffer
    );
    return new Uint8Array(changesetBuffer);
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
    const changesetBuffer = this.nativeSession.createChangesetSync(this.nativeDatabase);
    return new Uint8Array(changesetBuffer);
  }

  /**
   * Create an inverted changeset synchronously.
   * This is a shorthand for [`createChangesetSync()`](#createchangesetsync) + [`invertChangesetSync()`](#invertchangesetsyncchangeset).
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   */
  public createInvertedChangesetSync(): Changeset {
    const changesetBuffer = this.nativeSession.createInvertedChangesetSync(this.nativeDatabase);
    return new Uint8Array(changesetBuffer);
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
    this.nativeSession.applyChangesetSync(this.nativeDatabase, changeset.buffer as ArrayBuffer);
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
    const changesetBuffer = this.nativeSession.invertChangesetSync(
      this.nativeDatabase,
      changeset.buffer as ArrayBuffer
    );
    return new Uint8Array(changesetBuffer);
  }

  //#endregion
}
