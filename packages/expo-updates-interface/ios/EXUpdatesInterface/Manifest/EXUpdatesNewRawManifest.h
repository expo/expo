//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdatesInterface/EXUpdatesRawManifest.h>
#import <EXUpdatesInterface/EXUpdatesBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesNewRawManifest : EXUpdatesBaseRawManifest<EXUpdatesRawManifestBehavior>

- (NSString *)createdAt;
- (NSString *)runtimeVersion;
- (NSDictionary *)launchAsset;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
