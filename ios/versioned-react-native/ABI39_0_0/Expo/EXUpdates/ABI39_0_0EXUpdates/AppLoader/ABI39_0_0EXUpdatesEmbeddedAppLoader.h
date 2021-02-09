//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesAppLoader+Private.h>

NS_ASSUME_NONNULL_BEGIN

extern NSString * const ABI39_0_0EXUpdatesEmbeddedManifestName;
extern NSString * const ABI39_0_0EXUpdatesEmbeddedManifestType;
extern NSString * const ABI39_0_0EXUpdatesEmbeddedBundleFilename;
extern NSString * const ABI39_0_0EXUpdatesEmbeddedBundleFileType;
extern NSString * const ABI39_0_0EXUpdatesBareEmbeddedBundleFilename;
extern NSString * const ABI39_0_0EXUpdatesBareEmbeddedBundleFileType;

@interface ABI39_0_0EXUpdatesEmbeddedAppLoader : ABI39_0_0EXUpdatesAppLoader

+ (nullable ABI39_0_0EXUpdatesUpdate *)embeddedManifestWithConfig:(ABI39_0_0EXUpdatesConfig *)config
                                                database:(nullable ABI39_0_0EXUpdatesDatabase *)database;

- (void)loadUpdateFromEmbeddedManifestWithCallback:(ABI39_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                                           success:(ABI39_0_0EXUpdatesAppLoaderSuccessBlock)success
                                             error:(ABI39_0_0EXUpdatesAppLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
