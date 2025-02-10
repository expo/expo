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
      makeNativeMethod("convertSqlLiteErrorToString",
                       NativeDatabaseBinding::convertSqlLiteErrorToString),
  });
}

int NativeDatabaseBinding::sqlite3_changes() { return ::exsqlite3_changes(db); }

int NativeDatabaseBinding::sqlite3_close() {
  // Not setting `db = nullptr` here because we may need the db pointer to get
  // error messages if exsqlite3_close has errors.
  return ::exsqlite3_close(db);
}

std::string
NativeDatabaseBinding::sqlite3_db_filename(const std::string &databaseName) {
  return ::exsqlite3_db_filename(db, databaseName.c_str());
}

int NativeDatabaseBinding::sqlite3_enable_load_extension(int onoff) {
  return ::exsqlite3_enable_load_extension(db, onoff);
}

int NativeDatabaseBinding::sqlite3_exec(const std::string &source) {
  char *error;
  int ret = ::exsqlite3_exec(db, source.c_str(), nullptr, nullptr, &error);
  if (ret != SQLITE_OK && error) {
    std::string errorString(error);
    ::exsqlite3_free(error);
    jni::throwNewJavaException(SQLiteErrorException::create(errorString).get());
  }
  return ret;
}

int NativeDatabaseBinding::sqlite3_get_autocommit() {
  return ::exsqlite3_get_autocommit(db);
}

int64_t NativeDatabaseBinding::sqlite3_last_insert_rowid() {
  return ::exsqlite3_last_insert_rowid(db);
}

int NativeDatabaseBinding::sqlite3_load_extension(
    const std::string &libPath, const std::string &entryProc) {
  char *error;
  int ret =
      ::exsqlite3_load_extension(db, libPath.c_str(), entryProc.c_str(), &error);
  if (ret != SQLITE_OK && error) {
    std::string errorString(error);
    ::exsqlite3_free(error);
    jni::throwNewJavaException(SQLiteErrorException::create(errorString).get());
  }
  return ret;
}

int NativeDatabaseBinding::sqlite3_open(const std::string &dbPath) {
  return ::exsqlite3_open(dbPath.c_str(), &db);
}

int NativeDatabaseBinding::sqlite3_prepare_v2(
    const std::string &source,
    jni::alias_ref<NativeStatementBinding::javaobject> statement) {
  NativeStatementBinding *cStatement = cthis(statement);
  return ::exsqlite3_prepare_v2(db, source.c_str(), source.size(),
                              &cStatement->stmt, nullptr);
}

jni::local_ref<jni::JArrayByte>
NativeDatabaseBinding::sqlite3_serialize(const std::string &databaseName) {
  ::sqlite3_int64 size = 0;
  unsigned char *bytes =
      ::exsqlite3_serialize(db, databaseName.c_str(), &size, 0);
  if (!bytes) {
    jni::throwNewJavaException(
        SQLiteErrorException::create(convertSqlLiteErrorToString()).get());
  }
  auto byteArray = jni::JArrayByte::newArray(size);
  byteArray->setRegion(0, size, reinterpret_cast<const signed char *>(bytes));
  ::exsqlite3_free(bytes);
  return byteArray;
}

int NativeDatabaseBinding::sqlite3_deserialize(
    const std::string &databaseName,
    jni::alias_ref<jni::JArrayByte> serializedData) {
  ::sqlite3_int64 size = serializedData->size();
  void *buffer = ::exsqlite3_malloc64(size);
  if (!buffer) {
    std::string message("Unable to allocate memory with size: ");
    message += size;
    jni::throwNewJavaException(SQLiteErrorException::create(message).get());
  }
  serializedData->getRegion(0, size, reinterpret_cast<signed char *>(buffer));
  int flags = SQLITE_DESERIALIZE_RESIZEABLE | SQLITE_DESERIALIZE_FREEONCLOSE;
  return ::exsqlite3_deserialize(db, databaseName.c_str(),
                               reinterpret_cast<unsigned char *>(buffer), size,
                               size, flags);
}

void NativeDatabaseBinding::sqlite3_update_hook(bool enabled) {
  if (enabled) {
    ::exsqlite3_update_hook(db, NativeDatabaseBinding::OnUpdateHook, this);
  } else {
    ::exsqlite3_update_hook(db, nullptr, nullptr);
  }
}

jni::local_ref<jni::JString>
NativeDatabaseBinding::convertSqlLiteErrorToString() {
  int code = exsqlite3_errcode(db);
  const char *message = exsqlite3_errmsg(db);
  std::string result("Error code ");
  result += code;
  result += ": ";
  result += message;
  return jni::make_jstring(result);
}

// static
jni::local_ref<NativeDatabaseBinding::jhybriddata>
NativeDatabaseBinding::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

// static
void NativeDatabaseBinding::OnUpdateHook(void *arg, int action,
                                         char const *databaseName,
                                         char const *tableName,
                                         sqlite3_int64 rowId) {
  NativeDatabaseBinding *pThis = reinterpret_cast<NativeDatabaseBinding *>(arg);
  static const auto method =
      jni::findClassStatic("expo/modules/sqlite/NativeDatabaseBinding")
          ->getMethod<void(jint, jstring, jstring, jlong)>("onUpdate");
  method(pThis->javaPart_, action, jni::make_jstring(databaseName).get(),
         jni::make_jstring(tableName).get(), rowId);
}

} // namespace expo
