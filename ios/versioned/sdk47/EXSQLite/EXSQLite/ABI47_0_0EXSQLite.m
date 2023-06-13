// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXSQLite/ABI47_0_0EXSQLite.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXFileSystemInterface.h>

#import <sqlite3.h>

@interface ABI47_0_0EXSQLite ()

@property (nonatomic, copy) NSMutableDictionary *cachedDatabases;
@property (nonatomic, weak) ABI47_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI47_0_0EXSQLite

@synthesize cachedDatabases;

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI47_0_0EX_EXPORT_MODULE(ExponentSQLite);

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  cachedDatabases = [NSMutableDictionary dictionary];
}

- (NSString *)pathForDatabaseName:(NSString *)name
{
  id<ABI47_0_0EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXFileSystemInterface)];
  if (!fileSystem) {
    ABI47_0_0EXLogError(@"No FileSystem module.");
    return nil;
  }
  NSString *directory = [fileSystem.documentDirectory stringByAppendingPathComponent:@"SQLite"];
  [fileSystem ensureDirExistsWithPath:directory];
  return [directory stringByAppendingPathComponent:name];
}

- (NSValue *)openDatabase:(NSString *)dbName
{
  NSValue *cachedDB = nil;
  NSString *path = [self pathForDatabaseName:dbName];
  if (!path) {
    return nil;
  }
  if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
    cachedDB = [cachedDatabases objectForKey:dbName];
  }
  if (cachedDB == nil) {
    [cachedDatabases removeObjectForKey:dbName];
    sqlite3 *db;
    if (sqlite3_open([path UTF8String], &db) != SQLITE_OK) {
      return nil;
    };
    cachedDB = [NSValue valueWithPointer:db];
    [cachedDatabases setObject:cachedDB forKey:dbName];
  }
  return cachedDB;
}

ABI47_0_0EX_EXPORT_METHOD_AS(exec,
                    exec:(NSString *)dbName
                 queries:(NSArray *)sqlQueries
                readOnly:(BOOL)readOnly
                resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  @synchronized(self) {
    NSValue *databasePointer = [self openDatabase:dbName];
    if (!databasePointer) {
      reject(@"E_SQLITE_OPEN_DATABASE", @"Could not open database.", nil);
      return;
    }

    sqlite3 *db = [databasePointer pointerValue];
    NSMutableArray *sqlResults = [NSMutableArray arrayWithCapacity:sqlQueries.count];
    for (NSArray *sqlQueryObject in sqlQueries) {
      NSString *sql = [sqlQueryObject objectAtIndex:0];
      NSArray *sqlArgs = [sqlQueryObject objectAtIndex:1];
      [sqlResults addObject:[self executeSql:sql withSqlArgs:sqlArgs withDb:db withReadOnly:readOnly]];
    }
    resolve(sqlResults);
  }
}

ABI47_0_0EX_EXPORT_METHOD_AS(close,
                    close:(NSString *)dbName
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  @synchronized(self) {
    [cachedDatabases removeObjectForKey:dbName];
    resolve(nil);
  }
}

ABI47_0_0EX_EXPORT_METHOD_AS(deleteAsync,
                    deleteDbName:(NSString *)dbName
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  NSString *errorCode = @"E_SQLITE_DELETE_DATABASE";

  @synchronized(self) {
    if ([cachedDatabases objectForKey:dbName]) {
      reject(errorCode, [NSString stringWithFormat:@"Unable to delete database '%@' that is currently open. Close it prior to deletion.", dbName], nil);
      return;
    }
  }

  NSString *path = [self pathForDatabaseName:dbName];
  if (!path) {
    reject(errorCode, @"No FileSystem module.", nil);
    return;
  }
  if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
    reject(errorCode, [NSString stringWithFormat:@"Database '%@' not found", dbName], nil);
    return;
  }
  NSError *error;
  if (![[NSFileManager defaultManager] removeItemAtPath:path error:&error]) {
    reject(errorCode, [NSString stringWithFormat:@"Unable to delete the database file for '%@' database", dbName], error);
    return;
  }
  resolve(nil);
}

