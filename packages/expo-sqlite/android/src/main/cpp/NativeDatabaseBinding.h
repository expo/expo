// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#include <fbjni/fbjni.h>
#include <string>

#include "NativeStatementBinding.h"
#include "sqlite3.h"

namespace jni = facebook::jni;

namespace expo {

class NativeDatabaseBinding : public jni::HybridClass<NativeDatabaseBinding> {
public:
  static constexpr auto kJavaDescriptor =
      "Lexpo/modules/sqlite/NativeDatabaseBinding;";

  static void registerNatives();

  // sqlite3 bindings
  int sqlite3_changes();
  int sqlite3_close();
  std::string sqlite3_db_filename(const std::string &databaseName);
  int sqlite3_enable_load_extension(int onoff);
  int sqlite3_exec(const std::string &source);
  int sqlite3_get_autocommit();
  int64_t sqlite3_last_insert_rowid();
  int sqlite3_load_extension(const std::string &libPath,
                             const std::string &entryProc);
  int sqlite3_open(const std::string &dbPath);
  int sqlite3_prepare_v2(
      const std::string &source,
      jni::alias_ref<NativeStatementBinding::javaobject> statement);
  jni::local_ref<jni::JArrayByte>
  sqlite3_serialize(const std::string &databaseName);
  int sqlite3_deserialize(const std::string &databaseName,
                          jni::alias_ref<jni::JArrayByte> serializedData);
  void sqlite3_update_hook(bool enabled);

  // helpers
  jni::local_ref<jni::JString> convertSqlLiteErrorToString();

private:
  explicit NativeDatabaseBinding(
      jni::alias_ref<NativeDatabaseBinding::jhybridobject> jThis)
      : javaPart_(jni::make_global(jThis)) {}

private:
  static jni::local_ref<jhybriddata>
  initHybrid(jni::alias_ref<jhybridobject> jThis);

  static void OnUpdateHook(void *arg, int action, char const *databaseName,
                           char const *tableName, sqlite3_int64 rowId);

private:
  friend HybridBase;

  jni::global_ref<NativeDatabaseBinding::javaobject> javaPart_;
  sqlite3 *db;
};

} // namespace expo
