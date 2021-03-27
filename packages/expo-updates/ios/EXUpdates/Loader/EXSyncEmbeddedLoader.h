//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncLoader+Private.h>

NS_ASSUME_NONNULL_BEGIN

extern NSString * const EXSyncEmbeddedManifestName;
extern NSString * const EXSyncEmbeddedManifestType;
extern NSString * const EXSyncEmbeddedBundleFilename;
extern NSString * const EXSyncEmbeddedBundleFileType;
extern NSString * const EXSyncBareEmbeddedBundleFilename;
extern NSString * const EXSyncBareEmbeddedBundleFileType;

@interface EXSyncEmbeddedLoader : EXSyncLoader

+ (nullable EXSyncManifest *)embeddedManifestWithConfig:(EXSyncConfig *)config
                                                database:(nullable EXSyncDatabase *)database;

- (void)loadUpdateFromEmbeddedManifestWithCallback:(EXSyncLoaderManifestBlock)manifestBlock
                                           success:(EXSyncLoaderSuccessBlock)success
                                             error:(EXSyncLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
