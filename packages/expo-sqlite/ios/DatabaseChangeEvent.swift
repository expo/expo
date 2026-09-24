// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// Payload of the `onDatabaseChange` event, emitted from the SQLite update hook when a row changes.
@Record
struct DatabaseChangeEvent {
  var databaseName: String
  var databaseFilePath: String
  var tableName: String
  // `Int` rather than SQLite's `Int64`: a 64-bit integer encodes as a JavaScript BigInt, and JavaScript
  // reads the row id as a number.
  var rowId: Int
  var typeId: SQLAction
}
