// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#include <fbjni/fbjni.h>
#include <string>

#include "sqlite3.h"

namespace jni = facebook::jni;

namespace expo {

class NativeDatabaseBinding;

/**
 * A convenient wrapper for the ArrayMap
 */
template <typename K = jobject, typename V = jobject>
struct ArrayMap : public jni::JavaClass<ArrayMap<K, V>, jni::JMap<K, V>> {
  static auto constexpr kJavaDescriptor = "Landroid/util/ArrayMap;";

  static jni::local_ref<typename ArrayMap<K, V>::javaobject>
  create(int capacity) {
    return ArrayMap<K, V>::newInstance(capacity);
  }
};

class NativeStatementBinding : public jni::HybridClass<NativeStatementBinding> {
public:
  static constexpr auto kJavaDescriptor =
      "Lexpo/modules/sqlite/NativeStatementBinding;";

  static void registerNatives();

  // sqlite3 bindings
  int sqlite3_bind_parameter_index(const std::string &name);
  int sqlite3_column_count();
  std::string sqlite3_column_name(int index);
  int sqlite3_finalize();
  int sqlite3_reset();
  int sqlite3_step();

  // helpers
  int bindStatementParam(int index, jni::alias_ref<jni::JObject> param);
  jni::local_ref<ArrayMap<jni::JString, jni::JObject>> getRow();

private:
  explicit NativeStatementBinding(
      jni::alias_ref<NativeStatementBinding::jhybridobject> jThis)
      : javaPart_(jni::make_global(jThis)) {}

  jni::local_ref<jni::JObject> getColumnValue(int index);

private:
  static jni::local_ref<jhybriddata>
  initHybrid(jni::alias_ref<jhybridobject> jThis);

private:
  friend HybridBase;
  friend NativeDatabaseBinding;

  jni::global_ref<NativeStatementBinding::javaobject> javaPart_;
  sqlite3_stmt *stmt;
};

/**
 * A convenient wrapper for the Kotlin CodedException.
 * TODO: Add prefabPublishing from expo-modules-core and remove the duplicated
 * definition.
 */
class CodedException : public jni::JavaClass<CodedException, jni::JThrowable> {
public:
  static auto constexpr kJavaDescriptor =
      "Lexpo/modules/kotlin/exception/CodedException;";

  static jni::local_ref<CodedException> create(const std::string &message);
};

/**
 * A convenient wrapper for the Kotlin InvalidConvertibleException.
 */
class InvalidConvertibleException
    : public jni::JavaClass<InvalidConvertibleException, CodedException> {
public:
  static auto constexpr kJavaDescriptor =
      "Lexpo/modules/sqlite/InvalidConvertibleException;";

  static jni::local_ref<InvalidConvertibleException>
  create(const std::string &message) {
    return InvalidConvertibleException::newInstance(jni::make_jstring(message));
  }
};

} // namespace expo
