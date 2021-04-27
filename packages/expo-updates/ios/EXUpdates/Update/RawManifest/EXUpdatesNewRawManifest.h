//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesRawManifest.h>
#import <EXUpdates/EXUpdatesBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesNewRawManifest : EXUpdatesBaseRawManifest<EXUpdatesRawManifestBehavior>

- (NSString *)createdAt;
- (NSString *)runtimeVersion;
- (NSDictionary *)launchAsset;

@end

NS_ASSUME_NONNULL_END
