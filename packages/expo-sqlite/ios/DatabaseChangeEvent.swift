// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// Payload of the `onDatabaseChange` event, emitted from the SQLite update hook when a row changes.
@Record
struct DatabaseChangeEvent {
  var databaseName: String
  var databaseFilePath: String
  var tableName: String
  // A `Double` rather than SQLite's `Int64` or an `Int`: JavaScript reads the row id as a number, an
  // `Int64` would encode as a BigInt, and an `Int` throws above 2^53, which would drop the event. Above
  // 2^53 it loses precision, like integer columns do.
  var rowId: Double
  var typeId: SQLAction
}
