//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesErrorBlock) (NSError *error);
typedef void (^EXUpdatesSuccessBlock) (NSDictionary *manifest);
typedef void (^EXUpdatesProgressBlock) (NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount);
typedef BOOL (^EXUpdatesManifestBlock) (NSDictionary *manifest);

@protocol EXUpdatesInterface

@property (nonatomic, weak) id bridge;

- (NSURL *)launchAssetURL;

- (void)fetchUpdateWithConfiguration:(NSDictionary *)configuration
                          onManifest:(EXUpdatesManifestBlock)manifestBlock
                            progress:(EXUpdatesProgressBlock)progressBlock
                             success:(EXUpdatesSuccessBlock)successBlock
                               error:(EXUpdatesErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
