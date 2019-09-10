//
//  AMPDatabaseHelper.m
//  Amplitude
//
//  Created by Daniel Jih on 9/9/15.
//  Copyright (c) 2015 Amplitude. All rights reserved.
//

#ifndef AMPLITUDE_DEBUG
#define AMPLITUDE_DEBUG 0
#endif

#ifndef AMPLITUDE_LOG
#if AMPLITUDE_DEBUG
#   define AMPLITUDE_LOG(fmt, ...) NSLog(fmt, ##__VA_ARGS__)
#else
#   define AMPLITUDE_LOG(...)
#endif
#endif

#import <Foundation/Foundation.h>
#import <sqlite3.h>
#import "AMPARCMacros.h"
#import "AMPDatabaseHelper.h"
#import "AMPARCMacros.h"
#import "AMPUtils.h"
#import "AMPConstants.h"

@interface AMPDatabaseHelper()
@end

@implementation AMPDatabaseHelper
{
    BOOL _databaseCreated;
    sqlite3 *_database;
    dispatch_queue_t _queue;
}

static NSString *const QUEUE_NAME = @"com.amplitude.db.queue";
static const void * const kDispatchQueueKey = &kDispatchQueueKey; // some unique key for dispatch queue

static NSString *const EVENT_TABLE_NAME = @"events";
static NSString *const IDENTIFY_TABLE_NAME = @"identifys";
static NSString *const ID_FIELD = @"id";
static NSString *const EVENT_FIELD = @"event";

static NSString *const STORE_TABLE_NAME = @"store";
static NSString *const LONG_STORE_TABLE_NAME = @"long_store";
static NSString *const KEY_FIELD = @"key";
static NSString *const VALUE_FIELD = @"value";

static NSString *const DROP_TABLE = @"DROP TABLE IF EXISTS %@;";
static NSString *const CREATE_EVENT_TABLE = @"CREATE TABLE IF NOT EXISTS %@ (%@ INTEGER PRIMARY KEY AUTOINCREMENT, %@ TEXT);";
static NSString *const CREATE_IDENTIFY_TABLE = @"CREATE TABLE IF NOT EXISTS %@ (%@ INTEGER PRIMARY KEY AUTOINCREMENT, %@ TEXT);";
static NSString *const CREATE_STORE_TABLE = @"CREATE TABLE IF NOT EXISTS %@ (%@ TEXT PRIMARY KEY NOT NULL, %@ TEXT);";
static NSString *const CREATE_LONG_STORE_TABLE = @"CREATE TABLE IF NOT EXISTS %@ (%@ TEXT PRIMARY KEY NOT NULL, %@ INTEGER);";

static NSString *const INSERT_EVENT = @"INSERT INTO %@ (%@) VALUES (?);";
static NSString *const GET_EVENT_WITH_UPTOID_AND_LIMIT = @"SELECT %@, %@ FROM %@ WHERE %@ <= %lli LIMIT %lli;";
static NSString *const GET_EVENT_WITH_UPTOID = @"SELECT %@, %@ FROM %@ WHERE %@ <= %lli;";
static NSString *const GET_EVENT_WITH_LIMIT = @"SELECT %@, %@ FROM %@ LIMIT %lli;";
static NSString *const GET_EVENT = @"SELECT %@, %@ FROM %@;";
static NSString *const COUNT_EVENTS = @"SELECT COUNT(*) FROM %@;";
static NSString *const REMOVE_EVENTS = @"DELETE FROM %@ WHERE %@ <= %lli;";
static NSString *const REMOVE_EVENT = @"DELETE FROM %@ WHERE %@ = %lli;";
static NSString *const GET_NTH_EVENT_ID = @"SELECT %@ FROM %@ LIMIT 1 OFFSET %lli;";

static NSString *const INSERT_OR_REPLACE_KEY_VALUE = @"INSERT OR REPLACE INTO %@ (%@, %@) VALUES (?, ?);";
static NSString *const DELETE_KEY = @"DELETE FROM %@ WHERE %@ = ?;";
static NSString *const GET_VALUE = @"SELECT %@, %@ FROM %@ WHERE %@ = ?;";


+ (AMPDatabaseHelper*)getDatabaseHelper
{
    return [AMPDatabaseHelper getDatabaseHelper:nil];
}

