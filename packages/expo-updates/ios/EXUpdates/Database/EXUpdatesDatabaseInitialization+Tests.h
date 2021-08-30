// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabaseInitialization.h>
#import <EXUpdates/EXUpdatesDatabaseMigration.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesDatabaseInitialization (Tests)

+ (BOOL)initializeDatabaseWithLatestSchemaInDirectory:(NSURL *)directory
                                             database:(struct sqlite3 * _Nullable * _Nonnull)database
                                           migrations:(NSArray<id<EXUpdatesDatabaseMigration>> *)migrations
                                                error:(NSError ** _Nullable)error;

+ (BOOL)initializeDatabaseWithSchema:(NSString *)schema
                            filename:(NSString *)filename
                         inDirectory:(NSURL *)directory
                       shouldMigrate:(BOOL)shouldMigrate
                          migrations:(NSArray<id<EXUpdatesDatabaseMigration>> *)migrations
                            database:(struct sqlite3 * _Nullable * _Nonnull)database
                               error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
