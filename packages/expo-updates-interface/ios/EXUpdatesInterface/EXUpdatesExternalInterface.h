//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesErrorBlock) (NSError *error);
typedef void (^EXUpdatesUpdateSuccessBlock) (NSDictionary * _Nullable manifest);
typedef void (^EXUpdatesQuerySuccessBlock) (NSArray<NSUUID *> * _Nonnull updateIds);
typedef void (^EXUpdatesProgressBlock) (NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount);
/**
 * Called when a manifest has been downloaded. The return value indicates whether or not to
 * continue downloading the update described by this manifest. Returning `NO` will abort the
 * load, and the success block will be immediately called with a nil `manifest`.
 */
typedef BOOL (^EXUpdatesManifestBlock) (NSDictionary *manifest);

/**
 * Protocol for modules that depend on expo-updates for loading production updates but do not want
 * to depend on expo-updates or delegate control to the singleton EXUpdatesAppController.
 */
@protocol EXUpdatesExternalInterface

@property (nonatomic, weak) id bridge;

- (NSURL *)launchAssetURL;

- (void)reset;

- (void)fetchUpdateWithConfiguration:(NSDictionary *)configuration
                          onManifest:(EXUpdatesManifestBlock)manifestBlock
                            progress:(EXUpdatesProgressBlock)progressBlock
                             success:(EXUpdatesUpdateSuccessBlock)successBlock
                               error:(EXUpdatesErrorBlock)errorBlock;

/**
 * Obtains a list of UUIDs for updates already in the updates DB that are in the READY state.
 * The success block will pass in the array of UUIDs
 */
- (void)storedUpdateIdsWithConfiguration:(NSDictionary *)configuration
                                 success:(EXUpdatesQuerySuccessBlock)successBlock
                                   error:(EXUpdatesErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
