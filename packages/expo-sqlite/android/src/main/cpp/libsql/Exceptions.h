// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#include <fbjni/fbjni.h>
#include <string>

namespace jni = facebook::jni;

namespace expo {

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
 * A convenient wrapper for the Kotlin SQLiteErrorException.
 */
class SQLiteErrorException
    : public jni::JavaClass<SQLiteErrorException, CodedException> {
public:
  static auto constexpr kJavaDescriptor =
      "Lexpo/modules/sqlite/SQLiteErrorException;";

  static jni::local_ref<SQLiteErrorException> create(const char *message) {
    if (message) {
      return SQLiteErrorException::newInstance(jni::make_jstring(message));
    }
    return SQLiteErrorException::newInstance(
        jni::make_jstring("Unknown error"));
  }

  static jni::local_ref<SQLiteErrorException>
  create(const std::string &message) {
    return SQLiteErrorException::newInstance(jni::make_jstring(message));
  }

  static jni::local_ref<SQLiteErrorException>
  create(jni::alias_ref<jni::JString> message) {
    return SQLiteErrorException::newInstance(message);
  }
};

/**
 * A convenient wrapper for the Kotlin UnsupportedOperationException.
 */
class UnsupportedOperationException
    : public jni::JavaClass<UnsupportedOperationException, CodedException> {
public:
  static auto constexpr kJavaDescriptor =
      "Lexpo/modules/sqlite/UnsupportedOperationException;";

  static jni::local_ref<UnsupportedOperationException> create() {
    return UnsupportedOperationException::newInstance(jni::make_jstring(""));
  }

  static jni::local_ref<UnsupportedOperationException>
  create(const std::string &message) {
    return UnsupportedOperationException::newInstance(
        jni::make_jstring(message));
  }

  static jni::local_ref<UnsupportedOperationException>
  create(const jni::alias_ref<jni::JString> &message) {
    return UnsupportedOperationException::newInstance(message);
  }
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
