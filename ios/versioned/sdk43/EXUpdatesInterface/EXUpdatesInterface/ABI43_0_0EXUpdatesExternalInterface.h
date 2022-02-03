//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI43_0_0EXUpdatesErrorBlock) (NSError *error);
typedef void (^ABI43_0_0EXUpdatesSuccessBlock) (NSDictionary * _Nullable manifest);
typedef void (^ABI43_0_0EXUpdatesProgressBlock) (NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount);
/**
 * Called when a manifest has been downloaded. The return value indicates whether or not to
 * continue downloading the update described by this manifest. Returning `NO` will abort the
 * load, and the success block will be immediately called with a nil `manifest`.
 */
typedef BOOL (^ABI43_0_0EXUpdatesManifestBlock) (NSDictionary *manifest);

/**
 * Protocol for modules that depend on expo-updates for loading production updates but do not want
 * to depend on expo-updates or delegate control to the singleton ABI43_0_0EXUpdatesAppController.
 */
@protocol ABI43_0_0EXUpdatesExternalInterface

@property (nonatomic, weak) id bridge;

- (NSURL *)launchAssetURL;

- (void)reset;

- (void)fetchUpdateWithConfiguration:(NSDictionary *)configuration
                          onManifest:(ABI43_0_0EXUpdatesManifestBlock)manifestBlock
                            progress:(ABI43_0_0EXUpdatesProgressBlock)progressBlock
                             success:(ABI43_0_0EXUpdatesSuccessBlock)successBlock
                               error:(ABI43_0_0EXUpdatesErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
