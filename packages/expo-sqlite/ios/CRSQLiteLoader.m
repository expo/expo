// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoSQLite/CRSQLiteLoader.h>
#import <sqlite3/sqlite3.h>

// This comes from the crsqlite.xcframework
int sqlite3_crsqlite_init(sqlite3 *db, char **pzErrMsg,
                          const sqlite3_api_routines *pApi);

int crsqlite_init_from_swift() {
  int result = sqlite3_auto_extension((void *)sqlite3_crsqlite_init);
  return result;
}
