//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncFileDownloader.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncEmbeddedLoader.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI39_0_0EXSyncEmbeddedManifestName = @"app";
NSString * const ABI39_0_0EXSyncEmbeddedManifestType = @"manifest";
NSString * const ABI39_0_0EXSyncEmbeddedBundleFilename = @"app";
NSString * const ABI39_0_0EXSyncEmbeddedBundleFileType = @"bundle";
NSString * const ABI39_0_0EXSyncBareEmbeddedBundleFilename = @"main";
NSString * const ABI39_0_0EXSyncBareEmbeddedBundleFileType = @"jsbundle";

static NSString * const ABI39_0_0EXSyncEmbeddedLoaderErrorDomain = @"ABI39_0_0EXSyncEmbeddedLoader";

@implementation ABI39_0_0EXSyncEmbeddedLoader

+ (nullable ABI39_0_0EXSyncManifest *)embeddedManifestWithConfig:(ABI39_0_0EXSyncConfig *)config
                                                database:(nullable ABI39_0_0EXSyncDatabase *)database
{
  static ABI39_0_0EXSyncManifest *embeddedManifest;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!config.hasEmbeddedUpdate) {
      embeddedManifest = nil;
    } else if (!embeddedManifest) {
      NSString *path = [[NSBundle mainBundle] pathForResource:ABI39_0_0EXSyncEmbeddedManifestName ofType:ABI39_0_0EXSyncEmbeddedManifestType];
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
        embeddedManifest = [ABI39_0_0EXSyncManifest updateWithEmbeddedManifest:[mutableManifest copy]
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

- (void)loadUpdateFromEmbeddedManifestWithCallback:(ABI39_0_0EXSyncLoaderManifestBlock)manifestBlock
                                           success:(ABI39_0_0EXSyncLoaderSuccessBlock)success
                                             error:(ABI39_0_0EXSyncLoaderErrorBlock)error
{
  ABI39_0_0EXSyncManifest *embeddedManifest = [[self class] embeddedManifestWithConfig:self.config
                                                                      database:self.database];
  if (embeddedManifest) {
    self.manifestBlock = manifestBlock;
    self.successBlock = success;
    self.errorBlock = error;
    [self startLoadingFromManifest:embeddedManifest];
  } else {
    error([NSError errorWithDomain:ABI39_0_0EXSyncEmbeddedLoaderErrorDomain
                              code:1008
                          userInfo:@{NSLocalizedDescriptionKey: @"Failed to load embedded manifest. Make sure you have configured expo-updates correctly."}]);
  }
}

- (void)downloadAsset:(ABI39_0_0EXSyncAsset *)asset
{
  NSURL *destinationUrl = [self.directory URLByAppendingPathComponent:asset.filename];

  dispatch_async([ABI39_0_0EXSyncFileDownloader assetFilesQueue], ^{
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
                  success:(ABI39_0_0EXSyncLoaderSuccessBlock)success
                    error:(ABI39_0_0EXSyncLoaderErrorBlock)error
{
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call ABI39_0_0EXSyncEmbeddedLoader#loadUpdateFromUrl" userInfo:nil];
}

@end

NS_ASSUME_NONNULL_END
