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
  return ::exsqlite3session_create(db->cthis()->rawdb(), dbName.c_str(),
                                   &session);
}

int NativeSessionBinding::sqlite3session_attach(
    jni::alias_ref<jni::JString> tableName) {
  if (tableName) {
    return ::exsqlite3session_attach(session, tableName->toStdString().c_str());
  }
  return ::exsqlite3session_attach(session, nullptr);
}

int NativeSessionBinding::sqlite3session_enable(bool enabled) {
  return ::exsqlite3session_enable(session, enabled ? 1 : 0);
}

void NativeSessionBinding::sqlite3session_delete() {
  ::exsqlite3session_delete(session);
}

jni::local_ref<jni::JArrayByte>
NativeSessionBinding::sqlite3session_changeset() {
  int size = 0;
  void *buffer = nullptr;
  int result = ::exsqlite3session_changeset(session, &size, &buffer);
  if (result != SQLITE_OK) {
    return nullptr;
  }
  if (!buffer) {
    return jni::JArrayByte::newArray(0);
  }
  auto byteArray = jni::JArrayByte::newArray(size);
  byteArray->setRegion(0, size, reinterpret_cast<const signed char *>(buffer));
  ::exsqlite3_free(buffer);
  return byteArray;
}

jni::local_ref<jni::JArrayByte>
NativeSessionBinding::sqlite3session_changeset_inverted() {
  int inSize = 0;
  void *inBuffer = nullptr;
  int result = ::exsqlite3session_changeset(session, &inSize, &inBuffer);
  if (result != SQLITE_OK) {
    return nullptr;
  }
  if (!inBuffer) {
    return jni::JArrayByte::newArray(0);
  }

  int outSize = 0;
  void *outBuffer = nullptr;
  result = ::exsqlite3changeset_invert(inSize, inBuffer, &outSize, &outBuffer);
  if (result != SQLITE_OK) {
    ::exsqlite3_free(inBuffer);
    return nullptr;
  }
  if (!outBuffer) {
    ::exsqlite3_free(inBuffer);
    return jni::JArrayByte::newArray(0);
  }
  auto byteArray = jni::JArrayByte::newArray(outSize);
  byteArray->setRegion(0, outSize,
                       reinterpret_cast<const signed char *>(outBuffer));
  ::exsqlite3_free(outBuffer);
  return byteArray;
}

int NativeSessionBinding::sqlite3changeset_apply(
    jni::alias_ref<NativeDatabaseBinding::javaobject> db,
    jni::alias_ref<jni::JArrayByte> changeset) {
  int size = static_cast<int>(changeset->size());
  auto buffer = changeset->getRegion(0, size);
  auto onConflict = [](void *pCtx, int eConflict,
                       ::exsqlite3_changeset_iter *pIter) -> int {
    return SQLITE_CHANGESET_REPLACE;
  };
  return ::exsqlite3changeset_apply(db->cthis()->rawdb(), size, buffer.get(),
                                    nullptr, onConflict, nullptr);
}

jni::local_ref<jni::JArrayByte> NativeSessionBinding::sqlite3changeset_invert(
    jni::alias_ref<jni::JArrayByte> changeset) {
  int inSize = static_cast<int>(changeset->size());
  auto inBuffer = changeset->getRegion(0, inSize);

  int outSize = 0;
  void *outBuffer = nullptr;

  int result =
      ::exsqlite3changeset_invert(inSize, inBuffer.get(), &outSize, &outBuffer);
  if (result != SQLITE_OK) {
    return nullptr;
  }
  if (!outBuffer) {
    return jni::JArrayByte::newArray(0);
  }
  auto byteArray = jni::JArrayByte::newArray(outSize);
  byteArray->setRegion(0, outSize,
                       reinterpret_cast<const signed char *>(outBuffer));
  ::exsqlite3_free(outBuffer);
  return byteArray;
}

} // namespace expo
