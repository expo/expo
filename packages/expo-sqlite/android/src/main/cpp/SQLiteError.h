// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#include <string>
#include "sqlite3.h"

namespace expo {

// Keep SQLite's connection error state stable until its message has been copied.
// SQLite's database mutex is recursive, so the operation can acquire it internally too.
class SQLiteDatabaseLock {
public:
  explicit SQLiteDatabaseLock(sqlite3 *db) : mutex(exsqlite3_db_mutex(db)) {
    exsqlite3_mutex_enter(mutex);
  }
  ~SQLiteDatabaseLock() { exsqlite3_mutex_leave(mutex); }
  SQLiteDatabaseLock(const SQLiteDatabaseLock &) = delete;
  SQLiteDatabaseLock &operator=(const SQLiteDatabaseLock &) = delete;

private:
  exsqlite3_mutex *mutex;
};

// Call while holding SQLiteDatabaseLock; use the operation's returned code, not a later errcode().
inline std::string sqliteErrorMessage(sqlite3 *db, int code) {
  return "Error code " + std::to_string(code) + ": " + exsqlite3_errmsg(db);
}

inline std::string sqliteErrorMessage(int code) {
  return "Error code " + std::to_string(code) + ": " + exsqlite3_errstr(code);
}

} // namespace expo