+ (AMPDatabaseHelper*)getDatabaseHelper:(NSString*) instanceName
{
    static NSMutableDictionary *_instances = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _instances = [[NSMutableDictionary alloc] init];
    });

    if (instanceName == nil || [AMPUtils isEmptyString:instanceName]) {
        instanceName = kAMPDefaultInstance;
    }
    instanceName = [instanceName lowercaseString];

    AMPDatabaseHelper *dbHelper = nil;
    @synchronized(_instances) {
        dbHelper = [_instances objectForKey:instanceName];
        if (dbHelper == nil) {
            dbHelper = [[AMPDatabaseHelper alloc] initWithInstanceName:instanceName];
            [_instances setObject:dbHelper forKey:instanceName];
            SAFE_ARC_RELEASE(dbHelper);
        }
    }
    return dbHelper;
}

- (id)init
{
    return [self initWithInstanceName:nil];
}

- (id)initWithInstanceName:(NSString*) instanceName
{
    if ([AMPUtils isEmptyString:instanceName]) {
        instanceName = kAMPDefaultInstance;
    }
    instanceName = [instanceName lowercaseString];

    if ((self = [super init])) {
        NSString *databaseDirectory = [AMPUtils platformDataDirectory];
        NSString *databasePath = [databaseDirectory stringByAppendingPathComponent:@"com.amplitude.database"];
        if (![instanceName isEqualToString:kAMPDefaultInstance]) {
            databasePath = [NSString stringWithFormat:@"%@_%@", databasePath, instanceName];
        }
        _databasePath = SAFE_ARC_RETAIN(databasePath);
        _queue = dispatch_queue_create([QUEUE_NAME UTF8String], NULL);
        dispatch_queue_set_specific(_queue, kDispatchQueueKey, (__bridge void *)self, NULL);
        if (![[NSFileManager defaultManager] fileExistsAtPath:_databasePath]) {
            (void)[self createTables];
        }
    }
    return self;
}

- (void)dealloc
{
    SAFE_ARC_RELEASE(_databasePath);
    if (_queue) {
        (void) SAFE_ARC_DISPATCH_RELEASE(_queue);
        _queue = NULL;
    }
    SAFE_ARC_SUPER_DEALLOC();
}

/**
 * Run queries in the queue. Needed because sqlite is not thread-safe.
 * Handles opening and closing of database for the block.
 * Returns YES if successfully opened database, else NO.
 */
- (BOOL)inDatabase:(void (^)(sqlite3 *db)) block
{
    // check that the block doesn't isn't calling inDatabase itself, which would lead to a deadlock
    AMPDatabaseHelper *currentSyncQueue = (__bridge id)dispatch_get_specific(kDispatchQueueKey);
    if (currentSyncQueue == self) {
        AMPLITUDE_LOG(@"Should not call inDatabase in block passed to inDatabase");
        return NO;
    }

    __block BOOL success = YES;

    dispatch_sync(_queue, ^() {
        if (sqlite3_open([self->_databasePath UTF8String], &self->_database) != SQLITE_OK) {
            NSLog(@"Failed to open database");
            sqlite3_close(self->_database);
            success = NO;
            return;
        }
        block(self->_database);
        sqlite3_close(self->_database);
    });

    return success;
}

/**
 * Run queries in a queue. Needed because sqlite is not thread-safe.
 * Handles opening and closing of database for the block.
 * This version also handles preparing a statement from SQL string, and finalizing it as well.
 * Returns YES if successfully opened database and prepared statement, else NO.
 */
- (BOOL)inDatabaseWithStatement:(NSString*) SQLString block:(void (^)(sqlite3_stmt *stmt)) block
{
    // check that the block doesn't isn't calling inDatabase itself, which would lead to a deadlock
    AMPDatabaseHelper *currentSyncQueue = (__bridge id)dispatch_get_specific(kDispatchQueueKey);
    if (currentSyncQueue == self) {
        AMPLITUDE_LOG(@"Should not call inDatabase in block passed to inDatabase");
        return NO;
    }

    __block BOOL success = YES;

    dispatch_sync(_queue, ^() {
        if (sqlite3_open([self->_databasePath UTF8String], &self->_database) != SQLITE_OK) {
            NSLog(@"Failed to open database");
            sqlite3_close(self->_database);
            success = NO;
            return;
        }

        sqlite3_stmt *stmt;
        if (sqlite3_prepare_v2(self->_database, [SQLString UTF8String], -1, &stmt, NULL) != SQLITE_OK) {
            AMPLITUDE_LOG(@"Failed to prepare statement for query %@", SQLString);
            sqlite3_close(self->_database);
            success = NO;
            return;
        }

        block(stmt);
        sqlite3_finalize(stmt);
        sqlite3_close(self->_database);
    });

    return success;
}

