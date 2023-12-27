//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppLoader+Private.h>

NS_ASSUME_NONNULL_BEGIN

extern NSString * const ABI44_0_0EXUpdatesEmbeddedManifestName;
extern NSString * const ABI44_0_0EXUpdatesEmbeddedManifestType;
extern NSString * const ABI44_0_0EXUpdatesEmbeddedBundleFilename;
extern NSString * const ABI44_0_0EXUpdatesEmbeddedBundleFileType;
extern NSString * const ABI44_0_0EXUpdatesBareEmbeddedBundleFilename;
extern NSString * const ABI44_0_0EXUpdatesBareEmbeddedBundleFileType;

@interface ABI44_0_0EXUpdatesEmbeddedAppLoader : ABI44_0_0EXUpdatesAppLoader

+ (nullable ABI44_0_0EXUpdatesUpdate *)embeddedManifestWithConfig:(ABI44_0_0EXUpdatesConfig *)config
                                                database:(nullable ABI44_0_0EXUpdatesDatabase *)database;

- (void)loadUpdateFromEmbeddedManifestWithCallback:(ABI44_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                                           onAsset:(ABI44_0_0EXUpdatesAppLoaderAssetBlock)assetBlock
                                           success:(ABI44_0_0EXUpdatesAppLoaderSuccessBlock)success
                                             error:(ABI44_0_0EXUpdatesAppLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
