//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesAppLoader.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesAsset.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesDatabase.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXUpdatesAppLoader ()

@property (nonatomic, strong) ABI40_0_0EXUpdatesConfig *config;
@property (nonatomic, strong) ABI40_0_0EXUpdatesDatabase *database;
@property (nonatomic, strong) NSURL *directory;
@property (nonatomic, strong) ABI40_0_0EXUpdatesUpdate *updateManifest;
@property (nonatomic, copy) ABI40_0_0EXUpdatesAppLoaderManifestBlock manifestBlock;
@property (nonatomic, copy) ABI40_0_0EXUpdatesAppLoaderSuccessBlock successBlock;
@property (nonatomic, copy) ABI40_0_0EXUpdatesAppLoaderErrorBlock errorBlock;

- (void)startLoadingFromManifest:(ABI40_0_0EXUpdatesUpdate *)updateManifest;
- (void)handleAssetDownloadAlreadyExists:(ABI40_0_0EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithData:(NSData *)data response:(nullable NSURLResponse *)response asset:(ABI40_0_0EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithError:(NSError *)error asset:(ABI40_0_0EXUpdatesAsset *)asset;

- (void)downloadAsset:(ABI40_0_0EXUpdatesAsset *)asset;

@end

NS_ASSUME_NONNULL_END
