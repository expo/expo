// Copyright 2021-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <sqlite3.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesDatabaseInitialization : NSObject

+ (BOOL)initializeDatabaseWithLatestSchemaInDirectory:(NSURL *)directory
                                             database:(struct sqlite3 * _Nullable * _Nonnull)database
                                                error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
