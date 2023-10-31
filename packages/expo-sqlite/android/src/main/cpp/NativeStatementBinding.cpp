// Copyright 2015-present 650 Industries. All rights reserved.

#include "NativeStatementBinding.h"

#include <android/log.h>

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
      makeNativeMethod("getRow", NativeStatementBinding::getRow),
  });
}

int NativeStatementBinding::sqlite3_bind_parameter_index(
    const std::string &name) {
  return ::sqlite3_bind_parameter_index(stmt, name.c_str());
}

int NativeStatementBinding::sqlite3_column_count() {
  return ::sqlite3_column_count(stmt);
}

std::string NativeStatementBinding::sqlite3_column_name(int index) {
  return ::sqlite3_column_name(stmt, index);
}

int NativeStatementBinding::sqlite3_finalize() {
  return ::sqlite3_finalize(stmt);
}

int NativeStatementBinding::sqlite3_reset() { return ::sqlite3_reset(stmt); }

int NativeStatementBinding::sqlite3_step() { return ::sqlite3_step(stmt); }

int NativeStatementBinding::bindStatementParam(
    int index, jni::alias_ref<jni::JObject> param) {
  static const auto integerClass = jni::JInteger::javaClassStatic();
  static const auto longClass = jni::JLong::javaClassStatic();
  static const auto doubleClass = jni::JDouble::javaClassStatic();
  static const auto stringClass = jni::JString::javaClassStatic();
  static const auto booleanClass = jni::JBoolean::javaClassStatic();

  int ret = -1;
  if (param == nullptr) {
    ret = sqlite3_bind_null(stmt, index);
  } else if (param->isInstanceOf(integerClass)) {
    ret = sqlite3_bind_int(stmt, index,
                           jni::static_ref_cast<jni::JInteger>(param)->value());
  } else if (param->isInstanceOf(longClass)) {
    ret = sqlite3_bind_int64(stmt, index,
                             jni::static_ref_cast<jni::JLong>(param)->value());
  } else if (param->isInstanceOf(doubleClass)) {
    ret = sqlite3_bind_double(
        stmt, index, jni::static_ref_cast<jni::JDouble>(param)->value());
  } else if (param->isInstanceOf(booleanClass)) {
    ret = sqlite3_bind_int(
        stmt, index,
        jni::static_ref_cast<jni::JBoolean>(param)->value() ? 1 : 0);
  } else {
    std::string stringArg;
    if (param->isInstanceOf(stringClass)) {
      stringArg = jni::static_ref_cast<jni::JString>(param)->toStdString();
    } else {
      stringArg = param->toString();
    }
    ret = sqlite3_bind_text(stmt, index, stringArg.c_str(), stringArg.length(),
                            SQLITE_TRANSIENT);
  }
  return ret;
}

jni::local_ref<ArrayMap<jni::JString, jni::JObject>>
NativeStatementBinding::getRow() {
  int columnCount = sqlite3_column_count();
  auto row = ArrayMap<jni::JString, jni::JObject>::create(columnCount);
  for (int i = 0; i < columnCount; ++i) {
    auto name = sqlite3_column_name(i);
    auto value = getColumnValue(i);
    row->put(jni::make_jstring(name), value);
  }
  return row;
}

// static
jni::local_ref<NativeStatementBinding::jhybriddata>
NativeStatementBinding::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

jni::local_ref<jni::JObject> NativeStatementBinding::getColumnValue(int index) {
  int type = ::sqlite3_column_type(stmt, index);
  switch (type) {
  case SQLITE_INTEGER: {
    return jni::JLong::valueOf(sqlite3_column_int64(stmt, index));
  }
  case SQLITE_FLOAT: {
    return jni::JDouble::valueOf(sqlite3_column_double(stmt, index));
  }
  case SQLITE_TEXT: {
    std::string text(
        reinterpret_cast<const char *>(sqlite3_column_text(stmt, index)),
        static_cast<size_t>(sqlite3_column_bytes(stmt, index)));
    return jni::make_jstring(text);
  }
  case SQLITE_BLOB: {
    JNIEnv *env = jni::Environment::current();
    return jni::adopt_local(env->NewString(
        reinterpret_cast<const jchar *>(sqlite3_column_blob(stmt, index)),
        static_cast<size_t>(sqlite3_column_bytes(stmt, index))));
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
