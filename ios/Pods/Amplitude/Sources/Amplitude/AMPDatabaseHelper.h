//
//  AMPDatabaseHelper.h
//  Copyright (c) 2015 Amplitude Inc. (https://amplitude.com/)
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

#import <Foundation/Foundation.h>

@interface AMPDatabaseHelper : NSObject

@property (nonatomic, strong, readonly) NSString *databasePath;

+ (AMPDatabaseHelper*)getDatabaseHelper;
+ (AMPDatabaseHelper*)getDatabaseHelper:(NSString*)instanceName;
- (BOOL)createTables;
- (BOOL)dropTables;
- (BOOL)upgrade:(int) oldVersion newVersion:(int)newVersion;
- (BOOL)resetDB:(BOOL) deleteDB;
- (BOOL)deleteDB;

- (BOOL)addEvent:(NSString*) event;
- (BOOL)addIdentify:(NSString*) identify;
- (NSMutableArray*)getEvents:(long long)upToId limit:(long long)limit;
- (NSMutableArray*)getIdentifys:(long long)upToId limit:(long long)limit;
- (int)getEventCount;
- (int)getIdentifyCount;
- (int)getTotalEventCount;
- (BOOL)removeEvents:(long long)maxId;
- (BOOL)removeIdentifys:(long long)maxIdentifyId;
- (BOOL)removeEvent:(long long)eventId;
- (BOOL)removeIdentify:(long long)identifyId;
- (long long)getNthEventId:(long long)n;
- (long long)getNthIdentifyId:(long long)n;

- (BOOL)insertOrReplaceKeyValue:(NSString*)key value:(NSString*)value;
- (BOOL)insertOrReplaceKeyLongValue:(NSString*)key value:(NSNumber*)value;
- (NSString*)getValue:(NSString*)key;
- (NSNumber*)getLongValue:(NSString*)key;

@end
