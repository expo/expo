// Copyright 2015-present 650 Industries. All rights reserved.

#include "NativeDatabaseBinding.h"

#include "Exceptions.h"

namespace jni = facebook::jni;

namespace expo {

namespace {

constexpr char TAG[] = "expo-sqlite";

} // namespace

// static
void NativeDatabaseBinding::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", NativeDatabaseBinding::initHybrid),
      makeNativeMethod("sqlite3_changes",
                       NativeDatabaseBinding::sqlite3_changes),
      makeNativeMethod("sqlite3_close", NativeDatabaseBinding::sqlite3_close),
      makeNativeMethod("sqlite3_db_filename",
                       NativeDatabaseBinding::sqlite3_db_filename),
      makeNativeMethod("sqlite3_enable_load_extension",
                       NativeDatabaseBinding::sqlite3_enable_load_extension),
      makeNativeMethod("sqlite3_exec", NativeDatabaseBinding::sqlite3_exec),
      makeNativeMethod("sqlite3_get_autocommit",
                       NativeDatabaseBinding::sqlite3_get_autocommit),
      makeNativeMethod("sqlite3_last_insert_rowid",
                       NativeDatabaseBinding::sqlite3_last_insert_rowid),
      makeNativeMethod("sqlite3_load_extension",
                       NativeDatabaseBinding::sqlite3_load_extension),
      makeNativeMethod("sqlite3_open", NativeDatabaseBinding::sqlite3_open),
      makeNativeMethod("sqlite3_prepare_v2",
                       NativeDatabaseBinding::sqlite3_prepare_v2),
      makeNativeMethod("sqlite3_serialize",
                       NativeDatabaseBinding::sqlite3_serialize),
      makeNativeMethod("sqlite3_deserialize",
                       NativeDatabaseBinding::sqlite3_deserialize),
      makeNativeMethod("sqlite3_update_hook",
                       NativeDatabaseBinding::sqlite3_update_hook),
      makeNativeMethod("sqlite3_backup", NativeDatabaseBinding::sqlite3_backup),
      makeNativeMethod("libsql_open_remote",
                       NativeDatabaseBinding::libsql_open_remote),
      makeNativeMethod("libsql_open", NativeDatabaseBinding::libsql_open),
      makeNativeMethod("libsql_sync", NativeDatabaseBinding::libsql_sync),
      makeNativeMethod("convertSqlLiteErrorToString",
                       NativeDatabaseBinding::convertSqlLiteErrorToString),
  });
}

int NativeDatabaseBinding::sqlite3_changes() {
  return static_cast<int>(::libsql_changes(conn));
}

int NativeDatabaseBinding::sqlite3_close() {
  ::libsql_disconnect(conn);
  ::libsql_close(db);
  return 0;
}

std::string
NativeDatabaseBinding::sqlite3_db_filename(const std::string &databaseName) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return "";
}

int NativeDatabaseBinding::sqlite3_enable_load_extension(int onoff) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return -1;
}

int NativeDatabaseBinding::sqlite3_exec(const std::string &source) {
  const char *errMsg;
  int ret = libsql_execute(conn, source.c_str(), &errMsg);
  if (ret != 0 && errMsg) {
    std::string errorString(errMsg);
    jni::throwNewJavaException(SQLiteErrorException::create(errorString).get());
  }
  return ret;
}

int NativeDatabaseBinding::sqlite3_get_autocommit() {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return -1;
}

int64_t NativeDatabaseBinding::sqlite3_last_insert_rowid() {
  return ::libsql_last_insert_rowid(conn);
}

int NativeDatabaseBinding::sqlite3_load_extension(
    const std::string &libPath, const std::string &entryProc) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return -1;
}

int NativeDatabaseBinding::sqlite3_open(const std::string &dbPath) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return -1;
}

int NativeDatabaseBinding::sqlite3_prepare_v2(
    const std::string &source,
    jni::alias_ref<NativeStatementBinding::javaobject> statement) {
  NativeStatementBinding *cStatement = cthis(statement);
  const char *errMsg;
  if (::libsql_prepare(conn, source.c_str(), &cStatement->stmt, &errMsg) != 0) {
    jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    return -1;
  }
  return 0;
}

jni::local_ref<jni::JArrayByte>
NativeDatabaseBinding::sqlite3_serialize(const std::string &databaseName) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return nullptr;
}

int NativeDatabaseBinding::sqlite3_deserialize(
    const std::string &databaseName,
    jni::alias_ref<jni::JArrayByte> serializedData) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return -1;
}

void NativeDatabaseBinding::sqlite3_update_hook(bool enabled) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
}

// static
int NativeDatabaseBinding::sqlite3_backup(
    jni::alias_ref<jni::JClass> clazz,
    jni::alias_ref<NativeDatabaseBinding::jhybridobject> destDatabase,
    const std::string &destDatabaseName,
    jni::alias_ref<NativeDatabaseBinding::jhybridobject> sourceDatabase,
    const std::string &sourceDatabaseName) {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return -1;
}

int NativeDatabaseBinding::libsql_open_remote(const std::string &url,
                                              const std::string &authToken) {
  const char *errMsg;
  int ret = ::libsql_open_remote(url.c_str(), authToken.c_str(), &db, &errMsg);
  if (ret != 0) {
    jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    return -1;
  }
  ret = ::libsql_connect(db, &conn, &errMsg);
  if (ret != 0) {
    jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    return -1;
  }
  return 0;
}

int NativeDatabaseBinding::libsql_open(const std::string &dbPath,
                                       const std::string &url,
                                       const std::string &authToken) {
  const char *errMsg;
  libsql_config config = {
      .db_path = dbPath.c_str(),
      .primary_url = url.c_str(),
      .auth_token = authToken.c_str(),
      .read_your_writes = 1,
      .encryption_key = nullptr,
      .sync_interval = 0,
      .with_webpki = 1,
      .offline = 1,
  };
  int ret = ::libsql_open_sync_with_config(config, &db, &errMsg);
  if (ret != 0) {
    jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    return -1;
  }
  ret = ::libsql_connect(db, &conn, &errMsg);
  if (ret != 0) {
    jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    return -1;
  }
  return 0;
}

int NativeDatabaseBinding::libsql_sync() {
  const char *errMsg;
  int ret = ::libsql_sync(db, &errMsg);
  if (ret != 0) {
    jni::throwNewJavaException(SQLiteErrorException::create(errMsg).get());
    return ret;
  }
  return 0;
}

std::string NativeDatabaseBinding::convertSqlLiteErrorToSTLString() {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return nullptr;
}

jni::local_ref<jni::JString>
NativeDatabaseBinding::convertSqlLiteErrorToString() {
  jni::throwNewJavaException(UnsupportedOperationException::create().get());
  return nullptr;
}

// static
jni::local_ref<NativeDatabaseBinding::jhybriddata>
NativeDatabaseBinding::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

// static
void NativeDatabaseBinding::OnUpdateHook(void *arg, int action,
                                         char const *databaseName,
                                         char const *tableName, int64_t rowId) {
  NativeDatabaseBinding *pThis = reinterpret_cast<NativeDatabaseBinding *>(arg);
  static const auto method =
      jni::findClassStatic("expo/modules/sqlite/NativeDatabaseBinding")
          ->getMethod<void(jint, jstring, jstring, jlong)>("onUpdate");
  method(pThis->javaPart_, action, jni::make_jstring(databaseName).get(),
         jni::make_jstring(tableName).get(), rowId);
}

} // namespace expo
