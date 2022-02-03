//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesCrypto.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesFileDownloader.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXUpdatesRemoteAppLoader ()

@property (nonatomic, strong) ABI43_0_0EXUpdatesFileDownloader *downloader;
@property (nonatomic, strong) ABI43_0_0EXUpdatesUpdate *remoteUpdate;

@property (nonatomic, strong) dispatch_queue_t completionQueue;

@end
static NSString * const ABI43_0_0EXUpdatesRemoteAppLoaderErrorDomain = @"ABI43_0_0EXUpdatesRemoteAppLoader";

@implementation ABI43_0_0EXUpdatesRemoteAppLoader

- (instancetype)initWithConfig:(ABI43_0_0EXUpdatesConfig *)config
                      database:(ABI43_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue
{
  if (self = [super initWithConfig:config database:database directory:directory completionQueue:completionQueue]) {
    _downloader = [[ABI43_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:self.config];
    _completionQueue = completionQueue;
  }
  return self;
}

- (void)loadUpdateFromUrl:(NSURL *)url
               onManifest:(ABI43_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                    asset:(ABI43_0_0EXUpdatesAppLoaderAssetBlock)assetBlock
                  success:(ABI43_0_0EXUpdatesAppLoaderSuccessBlock)success
                    error:(ABI43_0_0EXUpdatesAppLoaderErrorBlock)error
{
  self.manifestBlock = manifestBlock;
  self.assetBlock = assetBlock;
  self.errorBlock = error;

  ABI43_0_0EX_WEAKIFY(self)
  self.successBlock = ^(ABI43_0_0EXUpdatesUpdate * _Nullable update) {
    ABI43_0_0EX_STRONGIFY(self)
    // even if update is nil (meaning we didn't load a new update),
    // we want to persist the header data from _remoteUpdate
    if (self->_remoteUpdate) {
      dispatch_async(self.database.databaseQueue, ^{
        NSError *metadataError;
        [self.database setMetadataWithManifest:self->_remoteUpdate error:&metadataError];
        dispatch_async(self->_completionQueue, ^{
          if (metadataError) {
            NSLog(@"Error persisting header data to disk: %@", metadataError.localizedDescription);
            error(metadataError);
          } else {
            success(update);
          }
        });
      });
    } else {
      success(update);
    }
  };

  dispatch_async(self.database.databaseQueue, ^{
    NSError *headersError;
    NSDictionary *extraHeaders = [self.database serverDefinedHeadersWithScopeKey:self.config.scopeKey error:&headersError];
    if (headersError) {
      NSLog(@"Error selecting serverDefinedHeaders from database: %@", headersError.localizedDescription);
    }
    [self->_downloader downloadManifestFromURL:url withDatabase:self.database extraHeaders:extraHeaders successBlock:^(ABI43_0_0EXUpdatesUpdate *update) {
      self->_remoteUpdate = update;
      [self startLoadingFromManifest:update];
    } errorBlock:^(NSError *error, NSURLResponse *response) {
      if (self.errorBlock) {
        self.errorBlock(error);
      }
    }];
  });
}

- (void)downloadAsset:(ABI43_0_0EXUpdatesAsset *)asset
{
  NSURL *urlOnDisk = [self.directory URLByAppendingPathComponent:asset.filename];

  dispatch_async([ABI43_0_0EXUpdatesFileDownloader assetFilesQueue], ^{
    if ([[NSFileManager defaultManager] fileExistsAtPath:[urlOnDisk path]]) {
      // file already exists, we don't need to download it again
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [self handleAssetDownloadAlreadyExists:asset];
      });
    } else {
      if (!asset.url) {
        [self handleAssetDownloadWithError:[NSError errorWithDomain:ABI43_0_0EXUpdatesRemoteAppLoaderErrorDomain code:1006 userInfo:@{NSLocalizedDescriptionKey: @"Failed to download asset with no URL provided"}] asset:asset];
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
