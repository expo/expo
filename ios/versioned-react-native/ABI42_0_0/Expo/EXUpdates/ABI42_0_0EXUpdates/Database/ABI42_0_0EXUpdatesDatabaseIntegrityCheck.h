// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesConfig.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabase.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesDatabaseIntegrityCheck : NSObject

+ (BOOL)runWithDatabase:(ABI42_0_0EXUpdatesDatabase *)database
              directory:(NSURL *)directory
                 config:(ABI42_0_0EXUpdatesConfig *)config
         embeddedUpdate:(nullable ABI42_0_0EXUpdatesUpdate *)embeddedUpdate
                  error:(NSError ** _Nullable)error;

+ (BOOL)asset:(ABI42_0_0EXUpdatesAsset *)asset existsInDirectory:(NSURL *)directory;

@end

NS_ASSUME_NONNULL_END
