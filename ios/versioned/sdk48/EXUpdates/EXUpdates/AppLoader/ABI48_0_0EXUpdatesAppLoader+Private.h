//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAppLoader.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAsset.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesDatabase.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXUpdatesAppLoader ()

@property (nonatomic, strong) ABI48_0_0EXUpdatesConfig *config;
@property (nonatomic, strong) ABI48_0_0EXUpdatesDatabase *database;
@property (nonatomic, strong) NSURL *directory;
@property (nonatomic, strong, nullable) ABI48_0_0EXUpdatesUpdate *launchedUpdate;
@property (nonatomic, strong) ABI48_0_0EXUpdatesUpdate *updateManifest;
@property (nonatomic, copy) ABI48_0_0EXUpdatesAppLoaderManifestBlock manifestBlock;
@property (nonatomic, copy) ABI48_0_0EXUpdatesAppLoaderAssetBlock assetBlock;
@property (nonatomic, copy) ABI48_0_0EXUpdatesAppLoaderSuccessBlock successBlock;
@property (nonatomic, copy) ABI48_0_0EXUpdatesAppLoaderErrorBlock errorBlock;

- (void)startLoadingFromManifest:(ABI48_0_0EXUpdatesUpdate *)updateManifest;
- (void)handleAssetDownloadAlreadyExists:(ABI48_0_0EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithData:(NSData *)data response:(nullable NSURLResponse *)response asset:(ABI48_0_0EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithError:(NSError *)error asset:(ABI48_0_0EXUpdatesAsset *)asset;

- (void)downloadAsset:(ABI48_0_0EXUpdatesAsset *)asset;

@end

NS_ASSUME_NONNULL_END