// Assumes db is already opened
- (BOOL)execSQLString:(sqlite3*) db SQLString:(NSString*) SQLString
{
    char *errMsg;
    if (sqlite3_exec(db, [SQLString UTF8String], NULL, NULL, &errMsg) != SQLITE_OK) {
        AMPLITUDE_LOG(@"Failed to exec sql string %@: %s", SQLString, errMsg);
        return NO;
    }
    return YES;
}

- (BOOL)createTables
{
    __block BOOL success = YES;

    success &= [self inDatabase:^(sqlite3 *db) {
        NSString *createEventsTable = [NSString stringWithFormat:CREATE_EVENT_TABLE, EVENT_TABLE_NAME, ID_FIELD, EVENT_FIELD];
        success &= [self execSQLString:db SQLString:createEventsTable];

        NSString *createIdentifysTable = [NSString stringWithFormat:CREATE_IDENTIFY_TABLE, IDENTIFY_TABLE_NAME, ID_FIELD, EVENT_FIELD];
        success &= [self execSQLString:db SQLString:createIdentifysTable];

        NSString *createStoreTable = [NSString stringWithFormat:CREATE_STORE_TABLE, STORE_TABLE_NAME, KEY_FIELD, VALUE_FIELD];
        success &= [self execSQLString:db SQLString:createStoreTable];

        NSString *createLongStoreTable = [NSString stringWithFormat:CREATE_LONG_STORE_TABLE, LONG_STORE_TABLE_NAME, KEY_FIELD, VALUE_FIELD];
        success &= [self execSQLString:db SQLString:createLongStoreTable];
    }];

    return success;
}

- (BOOL)upgrade:(int) oldVersion newVersion:(int) newVersion
{
    __block BOOL success = YES;

    success &= [self inDatabase:^(sqlite3 *db) {
        switch (oldVersion) {
            case 0:
            case 1: {
                NSString *createEventsTable = [NSString stringWithFormat:CREATE_EVENT_TABLE, EVENT_TABLE_NAME, ID_FIELD, EVENT_FIELD];
                success &= [self execSQLString:db SQLString:createEventsTable];

                NSString *createStoreTable = [NSString stringWithFormat:CREATE_STORE_TABLE, STORE_TABLE_NAME, KEY_FIELD, VALUE_FIELD];
                success &= [self execSQLString:db SQLString:createStoreTable];

                NSString *createLongStoreTable = [NSString stringWithFormat:CREATE_LONG_STORE_TABLE, LONG_STORE_TABLE_NAME, KEY_FIELD, VALUE_FIELD];
                success &= [self execSQLString:db SQLString:createLongStoreTable];
                if (newVersion <= 2) break;
            }
            case 2: {
                NSString *createIdentifysTable = [NSString stringWithFormat:CREATE_IDENTIFY_TABLE, IDENTIFY_TABLE_NAME, ID_FIELD, EVENT_FIELD];
                success &= [self execSQLString:db SQLString:createIdentifysTable];
                if (newVersion <= 3) break;
            }
            default:
                success = NO;
        }
    }];

    if (!success) {
        NSLog(@"upgrade with unknown oldVersion %d", oldVersion);
        return [self resetDB:NO];
    }
    return success;
}

- (BOOL)dropTables
{
    __block BOOL success = YES;

    success &= [self inDatabase:^(sqlite3 *db) {
        NSString *dropEventTableSQL = [NSString stringWithFormat:DROP_TABLE, EVENT_TABLE_NAME];
        success &= [self execSQLString:db SQLString:dropEventTableSQL];

        NSString *dropIdentifyTableSQL = [NSString stringWithFormat:DROP_TABLE, IDENTIFY_TABLE_NAME];
        success &= [self execSQLString:db SQLString:dropIdentifyTableSQL];

        NSString *dropStoreTableSQL = [NSString stringWithFormat:DROP_TABLE, STORE_TABLE_NAME];
        success &= [self execSQLString:db SQLString:dropStoreTableSQL];

        NSString *dropLongStoreTableSQL = [NSString stringWithFormat:DROP_TABLE, LONG_STORE_TABLE_NAME];
        success &= [self execSQLString:db SQLString:dropLongStoreTableSQL];
    }];

    return success;
}

