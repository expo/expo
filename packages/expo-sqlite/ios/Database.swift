// Copyright 2015-present 650 Industries. All rights reserved.

typealias DatabaseId = Int

struct Database {
  let id: DatabaseId
  let dbName: String
  let openOptions: OpenDatabaseOptions
  let instance: OpaquePointer?

  init(id: DatabaseId, dbName: String, openOptions: OpenDatabaseOptions, instance: OpaquePointer?) {
    self.id = id
    self.dbName = dbName
    self.openOptions = openOptions
    self.instance = instance
  }

  private static var nextId: DatabaseId = 1
  /**
   Returns the next database ID and increases the counter.
   */
  @discardableResult
  static func pullNextId() -> DatabaseId {
    let id = nextId
    nextId += 1
    return id
  }
}
