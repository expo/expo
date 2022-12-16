//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesAppLoader.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesAsset.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesDatabase.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXUpdatesAppLoader ()

@property (nonatomic, strong) ABI45_0_0EXUpdatesConfig *config;
@property (nonatomic, strong) ABI45_0_0EXUpdatesDatabase *database;
@property (nonatomic, strong) NSURL *directory;
@property (nonatomic, strong, nullable) ABI45_0_0EXUpdatesUpdate *launchedUpdate;
@property (nonatomic, strong) ABI45_0_0EXUpdatesUpdate *updateManifest;
@property (nonatomic, copy) ABI45_0_0EXUpdatesAppLoaderManifestBlock manifestBlock;
@property (nonatomic, copy) ABI45_0_0EXUpdatesAppLoaderAssetBlock assetBlock;
@property (nonatomic, copy) ABI45_0_0EXUpdatesAppLoaderSuccessBlock successBlock;
@property (nonatomic, copy) ABI45_0_0EXUpdatesAppLoaderErrorBlock errorBlock;

- (void)startLoadingFromManifest:(ABI45_0_0EXUpdatesUpdate *)updateManifest;
- (void)handleAssetDownloadAlreadyExists:(ABI45_0_0EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithData:(NSData *)data response:(nullable NSURLResponse *)response asset:(ABI45_0_0EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithError:(NSError *)error asset:(ABI45_0_0EXUpdatesAsset *)asset;

- (void)downloadAsset:(ABI45_0_0EXUpdatesAsset *)asset;

@end

NS_ASSUME_NONNULL_END