- (BOOL)resetDB:(BOOL) deleteDB
{
    BOOL success = YES;

    if (deleteDB) {
        success &= [self deleteDB];
    } else {
        success &= [self dropTables];
    }
    success &= [self createTables];

    return success;
}

- (BOOL)deleteDB
{
    if ([[NSFileManager defaultManager] fileExistsAtPath:_databasePath] == YES) {
        return [[NSFileManager defaultManager] removeItemAtPath:_databasePath error:NULL];
    }
    return YES;
}

- (BOOL)addEvent:(NSString*) event
{
    return [self addEventToTable:EVENT_TABLE_NAME event:event];
}

- (BOOL)addIdentify:(NSString*) identifyEvent
{
    return [self addEventToTable:IDENTIFY_TABLE_NAME event:identifyEvent];
}

- (BOOL)addEventToTable:(NSString*) table event:(NSString*) event
{
    __block BOOL success = YES;
    NSString *insertSQL = [NSString stringWithFormat:INSERT_EVENT, table, EVENT_FIELD];

    success &= [self inDatabaseWithStatement:insertSQL block:^(sqlite3_stmt *stmt) {
        if (sqlite3_bind_text(stmt, 1, [event UTF8String], -1, SQLITE_STATIC) != SQLITE_OK) {
            AMPLITUDE_LOG(@"Failed to bind event text to insert statement for adding event to table %@", table);
            success = NO;
            return;
        }

        if (sqlite3_step(stmt) != SQLITE_DONE) {
            AMPLITUDE_LOG(@"Failed to execute prepared statement to add event to table %@", table);
            success = NO;
        }
    }];

    if (!success) {
        [self resetDB:NO]; // not much we can do, just start fresh
    }
    return success;
}

- (NSMutableArray*)getEvents:(long long) upToId limit:(long long) limit
{
    return [self getEventsFromTable:EVENT_TABLE_NAME upToId:upToId limit:limit];
}

- (NSMutableArray*)getIdentifys:(long long) upToId limit:(long long) limit
{
    return [self getEventsFromTable:IDENTIFY_TABLE_NAME upToId:upToId limit:limit];
}

- (NSMutableArray*)getEventsFromTable:(NSString*) table upToId:(long long) upToId limit:(long long) limit
{
    __block NSMutableArray *events = [[NSMutableArray alloc] init];
    NSString *querySQL;
    if (upToId > 0 && limit > 0) {
        querySQL = [NSString stringWithFormat:GET_EVENT_WITH_UPTOID_AND_LIMIT, ID_FIELD, EVENT_FIELD, table, ID_FIELD, upToId, limit];
    } else if (upToId > 0) {
        querySQL = [NSString stringWithFormat:GET_EVENT_WITH_UPTOID, ID_FIELD, EVENT_FIELD, table, ID_FIELD, upToId];
    } else if (limit > 0) {
        querySQL = [NSString stringWithFormat:GET_EVENT_WITH_LIMIT, ID_FIELD, EVENT_FIELD, table, limit];
    } else {
        querySQL = [NSString stringWithFormat:GET_EVENT, ID_FIELD, EVENT_FIELD, table];
    }

    [self inDatabaseWithStatement:querySQL block:^(sqlite3_stmt *stmt) {
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            long long eventId = sqlite3_column_int64(stmt, 0);

            // need to handle null events saved to database
            const char *rawEventString = (const char*)sqlite3_column_text(stmt, 1);
            if (rawEventString == NULL) {
                AMPLITUDE_LOG(@"Ignoring NULL event string for event id %lld from table %@", eventId, table);
                continue;
            }
            NSString *eventString = [NSString stringWithUTF8String:rawEventString];
            if ([AMPUtils isEmptyString:eventString]) {
                AMPLITUDE_LOG(@"Ignoring empty event string for event id %lld from table %@", eventId, table);
                continue;
            }

            NSData *eventData = [eventString dataUsingEncoding:NSUTF8StringEncoding];
            NSError *error = nil;
            id eventImmutable = [NSJSONSerialization JSONObjectWithData:eventData options:0 error:&error];
            if (error != nil) {
                AMPLITUDE_LOG(@"Error JSON deserialization of event id %lld from table %@: %@", eventId, table, error);
                continue;
            }

            NSMutableDictionary *event = [eventImmutable mutableCopy];
            [event setValue:[NSNumber numberWithLongLong:eventId] forKey:@"event_id"];
            [events addObject:event];
            SAFE_ARC_RELEASE(event);
        }
    }];

    return SAFE_ARC_AUTORELEASE(events);
}

