//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncFileDownloader.h>
#import <EXUpdates/EXSyncEmbeddedLoader.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const EXSyncEmbeddedManifestName = @"app";
NSString * const EXSyncEmbeddedManifestType = @"manifest";
NSString * const EXSyncEmbeddedBundleFilename = @"app";
NSString * const EXSyncEmbeddedBundleFileType = @"bundle";
NSString * const EXSyncBareEmbeddedBundleFilename = @"main";
NSString * const EXSyncBareEmbeddedBundleFileType = @"jsbundle";

static NSString * const EXSyncEmbeddedLoaderErrorDomain = @"EXSyncEmbeddedLoader";

@implementation EXSyncEmbeddedLoader

+ (nullable EXSyncManifest *)embeddedManifestWithConfig:(EXSyncConfig *)config
                                                database:(nullable EXSyncDatabase *)database
{
  static EXSyncManifest *embeddedManifest;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!config.hasEmbeddedUpdate) {
      embeddedManifest = nil;
    } else if (!embeddedManifest) {
      NSString *path = [[NSBundle mainBundle] pathForResource:EXSyncEmbeddedManifestName ofType:EXSyncEmbeddedManifestType];
      NSData *manifestData = [NSData dataWithContentsOfFile:path];
      if (!manifestData) {
        @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                       reason:@"The embedded manifest is invalid or could not be read. Make sure you have configured expo-updates correctly in your Xcode Build Phases."
                                     userInfo:@{}];
      }

      NSError *err;
      id manifest = [NSJSONSerialization JSONObjectWithData:manifestData options:kNilOptions error:&err];
      if (!manifest) {
        @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                       reason:@"The embedded manifest is invalid or could not be read. Make sure you have configured expo-updates correctly in your Xcode Build Phases."
                                     userInfo:@{}];
      } else {
        NSAssert([manifest isKindOfClass:[NSDictionary class]], @"embedded manifest should be a valid JSON file");
        NSMutableDictionary *mutableManifest = [manifest mutableCopy];
        // automatically verify embedded manifest since it was already codesigned
        mutableManifest[@"isVerified"] = @(YES);
        embeddedManifest = [EXSyncManifest updateWithEmbeddedManifest:[mutableManifest copy]
                                                                config:config
                                                              database:database];
        if (!embeddedManifest.updateId) {
          @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                         reason:@"The embedded manifest is invalid. Make sure you have configured expo-updates correctly in your Xcode Build Phases."
                                       userInfo:@{}];
        }
      }
    }
  });
  return embeddedManifest;
}

- (void)loadUpdateFromEmbeddedManifestWithCallback:(EXSyncLoaderManifestBlock)manifestBlock
                                           success:(EXSyncLoaderSuccessBlock)success
                                             error:(EXSyncLoaderErrorBlock)error
{
  EXSyncManifest *embeddedManifest = [[self class] embeddedManifestWithConfig:self.config
                                                                      database:self.database];
  if (embeddedManifest) {
    self.manifestBlock = manifestBlock;
    self.successBlock = success;
    self.errorBlock = error;
    [self startLoadingFromManifest:embeddedManifest];
  } else {
    error([NSError errorWithDomain:EXSyncEmbeddedLoaderErrorDomain
                              code:1008
                          userInfo:@{NSLocalizedDescriptionKey: @"Failed to load embedded manifest. Make sure you have configured expo-updates correctly."}]);
  }
}

- (void)downloadAsset:(EXSyncAsset *)asset
{
  NSURL *destinationUrl = [self.directory URLByAppendingPathComponent:asset.filename];

  dispatch_async([EXSyncFileDownloader assetFilesQueue], ^{
    if ([[NSFileManager defaultManager] fileExistsAtPath:[destinationUrl path]]) {
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [self handleAssetDownloadAlreadyExists:asset];
      });
    } else {
      NSAssert(asset.mainBundleFilename, @"embedded asset mainBundleFilename must be nonnull");
      NSString *bundlePath = asset.mainBundleDir
        ? [[NSBundle mainBundle] pathForResource:asset.mainBundleFilename ofType:asset.type inDirectory:asset.mainBundleDir]
        : [[NSBundle mainBundle] pathForResource:asset.mainBundleFilename ofType:asset.type];
      NSAssert(bundlePath, @"NSBundle must contain the expected assets");

      if (!bundlePath) {
        @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                       reason:[NSString stringWithFormat:@"Could not find the expected embedded asset %@.%@. Check that expo-updates is installed correctly.", asset.mainBundleFilename, asset.type]
                                     userInfo:nil];
      }

      NSError *err;
      if ([[NSFileManager defaultManager] copyItemAtPath:bundlePath toPath:[destinationUrl path] error:&err]) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          [self handleAssetDownloadWithData:[NSData dataWithContentsOfFile:bundlePath] response:nil asset:asset];
        });
      } else {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          [self handleAssetDownloadWithError:err asset:asset];
        });
      }
    }
  });
}

- (void)loadUpdateFromUrl:(NSURL *)url
                  success:(EXSyncLoaderSuccessBlock)success
                    error:(EXSyncLoaderErrorBlock)error
{
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call EXSyncEmbeddedLoader#loadUpdateFromUrl" userInfo:nil];
}

@end

NS_ASSUME_NONNULL_END
