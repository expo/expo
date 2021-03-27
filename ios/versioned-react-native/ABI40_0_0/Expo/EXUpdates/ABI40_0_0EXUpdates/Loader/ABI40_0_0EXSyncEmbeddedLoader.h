//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncLoader+Private.h>

NS_ASSUME_NONNULL_BEGIN

extern NSString * const ABI40_0_0EXSyncEmbeddedManifestName;
extern NSString * const ABI40_0_0EXSyncEmbeddedManifestType;
extern NSString * const ABI40_0_0EXSyncEmbeddedBundleFilename;
extern NSString * const ABI40_0_0EXSyncEmbeddedBundleFileType;
extern NSString * const ABI40_0_0EXSyncBareEmbeddedBundleFilename;
extern NSString * const ABI40_0_0EXSyncBareEmbeddedBundleFileType;

@interface ABI40_0_0EXSyncEmbeddedLoader : ABI40_0_0EXSyncLoader

+ (nullable ABI40_0_0EXSyncManifest *)embeddedManifestWithConfig:(ABI40_0_0EXSyncConfig *)config
                                                database:(nullable ABI40_0_0EXSyncDatabase *)database;

- (void)loadUpdateFromEmbeddedManifestWithCallback:(ABI40_0_0EXSyncLoaderManifestBlock)manifestBlock
                                           success:(ABI40_0_0EXSyncLoaderSuccessBlock)success
                                             error:(ABI40_0_0EXSyncLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
