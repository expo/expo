//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesAppLoader+Private.h>

NS_ASSUME_NONNULL_BEGIN

extern NSString * const ABI42_0_0EXUpdatesEmbeddedManifestName;
extern NSString * const ABI42_0_0EXUpdatesEmbeddedManifestType;
extern NSString * const ABI42_0_0EXUpdatesEmbeddedBundleFilename;
extern NSString * const ABI42_0_0EXUpdatesEmbeddedBundleFileType;
extern NSString * const ABI42_0_0EXUpdatesBareEmbeddedBundleFilename;
extern NSString * const ABI42_0_0EXUpdatesBareEmbeddedBundleFileType;

@interface ABI42_0_0EXUpdatesEmbeddedAppLoader : ABI42_0_0EXUpdatesAppLoader

+ (nullable ABI42_0_0EXUpdatesUpdate *)embeddedManifestWithConfig:(ABI42_0_0EXUpdatesConfig *)config
                                                database:(nullable ABI42_0_0EXUpdatesDatabase *)database;

- (void)loadUpdateFromEmbeddedManifestWithCallback:(ABI42_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                                           onAsset:(ABI42_0_0EXUpdatesAppLoaderAssetBlock)assetBlock
                                           success:(ABI42_0_0EXUpdatesAppLoaderSuccessBlock)success
                                             error:(ABI42_0_0EXUpdatesAppLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
