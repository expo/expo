// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoSQLite/CRSQLiteLoader.h>
#import <sqlite3/sqlite3.h>

// This comes from the crsqlite.xcframework
int sqlite3_crsqlite_init(sqlite3 *db, char **pzErrMsg,
                          const sqlite3_api_routines *pApi);

int crsqlite_auto_init_from_swift() {
  int result = sqlite3_auto_extension((void *)sqlite3_crsqlite_init);
  return result;
}

int crsqlite_init_from_swift(sqlite3 *db) {
  sqlite3_enable_load_extension(db, 1);
  char *errorMessage;
  NSBundle *bundle = [NSBundle bundleWithIdentifier:@"io.vlcn.crsqlite"];
  NSString *libPath = [bundle pathForResource:@"crsqlite" ofType:@""];
  int result = sqlite3_load_extension(db, [libPath UTF8String], "sqlite3_crsqlite_init", &errorMessage);
  if (result != SQLITE_OK) {
    NSLog(@"Failed to load sqlite3 extension: %@", [NSString stringWithCString:errorMessage]);
    sqlite3_free(errorMessage);
    errorMessage = nil;
  }
  return result;
}