- (id)getSqlValueForColumnType:(int)columnType withStatement:(sqlite3_stmt*)statement withIndex:(int)i
{
  switch (columnType) {
    case SQLITE_INTEGER:
      return @(sqlite3_column_int64(statement, i));
    case SQLITE_FLOAT:
      return @(sqlite3_column_double(statement, i));
    case SQLITE_BLOB:
    case SQLITE_TEXT:
      return [[NSString alloc] initWithBytes:(char *)sqlite3_column_text(statement, i)
                                      length:sqlite3_column_bytes(statement, i)
                                    encoding:NSUTF8StringEncoding];
  }
  return [NSNull null];
}

- (NSArray *)executeSql:(NSString*)sql withSqlArgs:(NSArray*)sqlArgs
                 withDb:(sqlite3*)db withReadOnly:(BOOL)readOnly
{
  NSString *error = nil;
  sqlite3_stmt *statement;
  NSMutableArray *resultRows = [NSMutableArray arrayWithCapacity:0];
  NSMutableArray *entry;
  long long insertId = 0;
  int rowsAffected = 0;
  int i;

  // compile the statement, throw an error if necessary
  if (sqlite3_prepare_v2(db, [sql UTF8String], -1, &statement, NULL) != SQLITE_OK) {
    error = [ABI47_0_0EXSQLite convertSQLiteErrorToString:db];
    return @[error];
  }

  bool queryIsReadOnly = sqlite3_stmt_readonly(statement);
  if (readOnly && !queryIsReadOnly) {
    error = [NSString stringWithFormat:@"could not prepare %@", sql];
    return @[error];
  }

  // bind any arguments
  if (sqlArgs != nil) {
    for (i = 0; i < sqlArgs.count; i++) {
      [self bindStatement:statement withArg:[sqlArgs objectAtIndex:i] atIndex:(i + 1)];
    }
  }

  // iterate through sql results
  int columnCount = 0;
  NSMutableArray *columnNames = [NSMutableArray arrayWithCapacity:0];
  NSString *columnName;
  int columnType;
  BOOL fetchedColumns = NO;
  int result;
  NSObject *columnValue;
  BOOL hasMore = YES;
  while (hasMore) {
    result = sqlite3_step (statement);
    switch (result) {
      case SQLITE_ROW:
        if (!fetchedColumns) {
          // get all column names once at the beginning
          columnCount = sqlite3_column_count(statement);

          for (i = 0; i < columnCount; i++) {
            columnName = [NSString stringWithFormat:@"%s", sqlite3_column_name(statement, i)];
            [columnNames addObject:columnName];
          }
          fetchedColumns = YES;
        }
        entry = [NSMutableArray arrayWithCapacity:columnCount];
        for (i = 0; i < columnCount; i++) {
          columnType = sqlite3_column_type(statement, i);
          columnValue = [self getSqlValueForColumnType:columnType withStatement:statement withIndex: i];
          [entry addObject:columnValue];
        }
        [resultRows addObject:entry];
        break;
      case SQLITE_DONE:
        hasMore = NO;
        break;
      default:
        error = [ABI47_0_0EXSQLite convertSQLiteErrorToString:db];
        hasMore = NO;
        break;
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
    return @[error];
  }
  return @[[NSNull null], @(insertId), @(rowsAffected), columnNames, resultRows];
}

- (void)bindStatement:(sqlite3_stmt *)statement withArg:(NSObject *)arg atIndex:(int)argIndex
{
  if ([arg isEqual:[NSNull null]]) {
    sqlite3_bind_null(statement, argIndex);
  } else if ([arg isKindOfClass:[NSNumber class]]) {
    sqlite3_bind_double(statement, argIndex, [((NSNumber *) arg) doubleValue]);
  } else { // NSString
    NSString *stringArg;

    if ([arg isKindOfClass:[NSString class]]) {
      stringArg = (NSString *)arg;
    } else {
      stringArg = [arg description]; // convert to text
    }

    NSData *data = [stringArg dataUsingEncoding:NSUTF8StringEncoding];
    sqlite3_bind_text(statement, argIndex, data.bytes, (int)data.length, SQLITE_TRANSIENT);
  }
}

- (void)dealloc
{
  for (NSString *key in cachedDatabases) {
    sqlite3_close([[cachedDatabases objectForKey:key] pointerValue]);
  }
}

+ (NSString *)convertSQLiteErrorToString:(struct sqlite3 *)db
{
  int code = sqlite3_errcode(db);
  NSString *message = [NSString stringWithUTF8String:sqlite3_errmsg(db)];
  return [NSString stringWithFormat:@"Error code %i: %@", code, message];
}

@end
