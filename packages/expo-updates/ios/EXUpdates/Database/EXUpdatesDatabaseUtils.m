// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabaseUtils.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesDatabaseUtilsErrorDomain = @"EXUpdatesDatabase";

/**
 * Utility class with methods for common database functions used across multiple classes.
 */
@implementation EXUpdatesDatabaseUtils

+ (nullable NSArray<NSDictionary *> *)executeSql:(NSString *)sql
                                        withArgs:(nullable NSArray *)args
                                      onDatabase:(struct sqlite3 *)db
                                           error:(NSError ** _Nullable)error
{
  sqlite3_stmt *stmt;
  if (sqlite3_prepare_v2(db, [sql UTF8String], -1, &stmt, NULL) != SQLITE_OK) {
    if (error != nil) {
      *error = [[self class] errorFromSqlite:db];
    }
    return nil;
  }
  if (args) {
    if (![[self class] _bindStatement:stmt withArgs:args]) {
      if (error != nil) {
        *error = [[self class] errorFromSqlite:db];
      }
      return nil;
    }
  }

  NSMutableArray *rows = [NSMutableArray arrayWithCapacity:0];
  NSMutableArray *columnNames = [NSMutableArray arrayWithCapacity:0];

  int columnCount = 0;
  BOOL didFetchColumns = NO;
  int result;
  BOOL hasMore = YES;
  BOOL didError = NO;
  while (hasMore) {
    result = sqlite3_step(stmt);
    switch (result) {
      case SQLITE_ROW: {
        if (!didFetchColumns) {
          // get all column names once at the beginning
          columnCount = sqlite3_column_count(stmt);

          for (int i = 0; i < columnCount; i++) {
            [columnNames addObject:[NSString stringWithUTF8String:sqlite3_column_name(stmt, i)]];
          }
          didFetchColumns = YES;
        }
        NSMutableDictionary *entry = [NSMutableDictionary dictionary];
        for (int i = 0; i < columnCount; i++) {
          id columnValue = [[self class] _getValueWithStatement:stmt column:i];
          entry[columnNames[i]] = columnValue;
        }
        [rows addObject:entry];
        break;
      }
      case SQLITE_DONE:
        hasMore = NO;
        break;
      default:
        didError = YES;
        hasMore = NO;
        break;
    }
  }

  if (didError && error != nil) {
    *error = [[self class] errorFromSqlite:db];
  }

  sqlite3_finalize(stmt);

  return didError ? nil : rows;
}

+ (id)_getValueWithStatement:(sqlite3_stmt *)stmt column:(int)column
{
  int columnType = sqlite3_column_type(stmt, column);
  switch (columnType) {
    case SQLITE_INTEGER:
      return @(sqlite3_column_int64(stmt, column));
    case SQLITE_FLOAT:
      return @(sqlite3_column_double(stmt, column));
    case SQLITE_BLOB:
      NSAssert(sqlite3_column_bytes(stmt, column) == 16, @"SQLite BLOB value should be a valid UUID");
      return [[NSUUID alloc] initWithUUIDBytes:sqlite3_column_blob(stmt, column)];
    case SQLITE_TEXT:
      return [[NSString alloc] initWithBytes:(char *)sqlite3_column_text(stmt, column)
                                      length:sqlite3_column_bytes(stmt, column)
                                    encoding:NSUTF8StringEncoding];
  }
  return [NSNull null];
}

+ (BOOL)_bindStatement:(sqlite3_stmt *)stmt withArgs:(NSArray *)args
{
  __block BOOL success = YES;
  [args enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
    if ([obj isKindOfClass:[NSUUID class]]) {
      uuid_t bytes;
      [((NSUUID *)obj) getUUIDBytes:bytes];
      if (sqlite3_bind_blob(stmt, (int)idx + 1, bytes, 16, SQLITE_TRANSIENT) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    } else if ([obj isKindOfClass:[NSNumber class]]) {
      if (sqlite3_bind_int64(stmt, (int)idx + 1, [((NSNumber *)obj) longLongValue]) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    } else if ([obj isKindOfClass:[NSDate class]]) {
      NSTimeInterval dateValue = [(NSDate *)obj timeIntervalSince1970] * 1000;
      if (sqlite3_bind_int64(stmt, (int)idx + 1, (long long)dateValue) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    } else if ([obj isKindOfClass:[NSDictionary class]]) {
      NSError *error;
      NSData *jsonData = [NSJSONSerialization dataWithJSONObject:(NSDictionary *)obj options:kNilOptions error:&error];
      if (!error && sqlite3_bind_text(stmt, (int)idx + 1, jsonData.bytes, (int)jsonData.length, SQLITE_TRANSIENT) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    } else if ([obj isKindOfClass:[NSNull class]]) {
      if (sqlite3_bind_null(stmt, (int)idx + 1) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    } else {
      // convert to string
      NSString *string = [obj isKindOfClass:[NSString class]] ? (NSString *)obj : [obj description];
      NSData *data = [string dataUsingEncoding:NSUTF8StringEncoding];
      if (sqlite3_bind_text(stmt, (int)idx + 1, data.bytes, (int)data.length, SQLITE_TRANSIENT) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    }
  }];
  return success;
}

+ (NSError *)errorFromSqlite:(struct sqlite3 *)db
{
  int code = sqlite3_errcode(db);
  int extendedCode = sqlite3_extended_errcode(db);
  NSString *message = [NSString stringWithUTF8String:sqlite3_errmsg(db)];
  return [NSError errorWithDomain:EXUpdatesDatabaseUtilsErrorDomain
                             code:extendedCode
                         userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Error code %i: %@ (extended error code %i)", code, message, extendedCode]}];
}

+ (NSDate *)dateFromUnixTimeMilliseconds:(NSNumber *)number
{
  return [NSDate dateWithTimeIntervalSince1970:number.doubleValue / 1000];
}

@end

NS_ASSUME_NONNULL_END
