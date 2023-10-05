// Copyright 2015-present 650 Industries. All rights reserved.

#include "SQLite3Wrapper.h"

#include <android/log.h>

namespace jni = facebook::jni;

namespace expo {

namespace {

constexpr char TAG[] = "expo-sqlite";

} // namespace

// static
void SQLite3Wrapper::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", SQLite3Wrapper::initHybrid),
      makeNativeMethod("executeSql", SQLite3Wrapper::executeSql),
      makeNativeMethod("sqlite3_open", SQLite3Wrapper::sqlite3_open),
      makeNativeMethod("sqlite3_close", SQLite3Wrapper::sqlite3_close),
      makeNativeMethod("sqlite3_enable_load_extension",
                       SQLite3Wrapper::sqlite3_enable_load_extension),
      makeNativeMethod("sqlite3_load_extension",
                       SQLite3Wrapper::sqlite3_load_extension),
      makeNativeMethod("sqlite3_update_hook",
                       SQLite3Wrapper::sqlite3_update_hook),
  });
}

jni::local_ref<jni::JList<jni::JObject>>
SQLite3Wrapper::executeSql(const std::string &sql,
                           jni::alias_ref<jni::JList<jni::JObject>> args,
                           bool readOnly) {
  auto resultRows = jni::JArrayList<jni::JObject>::create();
  sqlite3_stmt *statement = nullptr;
  int rowsAffected = 0;
  sqlite3_int64 insertId = 0;
  jni::local_ref<jni::JString> error;

  if (sqlite3_prepare_v2(db, sql.c_str(), -1, &statement, nullptr) !=
      SQLITE_OK) {
    auto results = jni::JArrayList<jni::JObject>::create();
    results->add(convertSqlLiteErrorToString(db));
    return results;
  }

  bool queryIsReadOnly = sqlite3_stmt_readonly(statement) > 0;
  if (readOnly && !queryIsReadOnly) {
    auto results = jni::JArrayList<jni::JObject>::create();
    std::string error("could not prepare ");
    error += sql;
    results->add(jni::make_jstring(error));
    return results;
  }

  int index = 1;
  for (const auto &arg : *args) {
    bindStatement(statement, arg, index++);
  }

  int columnCount = 0;
  auto columnNames = jni::JArrayList<jni::JString>::create();
  int columnType;
  bool fetchedColumns = false;
  jni::local_ref<jni::JObject> value;
  bool hasMore = true;

  while (hasMore) {
    switch (sqlite3_step(statement)) {
    case SQLITE_ROW: {
      if (!fetchedColumns) {
        columnCount = sqlite3_column_count(statement);

        for (int i = 0; i < columnCount; ++i) {
          const char *columnName = sqlite3_column_name(statement, i);
          columnNames->add(jni::make_jstring(columnName));
        }
        fetchedColumns = true;
      }

      auto entry = jni::JArrayList<jni::JObject>::create();

      for (int i = 0; i < columnCount; ++i) {
        columnType = sqlite3_column_type(statement, i);
        value = getSqlValue(columnType, statement, i);
        entry->add(value);
      }
      resultRows->add(entry);
      break;
    }
    case SQLITE_DONE: {
      hasMore = false;
      break;
    }
    default: {
      error = convertSqlLiteErrorToString(db);
      break;
    }
    }
  }

  if (!queryIsReadOnly) {
    rowsAffected = sqlite3_changes(db);
    if (rowsAffected > 0) {
      insertId = sqlite3_last_insert_rowid(db);
    }
  }

  sqlite3_finalize(statement);

  if (error) {
    auto results = jni::JArrayList<jni::JObject>::create();
    results->add(error);
    return results;
  }

  auto results = jni::JArrayList<jni::JObject>::create();
  results->add(nullptr);
  results->add(jni::JLong::valueOf(insertId));
  results->add(jni::JInteger::valueOf(rowsAffected));
  results->add(columnNames);
  results->add(resultRows);
  return results;
}

int SQLite3Wrapper::sqlite3_open(const std::string &dbPath) {
  return ::sqlite3_open(dbPath.c_str(), &db);
}

int SQLite3Wrapper::sqlite3_close() {
  int ret = ::sqlite3_close(db);
  db = nullptr;
  return ret;
}

int SQLite3Wrapper::sqlite3_enable_load_extension(int onoff) {
  return ::sqlite3_enable_load_extension(db, onoff);
}

