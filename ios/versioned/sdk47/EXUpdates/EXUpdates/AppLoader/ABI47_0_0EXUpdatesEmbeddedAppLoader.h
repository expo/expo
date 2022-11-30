//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAppLoader+Private.h>

NS_ASSUME_NONNULL_BEGIN

extern NSString * const ABI47_0_0EXUpdatesEmbeddedManifestName;
extern NSString * const ABI47_0_0EXUpdatesEmbeddedManifestType;
extern NSString * const ABI47_0_0EXUpdatesEmbeddedBundleFilename;
extern NSString * const ABI47_0_0EXUpdatesEmbeddedBundleFileType;
extern NSString * const ABI47_0_0EXUpdatesBareEmbeddedBundleFilename;
extern NSString * const ABI47_0_0EXUpdatesBareEmbeddedBundleFileType;

@interface ABI47_0_0EXUpdatesEmbeddedAppLoader : ABI47_0_0EXUpdatesAppLoader

+ (nullable ABI47_0_0EXUpdatesUpdate *)embeddedManifestWithConfig:(ABI47_0_0EXUpdatesConfig *)config
                                                database:(nullable ABI47_0_0EXUpdatesDatabase *)database;

- (void)loadUpdateFromEmbeddedManifestWithCallback:(ABI47_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                                           onAsset:(ABI47_0_0EXUpdatesAppLoaderAssetBlock)assetBlock
                                           success:(ABI47_0_0EXUpdatesAppLoaderSuccessBlock)success
                                             error:(ABI47_0_0EXUpdatesAppLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
