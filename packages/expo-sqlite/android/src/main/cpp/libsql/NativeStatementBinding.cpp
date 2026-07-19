// Copyright 2015-present 650 Industries. All rights reserved.

#include "NativeStatementBinding.h"

#include "Exceptions.h"
#include <android/log.h>

namespace jni = facebook::jni;

// These return values should be synchronous with NativeDatabaseBinding.kt,
// as we share Kotlin code with SQLite.
#define SQLITE_ROW 100
#define SQLITE_DONE 101

namespace expo {

namespace {

constexpr char TAG[] = "expo-sqlite";

} // namespace

// static
void NativeStatementBinding::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", NativeStatementBinding::initHybrid),
      makeNativeMethod("sqlite3_bind_parameter_index",
                       NativeStatementBinding::sqlite3_bind_parameter_index),
      makeNativeMethod("sqlite3_clear_bindings",
                       NativeStatementBinding::sqlite3_clear_bindings),
      makeNativeMethod("sqlite3_column_count",
                       NativeStatementBinding::sqlite3_column_count),
      makeNativeMethod("sqlite3_column_name",
                       NativeStatementBinding::sqlite3_column_name),
      makeNativeMethod("sqlite3_finalize",
                       NativeStatementBinding::sqlite3_finalize),
      makeNativeMethod("sqlite3_reset", NativeStatementBinding::sqlite3_reset),
      makeNativeMethod("sqlite3_step", NativeStatementBinding::sqlite3_step),
      makeNativeMethod("bindStatementParam",
                       NativeStatementBinding::bindStatementParam),
      makeNativeMethod("getColumnNames",
                       NativeStatementBinding::getColumnNames),
      makeNativeMethod("getColumnValues",
                       NativeStatementBinding::getColumnValues),
  });
}

int NativeStatementBinding::sqlite3_bind_parameter_index(
    const std::string &name) {
  jni::throwNewJavaException(
      UnsupportedOperationException::create(
          "Named parameter binding is not supported in libSQL mode.")
          .get());
  return -1;
}

int NativeStatementBinding::sqlite3_clear_bindings() { return -1; }

int NativeStatementBinding::sqlite3_column_count() {
  return ::libsql_column_count(getRows());
}

std::string NativeStatementBinding::sqlite3_column_name(int index) {
  const char *name;
  const char *errMsg;
  ::libsql_column_name(getRows(), index, &name, &errMsg);
  if (name) {
    return name;
  }
  return "Unknown column name";
}

int NativeStatementBinding::sqlite3_finalize() {
  if (currentRow) {
    ::libsql_free_row(currentRow);
    currentRow = nullptr;
  }
  if (rows) {
    ::libsql_free_rows(rows);
    rows = nullptr;
  }
  ::libsql_free_stmt(stmt);
  return 0;
}

int NativeStatementBinding::sqlite3_reset() {
  const char *errMsg;
  if (rows) {
    ::libsql_free_rows(rows);
    rows = nullptr;
  }
  if (::libsql_reset_stmt(stmt, &errMsg) != 0) {
    jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
  }
  return 0;
}

int NativeStatementBinding::sqlite3_step() {
  const char *errMsg;
  if (currentRow) {
    ::libsql_free_row(currentRow);
    currentRow = nullptr;
  }
  if (libsql_next_row(getRows(), &currentRow, &errMsg) != 0) {
    jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
  }
  return currentRow != nullptr ? SQLITE_ROW : SQLITE_DONE;
}

