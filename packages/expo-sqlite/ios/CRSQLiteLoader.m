// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoSQLite/CRSQLiteLoader.h>
#import <ExpoSQLite/sqlite3.h>

int crsqlite_init_from_swift(sqlite3 *db) {
  exsqlite3_enable_load_extension(db, 1);
  char *errorMessage;
  NSBundle *bundle = [NSBundle bundleWithIdentifier:@"io.vlcn.crsqlite"];
  NSString *libPath = [bundle pathForResource:@"crsqlite" ofType:@""];
  int result = exsqlite3_load_extension(db, [libPath UTF8String], "sqlite3_crsqlite_init", &errorMessage);
  if (result != SQLITE_OK) {
    NSLog(@"Failed to load sqlite3 extension: %@", [NSString stringWithCString:errorMessage encoding:NSUTF8StringEncoding]);
    exsqlite3_free(errorMessage);
    errorMessage = nil;
  }
  return result;
}