int SQLite3Wrapper::sqlite3_load_extension(const std::string &libPath,
                                           const std::string &entryProc) {
  char *errorMessage;
  int ret = ::sqlite3_load_extension(db, libPath.c_str(), entryProc.c_str(),
                                     &errorMessage);
  if (errorMessage) {
    __android_log_write(ANDROID_LOG_ERROR, TAG, errorMessage);
    ::sqlite3_free(errorMessage);
  }
  return ret;
}

void SQLite3Wrapper::sqlite3_update_hook(bool enabled) {
  if (enabled) {
    ::sqlite3_update_hook(db, SQLite3Wrapper::OnUpdateHook, this);
  } else {
    ::sqlite3_update_hook(db, nullptr, nullptr);
  }
}

// static
jni::local_ref<SQLite3Wrapper::jhybriddata>
SQLite3Wrapper::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

// static
jni::local_ref<jni::JString>
SQLite3Wrapper::convertSqlLiteErrorToString(sqlite3 *db) {
  int code = sqlite3_errcode(db);
  const char *message = sqlite3_errmsg(db);
  std::string result("Error code ");
  result += code;
  result += ": ";
  result += message;
  return jni::make_jstring(result);
}

// static
void SQLite3Wrapper::bindStatement(sqlite3_stmt *statement,
                                   jni::alias_ref<jni::JObject> arg,
                                   int index) {
  static const auto integerClass = jni::JInteger::javaClassStatic();
  static const auto longClass = jni::JLong::javaClassStatic();
  static const auto doubleClass = jni::JDouble::javaClassStatic();
  static const auto stringClass = jni::JString::javaClassStatic();

  if (arg == nullptr) {
    sqlite3_bind_null(statement, index);
  } else if (arg->isInstanceOf(integerClass)) {
    sqlite3_bind_int(statement, index,
                     jni::static_ref_cast<jni::JInteger>(arg)->value());
  } else if (arg->isInstanceOf(longClass)) {
    sqlite3_bind_int64(statement, index,
                       jni::static_ref_cast<jni::JLong>(arg)->value());
  } else if (arg->isInstanceOf(doubleClass)) {
    sqlite3_bind_double(statement, index,
                        jni::static_ref_cast<jni::JDouble>(arg)->value());
  } else {
    std::string stringArg;
    if (arg->isInstanceOf(stringClass)) {
      stringArg = jni::static_ref_cast<jni::JString>(arg)->toStdString();
    } else {
      stringArg = arg->toString();
    }
    sqlite3_bind_text(statement, index, stringArg.c_str(), stringArg.length(),
                      SQLITE_TRANSIENT);
  }
}

// static
jni::local_ref<jni::JObject>
SQLite3Wrapper::getSqlValue(int columnType, sqlite3_stmt *statement,
                            int index) {
  switch (columnType) {
  case SQLITE_INTEGER: {
    return jni::JLong::valueOf(sqlite3_column_int64(statement, index));
  }
  case SQLITE_FLOAT: {
    return jni::JDouble::valueOf(sqlite3_column_double(statement, index));
  }
  case SQLITE_BLOB: {
    JNIEnv *env = jni::Environment::current();
    return jni::adopt_local(env->NewString(
        reinterpret_cast<const jchar *>(sqlite3_column_blob(statement, index)),
        static_cast<size_t>(sqlite3_column_bytes(statement, index))));
  }
  case SQLITE_TEXT: {
    std::string text(
        reinterpret_cast<const char *>(sqlite3_column_text(statement, index)),
        static_cast<size_t>(sqlite3_column_bytes(statement, index)));
    return jni::make_jstring(text);
  }
  default: {
    return nullptr;
  }
  }
}

// static
void SQLite3Wrapper::OnUpdateHook(void *arg, int action, char const *dbName,
                                  char const *tableName, sqlite3_int64 rowId) {
  SQLite3Wrapper *pThis = reinterpret_cast<SQLite3Wrapper *>(arg);
  static const auto method =
      jni::findClassStatic("expo/modules/sqlite/SQLite3Wrapper")
          ->getMethod<void(jint, jstring, jstring, jlong)>("onUpdate");
  method(pThis->javaPart_, action, jni::make_jstring(dbName).get(),
         jni::make_jstring(tableName).get(), rowId);
}

} // namespace expo
