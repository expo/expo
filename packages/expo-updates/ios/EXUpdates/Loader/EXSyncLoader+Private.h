//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncLoader.h>
#import <EXUpdates/EXSyncAsset.h>
#import <EXUpdates/EXSyncDatabase.h>
#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncLoader ()

@property (nonatomic, strong) EXSyncConfig *config;
@property (nonatomic, strong) EXSyncDatabase *database;
@property (nonatomic, strong) NSURL *directory;
@property (nonatomic, strong) EXSyncManifest *updateManifest;
@property (nonatomic, copy) EXSyncLoaderManifestBlock manifestBlock;
@property (nonatomic, copy) EXSyncLoaderSuccessBlock successBlock;
@property (nonatomic, copy) EXSyncLoaderErrorBlock errorBlock;

- (void)startLoadingFromManifest:(EXSyncManifest *)updateManifest;
- (void)handleAssetDownloadAlreadyExists:(EXSyncAsset *)asset;
- (void)handleAssetDownloadWithData:(NSData *)data response:(nullable NSURLResponse *)response asset:(EXSyncAsset *)asset;
- (void)handleAssetDownloadWithError:(NSError *)error asset:(EXSyncAsset *)asset;

- (void)downloadAsset:(EXSyncAsset *)asset;

@end

NS_ASSUME_NONNULL_END
