// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesDatabaseIntegrityCheck : NSObject

+ (BOOL)runWithDatabase:(EXUpdatesDatabase *)database
              directory:(NSURL *)directory
                 config:(EXUpdatesConfig *)config
         embeddedUpdate:(nullable EXUpdatesUpdate *)embeddedUpdate
                  error:(NSError ** _Nullable)error;

+ (BOOL)asset:(EXUpdatesAsset *)asset existsInDirectory:(NSURL *)directory;

@end

NS_ASSUME_NONNULL_END
