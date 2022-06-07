//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesRemoteAppLoader.h>
#import <EXUpdates/EXUpdatesCrypto.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesUtils.h>
#import <ExpoModulesCore/EXUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesRemoteAppLoader ()

@property (nonatomic, strong) EXUpdatesFileDownloader *downloader;
@property (nonatomic, strong) EXUpdatesUpdate *remoteUpdate;

@property (nonatomic, strong) dispatch_queue_t completionQueue;

@end
static NSString * const EXUpdatesRemoteAppLoaderErrorDomain = @"EXUpdatesRemoteAppLoader";

@implementation EXUpdatesRemoteAppLoader

- (instancetype)initWithConfig:(EXUpdatesConfig *)config
                      database:(EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
                launchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate
               completionQueue:(dispatch_queue_t)completionQueue
{
  if (self = [super initWithConfig:config database:database directory:directory launchedUpdate:launchedUpdate completionQueue:completionQueue]) {
    _downloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:self.config];
    _completionQueue = completionQueue;
  }
  return self;
}

- (void)loadUpdateFromUrl:(NSURL *)url
               onManifest:(EXUpdatesAppLoaderManifestBlock)manifestBlock
                    asset:(EXUpdatesAppLoaderAssetBlock)assetBlock
                  success:(EXUpdatesAppLoaderSuccessBlock)success
                    error:(EXUpdatesAppLoaderErrorBlock)error
{
  self.manifestBlock = manifestBlock;
  self.assetBlock = assetBlock;
  self.errorBlock = error;

  EX_WEAKIFY(self)
  self.successBlock = ^(EXUpdatesUpdate * _Nullable update) {
    EX_STRONGIFY(self)
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
    EXUpdatesUpdate *embeddedUpdate = [EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:self.config database:self.database];
    NSDictionary *extraHeaders = [EXUpdatesFileDownloader extraHeadersWithDatabase:self.database
                                                                            config:self.config
                                                                    launchedUpdate:self.launchedUpdate
                                                                    embeddedUpdate:embeddedUpdate];
    [self->_downloader downloadManifestFromURL:url withDatabase:self.database extraHeaders:extraHeaders successBlock:^(EXUpdatesUpdate *update) {
      self->_remoteUpdate = update;
      [self startLoadingFromManifest:update];
    } errorBlock:^(NSError *error) {
      if (self.errorBlock) {
        self.errorBlock(error);
      }
    }];
  });
}

- (void)downloadAsset:(EXUpdatesAsset *)asset
{
  NSURL *urlOnDisk = [self.directory URLByAppendingPathComponent:asset.filename];

  dispatch_async([EXUpdatesFileDownloader assetFilesQueue], ^{
    if ([[NSFileManager defaultManager] fileExistsAtPath:[urlOnDisk path]]) {
      // file already exists, we don't need to download it again
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [self handleAssetDownloadAlreadyExists:asset];
      });
    } else {
      if (!asset.url) {
        [self handleAssetDownloadWithError:[NSError errorWithDomain:EXUpdatesRemoteAppLoaderErrorDomain code:1006 userInfo:@{NSLocalizedDescriptionKey: @"Failed to download asset with no URL provided"}] asset:asset];
        return;
      }

      [self->_downloader downloadFileFromURL:asset.url
                               verifyingHash:asset.expectedHash
                                      toPath:[urlOnDisk path]
                                extraHeaders:asset.extraRequestHeaders ?: @{}
                                successBlock:^(NSData *data, NSURLResponse *response, NSString *base64URLEncodedSHA256Hash) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          [self handleAssetDownloadWithData:data response:response asset:asset];
        });
      }
                                  errorBlock:^(NSError *error) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          [self handleAssetDownloadWithError:error asset:asset];
        });
      }];
    }
  });
}

@end

NS_ASSUME_NONNULL_END