- (BOOL)insertOrReplaceKeyValue:(NSString*) key value:(NSString*) value
{
    if (value == nil) return [self deleteKeyFromTable:STORE_TABLE_NAME key:key];
    return [self insertOrReplaceKeyValueToTable:STORE_TABLE_NAME key:key value:value];
}

- (BOOL)insertOrReplaceKeyLongValue:(NSString *) key value:(NSNumber*) value
{
    if (value == nil) return [self deleteKeyFromTable:LONG_STORE_TABLE_NAME key:key];
    return [self insertOrReplaceKeyValueToTable:LONG_STORE_TABLE_NAME key:key value:value];
}

- (BOOL)insertOrReplaceKeyValueToTable:(NSString*) table key:(NSString*) key value:(NSObject*) value
{
    __block BOOL success = YES;
    NSString *insertSQL = [NSString stringWithFormat:INSERT_OR_REPLACE_KEY_VALUE, table, KEY_FIELD, VALUE_FIELD];

    success &= [self inDatabaseWithStatement:insertSQL block:^(sqlite3_stmt *stmt) {
        success &= sqlite3_bind_text(stmt, 1, [key UTF8String], -1, SQLITE_STATIC) == SQLITE_OK;
        if ([table isEqualToString:STORE_TABLE_NAME]) {
            success &= sqlite3_bind_text(stmt, 2, [(NSString *)value UTF8String], -1, SQLITE_STATIC) == SQLITE_OK;
        } else {
            success &= sqlite3_bind_int64(stmt, 2, [(NSNumber*)value longLongValue]) == SQLITE_OK;
        }

        if (!success) {
            AMPLITUDE_LOG(@"Failed to bind key %@ value %@ to statement", key, value);
            return;
        }

        if (sqlite3_step(stmt) != SQLITE_DONE) {
            AMPLITUDE_LOG(@"Failed to execute statement to insert key %@ value %@ to table %@", key, value, table);
            success = NO;
        }
    }];

    if (!success) {
        (void) [self resetDB:NO]; // not much we can do, just start fresh
    }
    return success;
}

- (BOOL) deleteKeyFromTable:(NSString*) table key:(NSString*) key
{
    __block BOOL success = YES;
    NSString *deleteSQL = [NSString stringWithFormat:DELETE_KEY, table, KEY_FIELD];

    success &= [self inDatabaseWithStatement:deleteSQL block:^(sqlite3_stmt *stmt) {
        if (sqlite3_bind_text(stmt, 1, [key UTF8String], -1, SQLITE_STATIC) != SQLITE_OK) {
            AMPLITUDE_LOG(@"Failed to bind key to statement to delete key %@ from table %@", key, table);
            success = NO;
            return;
        }

        if (sqlite3_step(stmt) != SQLITE_DONE) {
            AMPLITUDE_LOG(@"Failed to execute statement to delete key %@ from table %@", key, table);
            success = NO;
        }
    }];

    if (!success) {
        (void) [self resetDB:NO]; // not much we can do, just start fresh
    }
    return success;
}

- (NSString*)getValue:(NSString*) key
{
    return (NSString*)[self getValueFromTable:STORE_TABLE_NAME key:key];
}

- (NSNumber*)getLongValue:(NSString*) key
{
    return (NSNumber*)[self getValueFromTable:LONG_STORE_TABLE_NAME key:key];
}

