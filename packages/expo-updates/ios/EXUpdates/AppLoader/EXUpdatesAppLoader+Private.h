//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLoader.h>
#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesAppLoader ()

@property (nonatomic, strong) EXUpdatesConfig *config;
@property (nonatomic, strong) EXUpdatesDatabase *database;
@property (nonatomic, strong) NSURL *directory;
@property (nonatomic, strong, nullable) EXUpdatesUpdate *launchedUpdate;
@property (nonatomic, strong) EXUpdatesUpdate *updateManifest;
@property (nonatomic, copy) EXUpdatesAppLoaderManifestBlock manifestBlock;
@property (nonatomic, copy) EXUpdatesAppLoaderAssetBlock assetBlock;
@property (nonatomic, copy) EXUpdatesAppLoaderSuccessBlock successBlock;
@property (nonatomic, copy) EXUpdatesAppLoaderErrorBlock errorBlock;

- (void)startLoadingFromManifest:(EXUpdatesUpdate *)updateManifest;
- (void)handleAssetDownloadAlreadyExists:(EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithData:(NSData *)data response:(nullable NSURLResponse *)response asset:(EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithError:(NSError *)error asset:(EXUpdatesAsset *)asset;

- (void)downloadAsset:(EXUpdatesAsset *)asset;

@end

NS_ASSUME_NONNULL_END
