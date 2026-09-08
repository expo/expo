// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Testing

@testable import ExpoSQLite

/// Exercises the per-statement critical section that `SQLiteModule` takes around every call that
/// touches a `sqlite3_stmt`. The module runs those calls on a concurrent queue, so a shared
/// statement really is reached from several threads at once.
@Suite("StatementLock")
final class StatementLockTests {
  private var database: OpaquePointer?

  init() throws {
    #expect(exsqlite3_open(":memory:", &database) == SQLITE_OK)
    let setup = """
      CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      INSERT INTO test (id, value) VALUES (1, 'one');
      INSERT INTO test (id, value) VALUES (2, 'two');
      INSERT INTO test (id, value) VALUES (3, 'three');
      """
    #expect(exsqlite3_exec(database, setup, nil, nil, nil) == SQLITE_OK)
  }

  deinit {
    exsqlite3_close(database)
  }

  private func makeStatement(_ source: String) throws -> NativeStatement {
    let statement = NativeStatement()
    #expect(exsqlite3_prepare_v2(database, source, -1, &statement.pointer, nil) == SQLITE_OK)
    return statement
  }

  /// Binds `id` and reads the first row, the way `run` does: one critical section per native
  /// call, which is what the module takes. The row read belongs to whichever caller bound the
  /// statement last, so callers assert only that a value the table holds comes back.
  private func runAndReadFirstRow(of statement: NativeStatement, id: Int32) -> String? {
    statement.lock.wait()
    defer {
      statement.lock.signal()
    }
    exsqlite3_reset(statement.pointer)
    exsqlite3_clear_bindings(statement.pointer)
    exsqlite3_bind_int(statement.pointer, 1, id)
    guard exsqlite3_step(statement.pointer) == SQLITE_ROW,
      let text = exsqlite3_column_text(statement.pointer, 0)
    else {
      return nil
    }
    return String(cString: text)
  }

  /// Drains the cursor in its own critical section, the way `getAll` does.
  private func drain(_ statement: NativeStatement) {
    statement.lock.wait()
    defer {
      statement.lock.signal()
    }
    while exsqlite3_step(statement.pointer) == SQLITE_ROW {}
  }

  @Test
  func `hammering one shared statement never reads a torn value`() throws {
    let statement = try makeStatement("SELECT value FROM test WHERE id = ?")
    let stored: Set<String> = ["one", "two", "three"]
    let readValues = Mutex<Set<String>>([])
    // Without the lock on `step`, one thread resets and rebinds the statement while another is
    // mid-step, which is the shape that produced a null `TEXT` column in a field report.
    // Removing the lock from the helpers above fails this test, so it does catch its absence.
    DispatchQueue.concurrentPerform(iterations: 500) { iteration in
      let id = Int32(iteration % 3 + 1)
      if let value = self.runAndReadFirstRow(of: statement, id: id) {
        readValues.withLock { values in
          values.insert(value)
        }
      }
      self.drain(statement)
    }
    // Every value read has to be one the table actually holds: no nulls, no torn strings.
    let values = readValues.withLock { $0 }
    #expect(!values.isEmpty)
    #expect(values.isSubset(of: stored))
    exsqlite3_finalize(statement.pointer)
  }
}
