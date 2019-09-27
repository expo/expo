//
//  AMPDatabaseHelper.h
//  Amplitude
//
//  Created by Daniel Jih on 9/9/15.
//  Copyright (c) 2015 Amplitude. All rights reserved.
//

@interface AMPDatabaseHelper : NSObject

@property (nonatomic, strong, readonly) NSString *databasePath;
@property (nonatomic, assign) BOOL callResetListenerOnDatabaseReset;

+ (AMPDatabaseHelper*)getDatabaseHelper;
+ (AMPDatabaseHelper*)getDatabaseHelper:(NSString*) instanceName;
- (BOOL)createTables;
- (BOOL)dropTables;
- (BOOL)upgrade:(int) oldVersion newVersion:(int) newVersion;
- (BOOL)resetDB:(BOOL) deleteDB;
- (BOOL)deleteDB;

- (BOOL)addEvent:(NSString*) event;
- (BOOL)addIdentify:(NSString*) identify;
- (NSMutableArray*)getEvents:(long long) upToId limit:(long long) limit;
- (NSMutableArray*)getIdentifys:(long long) upToId limit:(long long) limit;
- (int)getEventCount;
- (int)getIdentifyCount;
- (int)getTotalEventCount;
- (BOOL)removeEvents:(long long) maxId;
- (BOOL)removeIdentifys:(long long) maxIdentifyId;
- (BOOL)removeEvent:(long long) eventId;
- (BOOL)removeIdentify:(long long) identifyId;
- (long long)getNthEventId:(long long) n;
- (long long)getNthIdentifyId:(long long) n;

- (BOOL)insertOrReplaceKeyValue:(NSString*) key value:(NSString*) value;
- (BOOL)insertOrReplaceKeyLongValue:(NSString*) key value:(NSNumber*) value;
- (NSString*)getValue:(NSString*) key;
- (NSNumber*)getLongValue:(NSString*) key;

- (void)setDatabaseResetListener: (void (^)(void)) listener;

@end
