// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#include <fbjni/fbjni.h>
#include <string>

#include "NativeDatabaseBinding.h"
#include "sqlite3.h"

namespace jni = facebook::jni;

namespace expo {

class NativeSessionBinding : public jni::HybridClass<NativeSessionBinding> {
public:
  static constexpr auto kJavaDescriptor =
      "Lexpo/modules/sqlite/NativeSessionBinding;";

  static void registerNatives();

  // sqlite3session bindings
  int sqlite3session_create(
      jni::alias_ref<NativeDatabaseBinding::javaobject> db,
      const std::string &dbName);
  int sqlite3session_attach(jni::alias_ref<jni::JString> tableName);
  int sqlite3session_enable(bool enabled);
  void sqlite3session_delete();
  jni::local_ref<jni::JArrayByte> sqlite3session_changeset();
  jni::local_ref<jni::JArrayByte> sqlite3session_changeset_inverted();
  int sqlite3changeset_apply(
      jni::alias_ref<NativeDatabaseBinding::javaobject> db,
      jni::alias_ref<jni::JArrayByte> changeset);
  jni::local_ref<jni::JArrayByte>
  sqlite3changeset_invert(jni::alias_ref<jni::JArrayByte> changeset);

private:
  explicit NativeSessionBinding(
      jni::alias_ref<NativeSessionBinding::jhybridobject> jThis) {}

private:
  static jni::local_ref<jhybriddata>
  initHybrid(jni::alias_ref<jhybridobject> jThis);

private:
  friend HybridBase;
  friend NativeDatabaseBinding;

  ::exsqlite3_session *session;
};

} // namespace expo
