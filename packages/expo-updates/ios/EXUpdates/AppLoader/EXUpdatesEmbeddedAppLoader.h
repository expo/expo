//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLoader+Private.h>

NS_ASSUME_NONNULL_BEGIN

extern NSString * const EXUpdatesEmbeddedManifestName;
extern NSString * const EXUpdatesEmbeddedManifestType;
extern NSString * const EXUpdatesEmbeddedBundleFilename;
extern NSString * const EXUpdatesEmbeddedBundleFileType;
extern NSString * const EXUpdatesBareEmbeddedBundleFilename;
extern NSString * const EXUpdatesBareEmbeddedBundleFileType;

@interface EXUpdatesEmbeddedAppLoader : EXUpdatesAppLoader

+ (nullable EXUpdatesUpdate *)embeddedManifestWithConfig:(EXUpdatesConfig *)config
                                                database:(nullable EXUpdatesDatabase *)database;

- (void)loadUpdateFromEmbeddedManifestWithCallback:(EXUpdatesAppLoaderManifestBlock)manifestBlock
                                           success:(EXUpdatesAppLoaderSuccessBlock)success
                                             error:(EXUpdatesAppLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
