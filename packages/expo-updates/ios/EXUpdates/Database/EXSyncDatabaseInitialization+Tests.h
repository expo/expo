// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncDatabaseInitialization.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncDatabaseInitialization (Tests)

+ (BOOL)initializeDatabaseWithSchema:(NSString *)schema
                            filename:(NSString *)filename
                         inDirectory:(NSURL *)directory
                       shouldMigrate:(BOOL)shouldMigrate
                            database:(struct sqlite3 * _Nullable * _Nonnull)database
                               error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
