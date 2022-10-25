// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesDatabaseInitialization.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesDatabaseMigration.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXUpdatesDatabaseInitialization (Tests)

+ (BOOL)initializeDatabaseWithLatestSchemaInDirectory:(NSURL *)directory
                                             database:(struct sqlite3 * _Nullable * _Nonnull)database
                                           migrations:(NSArray<id<ABI47_0_0EXUpdatesDatabaseMigration>> *)migrations
                                                error:(NSError ** _Nullable)error;

+ (BOOL)initializeDatabaseWithSchema:(NSString *)schema
                            filename:(NSString *)filename
                         inDirectory:(NSURL *)directory
                       shouldMigrate:(BOOL)shouldMigrate
                          migrations:(NSArray<id<ABI47_0_0EXUpdatesDatabaseMigration>> *)migrations
                            database:(struct sqlite3 * _Nullable * _Nonnull)database
                               error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