- (NSObject*)getValueFromTable:(NSString*) table key:(NSString*) key
{
    __block NSObject *value = nil;
    NSString *querySQL = [NSString stringWithFormat:GET_VALUE, KEY_FIELD, VALUE_FIELD, table, KEY_FIELD];

    [self inDatabaseWithStatement:querySQL block:^(sqlite3_stmt *stmt) {
        if (sqlite3_bind_text(stmt, 1, [key UTF8String], -1, SQLITE_STATIC) != SQLITE_OK) {
            AMPLITUDE_LOG(@"Failed to bind key %@ to stmt when getValueFromTable %@", key, table);
            return;
        }

        if (sqlite3_step(stmt) == SQLITE_ROW) {
            if (sqlite3_column_type(stmt, 1) != SQLITE_NULL) {
                if ([table isEqualToString:STORE_TABLE_NAME]) {
                    value = [[NSString alloc] initWithUTF8String:(char*)sqlite3_column_text(stmt, 1)];
                } else {
                    long long longlongValue = sqlite3_column_int64(stmt, 1);
                    value = [[NSNumber alloc] initWithLongLong:longlongValue];
                }
            }
        } else {
            AMPLITUDE_LOG(@"Failed to get value for key %@ from table %@", key, table);
        }
    }];

    return SAFE_ARC_AUTORELEASE(value);
}

- (int)getEventCount
{
    return [self getEventCountFromTable:EVENT_TABLE_NAME];
}

- (int)getIdentifyCount
{
    return [self getEventCountFromTable:IDENTIFY_TABLE_NAME];
}

- (int)getTotalEventCount
{
    return [self getEventCount] + [self getIdentifyCount];
}

- (int)getEventCountFromTable:(NSString*) table
{
    __block int count = 0;
    NSString *querySQL = [NSString stringWithFormat:COUNT_EVENTS, table];

    [self inDatabaseWithStatement:querySQL  block:^(sqlite3_stmt *stmt) {
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            count = sqlite3_column_int(stmt, 0);
        } else {
            AMPLITUDE_LOG(@"Failed to get event count from table %@", table);
        }
    }];

    return count;
}

- (BOOL)removeEvents:(long long) maxId
{
    return [self removeEventsFromTable:EVENT_TABLE_NAME maxId:maxId];
}

- (BOOL)removeIdentifys:(long long) maxIdentifyId
{
    return [self removeEventsFromTable:IDENTIFY_TABLE_NAME maxId:maxIdentifyId];
}

- (BOOL)removeEventsFromTable:(NSString*) table maxId:(long long) maxId
{
    __block BOOL success = YES;

    success &= [self inDatabase:^(sqlite3 *db) {
        NSString *removeSQL = [NSString stringWithFormat:REMOVE_EVENTS, table, ID_FIELD, maxId];
        success &= [self execSQLString:db SQLString:removeSQL];
    }];

    return success;
}

- (BOOL)removeEvent:(long long) eventId
{
    return [self removeEventFromTable:EVENT_TABLE_NAME eventId:eventId];
}

- (BOOL)removeIdentify:(long long) identifyId
{
    return [self removeEventFromTable:IDENTIFY_TABLE_NAME eventId:identifyId];
}

- (BOOL)removeEventFromTable:(NSString*) table eventId:(long long) eventId
{
    __block BOOL success = YES;

    success &= [self inDatabase:^(sqlite3 *db) {
        NSString *removeSQL = [NSString stringWithFormat:REMOVE_EVENT, table, ID_FIELD, eventId];
        success &= [self execSQLString:db SQLString:removeSQL];
    }];

    return success;
}

- (long long)getNthEventId:(long long) n
{
    return [self getNthEventIdFromTable:EVENT_TABLE_NAME n:n];
}

- (long long)getNthIdentifyId:(long long) n
{
    return [self getNthEventIdFromTable:IDENTIFY_TABLE_NAME n:n];
}

- (long long)getNthEventIdFromTable:(NSString*) table n:(long long) n
{
    __block long long eventId = -1;
    NSString *querySQL = [NSString stringWithFormat:GET_NTH_EVENT_ID, ID_FIELD, table, n-1];

    [self inDatabaseWithStatement:querySQL block:^(sqlite3_stmt *stmt) {
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            eventId = sqlite3_column_int64(stmt, 0);
        } else {
            AMPLITUDE_LOG(@"Failed to getNthEventIdFromTable");
        }
    }];

    return eventId;
}

@end
