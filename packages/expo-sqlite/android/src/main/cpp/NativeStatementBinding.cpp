// Copyright 2015-present 650 Industries. All rights reserved.

#include "NativeStatementBinding.h"

#include <android/log.h>
#include "Exceptions.h"

namespace jni = facebook::jni;

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
  return ::exsqlite3_bind_parameter_index(stmt, name.c_str());
}

int NativeStatementBinding::sqlite3_clear_bindings() {
  return ::exsqlite3_clear_bindings(stmt);
}

int NativeStatementBinding::sqlite3_column_count() {
  return ::exsqlite3_column_count(stmt);
}

std::string NativeStatementBinding::sqlite3_column_name(int index) {
  return ::exsqlite3_column_name(stmt, index);
}

int NativeStatementBinding::sqlite3_finalize() {
  return ::exsqlite3_finalize(stmt);
}

int NativeStatementBinding::sqlite3_reset() { return ::exsqlite3_reset(stmt); }

int NativeStatementBinding::sqlite3_step() { return ::exsqlite3_step(stmt); }

int NativeStatementBinding::bindStatementParam(
    int index, jni::alias_ref<jni::JObject> param) {
  int ret = -1;
  if (param == nullptr) {
    ret = exsqlite3_bind_null(stmt, index);
  } else if (param->isInstanceOf(jni::JInteger::javaClassStatic())) {
    ret = exsqlite3_bind_int(stmt, index,
                           jni::static_ref_cast<jni::JInteger>(param)->value());
  } else if (param->isInstanceOf(jni::JLong::javaClassStatic())) {
    ret = exsqlite3_bind_int64(stmt, index,
                             jni::static_ref_cast<jni::JLong>(param)->value());
  } else if (param->isInstanceOf(jni::JDouble::javaClassStatic())) {
    ret = exsqlite3_bind_double(
        stmt, index, jni::static_ref_cast<jni::JDouble>(param)->value());
  } else if (param->isInstanceOf(jni::JBoolean::javaClassStatic())) {
    ret = exsqlite3_bind_int(
        stmt, index,
        jni::static_ref_cast<jni::JBoolean>(param)->value() ? 1 : 0);
  } else if (param->isInstanceOf(jni::JArrayByte::javaClassStatic())) {
    auto byteArray = jni::static_ref_cast<jni::JArrayByte>(param);
    auto data = byteArray->getRegion(0, byteArray->size());
    ret = exsqlite3_bind_blob(stmt, index, data.get(), byteArray->size(),
                            SQLITE_TRANSIENT);
  } else {
    std::string stringArg;
    if (param->isInstanceOf(jni::JString::javaClassStatic())) {
      stringArg = jni::static_ref_cast<jni::JString>(param)->toStdString();
    } else {
      stringArg = param->toString();
    }
    ret = exsqlite3_bind_text(stmt, index, stringArg.c_str(), stringArg.length(),
                            SQLITE_TRANSIENT);
  }
  return ret;
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
  int type = ::exsqlite3_column_type(stmt, index);
  switch (type) {
  case SQLITE_INTEGER: {
    return jni::JLong::valueOf(exsqlite3_column_int64(stmt, index));
  }
  case SQLITE_FLOAT: {
    return jni::JDouble::valueOf(exsqlite3_column_double(stmt, index));
  }
  case SQLITE_TEXT: {
    std::string text(
        reinterpret_cast<const char *>(exsqlite3_column_text(stmt, index)),
        static_cast<size_t>(exsqlite3_column_bytes(stmt, index)));
    return jni::make_jstring(text);
  }
  case SQLITE_BLOB: {
    size_t length = static_cast<size_t>(exsqlite3_column_bytes(stmt, index));
    auto byteArray = jni::JArrayByte::newArray(length);
    byteArray->setRegion(
        0, length,
        static_cast<const signed char *>(exsqlite3_column_blob(stmt, index)));
    return byteArray;
  }
  case SQLITE_NULL: {
    return nullptr;
  }
  default: {
    std::string errorMessage =
        "Unsupported parameter type: " + std::to_string(type);
    jni::throwNewJavaException(
        InvalidConvertibleException::create(errorMessage).get());
  }
  }
}

} // namespace expo
