//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncLoader.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncAsset.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncDatabase.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXSyncLoader ()

@property (nonatomic, strong) ABI39_0_0EXSyncConfig *config;
@property (nonatomic, strong) ABI39_0_0EXSyncDatabase *database;
@property (nonatomic, strong) NSURL *directory;
@property (nonatomic, strong) ABI39_0_0EXSyncManifest *updateManifest;
@property (nonatomic, copy) ABI39_0_0EXSyncLoaderManifestBlock manifestBlock;
@property (nonatomic, copy) ABI39_0_0EXSyncLoaderSuccessBlock successBlock;
@property (nonatomic, copy) ABI39_0_0EXSyncLoaderErrorBlock errorBlock;

- (void)startLoadingFromManifest:(ABI39_0_0EXSyncManifest *)updateManifest;
- (void)handleAssetDownloadAlreadyExists:(ABI39_0_0EXSyncAsset *)asset;
- (void)handleAssetDownloadWithData:(NSData *)data response:(nullable NSURLResponse *)response asset:(ABI39_0_0EXSyncAsset *)asset;
- (void)handleAssetDownloadWithError:(NSError *)error asset:(ABI39_0_0EXSyncAsset *)asset;

- (void)downloadAsset:(ABI39_0_0EXSyncAsset *)asset;

@end

NS_ASSUME_NONNULL_END