int NativeStatementBinding::bindStatementParam(
    int index, jni::alias_ref<jni::JObject> param) {
  const char *errMsg;

  if (param == nullptr) {
    return ::libsql_bind_null(stmt, index, &errMsg);
  }

  if (param->isInstanceOf(jni::JInteger::javaClassStatic())) {
    return ::libsql_bind_int(
        stmt, index, jni::static_ref_cast<jni::JInteger>(param)->value(),
        &errMsg);
  }

  if (param->isInstanceOf(jni::JLong::javaClassStatic())) {
    return ::libsql_bind_int(
        stmt, index, jni::static_ref_cast<jni::JLong>(param)->value(), &errMsg);
  }

  if (param->isInstanceOf(jni::JDouble::javaClassStatic())) {
    return ::libsql_bind_float(
        stmt, index, jni::static_ref_cast<jni::JDouble>(param)->value(),
        &errMsg);
  }

  if (param->isInstanceOf(jni::JBoolean::javaClassStatic())) {
    return ::libsql_bind_int(
        stmt, index,
        jni::static_ref_cast<jni::JBoolean>(param)->value() ? 1 : 0, &errMsg);
  }

  if (param->isInstanceOf(jni::JArrayByte::javaClassStatic())) {
    auto byteArray = jni::static_ref_cast<jni::JArrayByte>(param);
    auto data = byteArray->getRegion(0, byteArray->size());
    return ::libsql_bind_blob(
        stmt, index, reinterpret_cast<const unsigned char *>(data.get()),
        byteArray->size(), &errMsg);
  }

  std::string stringArg;
  if (param->isInstanceOf(jni::JString::javaClassStatic())) {
    stringArg = jni::static_ref_cast<jni::JString>(param)->toStdString();
  } else {
    stringArg = param->toString();
  }
  return ::libsql_bind_string(stmt, index, stringArg.c_str(), &errMsg);
}

jni::local_ref<jni::JArrayList<jni::JString>>
NativeStatementBinding::getColumnNames() {
  int columnCount = this->sqlite3_column_count();
  auto columnNames = jni::JArrayList<jni::JString>::create(columnCount);
  for (int i = 0; i < columnCount; ++i) {
    columnNames->add(jni::make_jstring(this->sqlite3_column_name(i)));
  }
  return columnNames;
}

jni::local_ref<jni::JArrayList<jni::JObject>>
NativeStatementBinding::getColumnValues() {
  int columnCount = this->sqlite3_column_count();
  auto columnValues = jni::JArrayList<jni::JObject>::create(columnCount);
  for (int i = 0; i < columnCount; ++i) {
    columnValues->add(getColumnValue(i));
  }
  return columnValues;
}

// static
jni::local_ref<NativeStatementBinding::jhybriddata>
NativeStatementBinding::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

jni::local_ref<jni::JObject> NativeStatementBinding::getColumnValue(int index) {
  const char *errMsg;
  int type;
  if (::libsql_column_type(getRows(), currentRow, index, &type, &errMsg) != 0) {
    jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    return nullptr;
  }

  switch (type) {
  case LIBSQL_INT: {
    long long value;
    if (::libsql_get_int(currentRow, index, &value, &errMsg) != 0) {
      jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    }
    return jni::JLong::valueOf(value);
  }
  case LIBSQL_FLOAT: {
    double value;
    if (::libsql_get_float(currentRow, index, &value, &errMsg) != 0) {
      jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    }
    return jni::JDouble::valueOf(value);
  }
  case LIBSQL_TEXT: {
    const char *value;
    if (::libsql_get_string(currentRow, index, &value, &errMsg) != 0) {
      jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    }
    auto result = jni::make_jstring(value);
    ::libsql_free_string(value);
    return result;
  }
  case LIBSQL_BLOB: {
    blob value;
    if (::libsql_get_blob(currentRow, index, &value, &errMsg) != 0) {
      jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    }
    auto byteArray = jni::JArrayByte::newArray(value.len);
    byteArray->setRegion(0, value.len,
                         reinterpret_cast<const signed char *>(value.ptr));
    ::libsql_free_blob(value);
    return byteArray;
  }
  case LIBSQL_NULL: {
    return nullptr;
  }
  default: {
    std::string errorMessage =
        "Unsupported parameter type: " + std::to_string(type);
    jni::throwNewJavaException(
        InvalidConvertibleException::create(errorMessage).get());
    return nullptr;
  }
  }
  return nullptr;
}

libsql_rows_t NativeStatementBinding::getRows() {
  if (!rows) {
    const char *errMsg;
    if (::libsql_query_stmt(stmt, &rows, &errMsg) != 0) {
      jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    }
    if (!rows) {
      jni::throwNewJavaException(
          SQLiteErrorException::create("libsql_query_stmt returns null rows")
              .get());
    }
  }
  return rows;
}
} // namespace expo
