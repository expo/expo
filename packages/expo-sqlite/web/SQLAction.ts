// Copyright 2015-present 650 Industries. All rights reserved.

export type SQLAction = 'insert' | 'delete' | 'update' | 'unknown';

export function createSQLAction(value: number): SQLAction {
  switch (value) {
    case 9:
      return 'delete';
    case 18:
      return 'insert';
    case 23:
      return 'update';
    default:
      return 'unknown';
  }
}
