//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncRemoteLoader.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncCrypto.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncFileDownloader.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXSyncRemoteLoader ()

@property (nonatomic, strong) ABI39_0_0EXSyncFileDownloader *downloader;

@end
static NSString * const ABI39_0_0EXSyncRemoteLoaderErrorDomain = @"ABI39_0_0EXSyncRemoteLoader";

@implementation ABI39_0_0EXSyncRemoteLoader

- (instancetype)initWithConfig:(ABI39_0_0EXSyncConfig *)config
                      database:(ABI39_0_0EXSyncDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue
{
  if (self = [super initWithConfig:config database:database directory:directory completionQueue:completionQueue]) {
    _downloader = [[ABI39_0_0EXSyncFileDownloader alloc] initWithUpdatesConfig:self.config];
  }
  return self;
}

- (void)loadUpdateFromUrl:(NSURL *)url
               onManifest:(ABI39_0_0EXSyncLoaderManifestBlock)manifestBlock
                  success:(ABI39_0_0EXSyncLoaderSuccessBlock)success
                    error:(ABI39_0_0EXSyncLoaderErrorBlock)error
{
  self.manifestBlock = manifestBlock;
  self.successBlock = success;
  self.errorBlock = error;
  [_downloader downloadManifestFromURL:url withDatabase:self.database cacheDirectory:self.directory successBlock:^(ABI39_0_0EXSyncManifest *update) {
    [self startLoadingFromManifest:update];
  } errorBlock:^(NSError *error, NSURLResponse *response) {
    if (self.errorBlock) {
      self.errorBlock(error);
    }
  }];
}

- (void)downloadAsset:(ABI39_0_0EXSyncAsset *)asset
{
  NSURL *urlOnDisk = [self.directory URLByAppendingPathComponent:asset.filename];

  dispatch_async([ABI39_0_0EXSyncFileDownloader assetFilesQueue], ^{
    if ([[NSFileManager defaultManager] fileExistsAtPath:[urlOnDisk path]]) {
      // file already exists, we don't need to download it again
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [self handleAssetDownloadAlreadyExists:asset];
      });
    } else {
      if (!asset.url) {
        [self handleAssetDownloadWithError:[NSError errorWithDomain:ABI39_0_0EXSyncRemoteLoaderErrorDomain code:1006 userInfo:@{NSLocalizedDescriptionKey: @"Failed to download asset with no URL provided"}] asset:asset];
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
