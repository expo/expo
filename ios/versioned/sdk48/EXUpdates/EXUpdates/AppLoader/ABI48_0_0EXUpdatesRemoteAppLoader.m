//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesCrypto.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesFileDownloader.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUtils.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXUpdatesRemoteAppLoader ()

@property (nonatomic, strong) ABI48_0_0EXUpdatesFileDownloader *downloader;
@property (nonatomic, strong) ABI48_0_0EXUpdatesUpdate *remoteUpdate;

@property (nonatomic, strong) dispatch_queue_t completionQueue;

@end
static NSString * const ABI48_0_0EXUpdatesRemoteAppLoaderErrorDomain = @"ABI48_0_0EXUpdatesRemoteAppLoader";

/**
 * Subclass of ABI48_0_0EXUpdatesAppLoader which handles downloading updates from a remote server.
 */
@implementation ABI48_0_0EXUpdatesRemoteAppLoader

- (instancetype)initWithConfig:(ABI48_0_0EXUpdatesConfig *)config
                      database:(ABI48_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
                launchedUpdate:(nullable ABI48_0_0EXUpdatesUpdate *)launchedUpdate
               completionQueue:(dispatch_queue_t)completionQueue
{
  if (self = [super initWithConfig:config database:database directory:directory launchedUpdate:launchedUpdate completionQueue:completionQueue]) {
    _downloader = [[ABI48_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:self.config];
    _completionQueue = completionQueue;
  }
  return self;
}

- (void)loadUpdateFromUrl:(NSURL *)url
               onManifest:(ABI48_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                    asset:(ABI48_0_0EXUpdatesAppLoaderAssetBlock)assetBlock
                  success:(ABI48_0_0EXUpdatesAppLoaderSuccessBlock)success
                    error:(ABI48_0_0EXUpdatesAppLoaderErrorBlock)error
{
  self.manifestBlock = manifestBlock;
  self.assetBlock = assetBlock;
  self.errorBlock = error;

  ABI48_0_0EX_WEAKIFY(self)
  self.successBlock = ^(ABI48_0_0EXUpdatesUpdate * _Nullable update) {
    ABI48_0_0EX_STRONGIFY(self)
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
    ABI48_0_0EXUpdatesUpdate *embeddedUpdate = [ABI48_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:self.config database:self.database];
    NSDictionary *extraHeaders = [ABI48_0_0EXUpdatesFileDownloader extraHeadersWithDatabase:self.database
                                                                            config:self.config
                                                                    launchedUpdate:self.launchedUpdate
                                                                    embeddedUpdate:embeddedUpdate];
    [self->_downloader downloadManifestFromURL:url withDatabase:self.database extraHeaders:extraHeaders successBlock:^(ABI48_0_0EXUpdatesUpdate *update) {
      self->_remoteUpdate = update;
      [self startLoadingFromManifest:update];
    } errorBlock:^(NSError *error) {
      if (self.errorBlock) {
        self.errorBlock(error);
      }
    }];
  });
}

- (void)downloadAsset:(ABI48_0_0EXUpdatesAsset *)asset
{
  NSURL *urlOnDisk = [self.directory URLByAppendingPathComponent:asset.filename];

  dispatch_async([ABI48_0_0EXUpdatesFileDownloader assetFilesQueue], ^{
    if ([[NSFileManager defaultManager] fileExistsAtPath:[urlOnDisk path]]) {
      // file already exists, we don't need to download it again
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [self handleAssetDownloadAlreadyExists:asset];
      });
    } else {
      if (!asset.url) {
        [self handleAssetDownloadWithError:[NSError errorWithDomain:ABI48_0_0EXUpdatesRemoteAppLoaderErrorDomain code:1006 userInfo:@{NSLocalizedDescriptionKey: @"Failed to download asset with no URL provided"}] asset:asset];
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
