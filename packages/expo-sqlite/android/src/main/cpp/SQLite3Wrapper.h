// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#include <fbjni/fbjni.h>
#include <string>

#include "sqlite3.h"

namespace jni = facebook::jni;

namespace expo {

class SQLite3Wrapper : public jni::HybridClass<SQLite3Wrapper> {
public:
  static constexpr auto kJavaDescriptor =
      "Lexpo/modules/sqlite/SQLite3Wrapper;";

  static void registerNatives();

  jni::local_ref<jni::JList<jni::JObject>>
  executeSql(const std::string &sql,
             jni::alias_ref<jni::JList<jni::JObject>> args, bool readOnly);

  // sqlite3 bindings
  int sqlite3_open(const std::string &dbPath);
  int sqlite3_close();

private:
  explicit SQLite3Wrapper(jni::alias_ref<SQLite3Wrapper::jhybridobject> jThis)
      : javaPart_(jni::make_global(jThis)) {}

private:
  static jni::local_ref<jhybriddata>
  initHybrid(jni::alias_ref<jhybridobject> jThis);

  static jni::local_ref<jni::JString> convertSqlLiteErrorToString(sqlite3 *db);

  static void bindStatement(exsqlite3_stmt *statement,
                            jni::alias_ref<jni::JObject> arg, int index);

  static jni::local_ref<jni::JObject>
  getSqlValue(int columnType, exsqlite3_stmt *statement, int index);

  static void OnUpdateHook(void *arg, int action, char const *dbName,
                           char const *tableName, sqlite3_int64 rowId);

private:
  friend HybridBase;

  jni::global_ref<SQLite3Wrapper::javaobject> javaPart_;
  sqlite3 *db;
};

} // namespace expo
