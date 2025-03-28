// Copyright 2015-present 650 Industries. All rights reserved.

#include "NativeSessionBinding.h"

#include "Exceptions.h"

namespace expo {

void NativeSessionBinding::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", NativeSessionBinding::initHybrid),
      makeNativeMethod("sqlite3session_create",
                       NativeSessionBinding::sqlite3session_create),
      makeNativeMethod("sqlite3session_attach",
                       NativeSessionBinding::sqlite3session_attach),
      makeNativeMethod("sqlite3session_enable",
                       NativeSessionBinding::sqlite3session_enable),
      makeNativeMethod("sqlite3session_delete",
                       NativeSessionBinding::sqlite3session_delete),
      makeNativeMethod("sqlite3session_changeset",
                       NativeSessionBinding::sqlite3session_changeset),
      makeNativeMethod("sqlite3session_changeset_inverted",
                       NativeSessionBinding::sqlite3session_changeset_inverted),
      makeNativeMethod("sqlite3changeset_apply",
                       NativeSessionBinding::sqlite3changeset_apply),
      makeNativeMethod("sqlite3changeset_invert",
                       NativeSessionBinding::sqlite3changeset_invert),
  });
}

// static
jni::local_ref<NativeSessionBinding::jhybriddata>
NativeSessionBinding::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

int NativeSessionBinding::sqlite3session_create(
    jni::alias_ref<NativeDatabaseBinding::javaobject> db,
    const std::string &dbName) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return -1;
}

int NativeSessionBinding::sqlite3session_attach(
    jni::alias_ref<jni::JString> tableName) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return -1;
}

int NativeSessionBinding::sqlite3session_enable(bool enabled) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return -1;
}

void NativeSessionBinding::sqlite3session_delete() {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
}

jni::local_ref<jni::JArrayByte>
NativeSessionBinding::sqlite3session_changeset() {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return nullptr;
}

jni::local_ref<jni::JArrayByte>
NativeSessionBinding::sqlite3session_changeset_inverted() {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return nullptr;
}

int NativeSessionBinding::sqlite3changeset_apply(
    jni::alias_ref<NativeDatabaseBinding::javaobject> db,
    jni::alias_ref<jni::JArrayByte> changeset) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return -1;
}

jni::local_ref<jni::JArrayByte> NativeSessionBinding::sqlite3changeset_invert(
    jni::alias_ref<jni::JArrayByte> changeset) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return nullptr;
}

} // namespace expo
