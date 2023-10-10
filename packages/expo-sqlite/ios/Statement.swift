// Copyright 2015-present 650 Industries. All rights reserved.

typealias StatementId = Int

struct Statement {
  let id: StatementId
  let instance: OpaquePointer?

  init(id: StatementId, instance: OpaquePointer?) {
    self.id = id
    self.instance = instance
  }

  private static var nextId: StatementId = 1
  /**
   Returns the next statement ID and increases the counter.
   */
  @discardableResult
  static func pullNextId() -> StatementId {
    let id = nextId
    nextId += 1
    return id
  }
}
