//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncRemoteLoader.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncCrypto.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncFileDownloader.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXSyncRemoteLoader ()

@property (nonatomic, strong) ABI40_0_0EXSyncFileDownloader *downloader;

@end
static NSString * const ABI40_0_0EXSyncRemoteLoaderErrorDomain = @"ABI40_0_0EXSyncRemoteLoader";

@implementation ABI40_0_0EXSyncRemoteLoader

- (instancetype)initWithConfig:(ABI40_0_0EXSyncConfig *)config
                      database:(ABI40_0_0EXSyncDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue
{
  if (self = [super initWithConfig:config database:database directory:directory completionQueue:completionQueue]) {
    _downloader = [[ABI40_0_0EXSyncFileDownloader alloc] initWithUpdatesConfig:self.config];
  }
  return self;
}

- (void)loadUpdateFromUrl:(NSURL *)url
               onManifest:(ABI40_0_0EXSyncLoaderManifestBlock)manifestBlock
                  success:(ABI40_0_0EXSyncLoaderSuccessBlock)success
                    error:(ABI40_0_0EXSyncLoaderErrorBlock)error
{
  self.manifestBlock = manifestBlock;
  self.successBlock = success;
  self.errorBlock = error;
  [_downloader downloadManifestFromURL:url withDatabase:self.database cacheDirectory:self.directory successBlock:^(ABI40_0_0EXSyncManifest *update) {
    [self startLoadingFromManifest:update];
  } errorBlock:^(NSError *error, NSURLResponse *response) {
    if (self.errorBlock) {
      self.errorBlock(error);
    }
  }];
}

- (void)downloadAsset:(ABI40_0_0EXSyncAsset *)asset
{
  NSURL *urlOnDisk = [self.directory URLByAppendingPathComponent:asset.filename];

  dispatch_async([ABI40_0_0EXSyncFileDownloader assetFilesQueue], ^{
    if ([[NSFileManager defaultManager] fileExistsAtPath:[urlOnDisk path]]) {
      // file already exists, we don't need to download it again
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [self handleAssetDownloadAlreadyExists:asset];
      });
    } else {
      if (!asset.url) {
        [self handleAssetDownloadWithError:[NSError errorWithDomain:ABI40_0_0EXSyncRemoteLoaderErrorDomain code:1006 userInfo:@{NSLocalizedDescriptionKey: @"Failed to download asset with no URL provided"}] asset:asset];
        return;
      }

      [self->_downloader downloadFileFromURL:asset.url toPath:[urlOnDisk path] successBlock:^(NSData *data, NSURLResponse *response) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          [self handleAssetDownloadWithData:data response:response asset:asset];
        });
      } errorBlock:^(NSError *error, NSURLResponse *response) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          [self handleAssetDownloadWithError:error asset:asset];
        });
      }];
    }
  });
}

@end

NS_ASSUME_NONNULL_END
