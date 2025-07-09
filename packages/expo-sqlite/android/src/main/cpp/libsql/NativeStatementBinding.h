// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#include <fbjni/fbjni.h>
#include <string>

#include "libsql.h"

namespace jni = facebook::jni;

namespace expo {

class NativeDatabaseBinding;

class NativeStatementBinding : public jni::HybridClass<NativeStatementBinding> {
public:
  static constexpr auto kJavaDescriptor =
      "Lexpo/modules/sqlite/NativeStatementBinding;";

  static void registerNatives();

  // sqlite3 bindings
  int sqlite3_bind_parameter_index(const std::string &name);
  int sqlite3_clear_bindings();
  int sqlite3_column_count();
  std::string sqlite3_column_name(int index);
  int sqlite3_finalize();
  int sqlite3_reset();
  int sqlite3_step();

  // helpers
  int bindStatementParam(int index, jni::alias_ref<jni::JObject> param);
  jni::local_ref<jni::JArrayList<jni::JString>> getColumnNames();
  jni::local_ref<jni::JArrayList<jni::JObject>> getColumnValues();

private:
  explicit NativeStatementBinding(
      jni::alias_ref<NativeStatementBinding::jhybridobject> jThis) {}

  jni::local_ref<jni::JObject> getColumnValue(int index);
  libsql_rows_t getRows();

private:
  static jni::local_ref<jhybriddata>
  initHybrid(jni::alias_ref<jhybridobject> jThis);

private:
  friend HybridBase;
  friend NativeDatabaseBinding;

  libsql_stmt_t stmt = nullptr;
  libsql_rows_t rows = nullptr;
  libsql_row_t currentRow = nullptr;
};

} // namespace expo
