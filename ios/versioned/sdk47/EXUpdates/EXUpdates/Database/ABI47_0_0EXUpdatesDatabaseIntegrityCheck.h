// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesConfig.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesDatabase.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXUpdatesDatabaseIntegrityCheck : NSObject

+ (BOOL)runWithDatabase:(ABI47_0_0EXUpdatesDatabase *)database
              directory:(NSURL *)directory
                 config:(ABI47_0_0EXUpdatesConfig *)config
         embeddedUpdate:(nullable ABI47_0_0EXUpdatesUpdate *)embeddedUpdate
                  error:(NSError ** _Nullable)error;

+ (BOOL)asset:(ABI47_0_0EXUpdatesAsset *)asset existsInDirectory:(NSURL *)directory;

@end

NS_ASSUME_NONNULL_END
