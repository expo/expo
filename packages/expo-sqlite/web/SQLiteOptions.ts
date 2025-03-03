// Copyright 2015-present 650 Industries. All rights reserved.

import { type SQLiteOpenOptions } from '../src/NativeDatabase';

export class SQLiteOptions implements SQLiteOpenOptions {
  enableChangeListener = false;
  useNewConnection = false;
  finalizeUnusedStatementsBeforeClosing = true;

  constructor(optionsObject: SQLiteOpenOptions) {
    this.enableChangeListener = optionsObject.enableChangeListener ?? false;
    this.useNewConnection = optionsObject.useNewConnection ?? false;
    this.finalizeUnusedStatementsBeforeClosing =
      optionsObject.finalizeUnusedStatementsBeforeClosing ?? true;
  }

  equals(other: SQLiteOptions): boolean {
    return (
      this.enableChangeListener === other.enableChangeListener &&
      this.finalizeUnusedStatementsBeforeClosing === other.finalizeUnusedStatementsBeforeClosing &&
      this.useNewConnection === other.useNewConnection
    );
  }

  toString(): string {
    return JSON.stringify({
      enableChangeListener: this.enableChangeListener,
      finalizeUnusedStatementsBeforeClosing: this.finalizeUnusedStatementsBeforeClosing,
      useNewConnection: this.useNewConnection,
    });
  }
}
