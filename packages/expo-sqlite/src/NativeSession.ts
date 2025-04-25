/**
 * A type that represents a changeset.
 */
export type Changeset = Uint8Array;

export type SQLiteAnyDatabase = any;

export declare class NativeSession {
  //#region Asynchronous API

  public attachAsync(database: SQLiteAnyDatabase, table: string | null): Promise<void>;
  public enableAsync(database: SQLiteAnyDatabase, enabled: boolean): Promise<void>;
  public closeAsync(database: SQLiteAnyDatabase): Promise<void>;

  public createChangesetAsync(database: SQLiteAnyDatabase): Promise<Changeset>;
  public createInvertedChangesetAsync(database: SQLiteAnyDatabase): Promise<Changeset>;
  public applyChangesetAsync(database: SQLiteAnyDatabase, changeset: Changeset): Promise<void>;
  public invertChangesetAsync(
    database: SQLiteAnyDatabase,
    changeset: Changeset
  ): Promise<Changeset>;

  //#endregion

  //#region Synchronous API

  public attachSync(database: SQLiteAnyDatabase, table: string | null): void;
  public enableSync(database: SQLiteAnyDatabase, enabled: boolean): void;
  public closeSync(database: SQLiteAnyDatabase): void;

  public createChangesetSync(database: SQLiteAnyDatabase): Changeset;
  public createInvertedChangesetSync(database: SQLiteAnyDatabase): Changeset;
  public applyChangesetSync(database: SQLiteAnyDatabase, changeset: Changeset): void;
  public invertChangesetSync(database: SQLiteAnyDatabase, changeset: Changeset): Changeset;

  //#endregion
}
