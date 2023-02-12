//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const EXUpdatesEmbeddedManifestName = @"app";
NSString * const EXUpdatesEmbeddedManifestType = @"manifest";
NSString * const EXUpdatesEmbeddedBundleFilename = @"app";
NSString * const EXUpdatesEmbeddedBundleFileType = @"bundle";
NSString * const EXUpdatesBareEmbeddedBundleFilename = @"main";
NSString * const EXUpdatesBareEmbeddedBundleFileType = @"jsbundle";

static NSString * const EXUpdatesEmbeddedAppLoaderErrorDomain = @"EXUpdatesEmbeddedAppLoader";

/**
 * Subclass of EXUpdatesAppLoader which handles copying the embedded update's assets into the
 * expo-updates cache location.
 *
 * Rather than launching the embedded update directly from its location in the app bundle/apk, we
 * first try to read it into the expo-updates cache and database and launch it like any other
 * update. The benefits of this include (a) a single code path for launching most updates and (b)
 * assets included in embedded updates and copied into the cache in this way do not need to be
 * redownloaded if included in future updates.
 */
@implementation EXUpdatesEmbeddedAppLoader

+ (nullable EXUpdatesUpdate *)embeddedManifestWithConfig:(EXUpdatesConfig *)config
                                                database:(nullable EXUpdatesDatabase *)database
{
  static EXUpdatesUpdate *embeddedManifest;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!config.hasEmbeddedUpdate) {
      embeddedManifest = nil;
    } else if (!embeddedManifest) {
      NSBundle *frameworkBundle = [NSBundle bundleForClass:[self class]];
      NSURL *bundleUrl = [frameworkBundle.resourceURL URLByAppendingPathComponent:@"EXUpdates.bundle"];
      NSBundle *bundle = [NSBundle bundleWithURL:bundleUrl];
      NSString *path = [bundle pathForResource:EXUpdatesEmbeddedManifestName ofType:EXUpdatesEmbeddedManifestType];
      NSData *manifestData = [NSData dataWithContentsOfFile:path];

      // Fallback to main bundle if the embedded manifest is not found in EXUpdates.bundle. This is a special case
      // to support the existing structure of Expo "shell apps"
      if (!manifestData) {
        path = [[NSBundle mainBundle] pathForResource:EXUpdatesEmbeddedManifestName ofType:EXUpdatesEmbeddedManifestType];
        manifestData = [NSData dataWithContentsOfFile:path];
      }

      // Not found in EXUpdates.bundle or main bundle
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
        embeddedManifest = [EXUpdatesUpdate updateWithEmbeddedManifest:[mutableManifest copy]
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

- (void)loadUpdateFromEmbeddedManifestWithCallback:(EXUpdatesAppLoaderManifestBlock)manifestBlock
                                           onAsset:(EXUpdatesAppLoaderAssetBlock)assetBlock
                                           success:(EXUpdatesAppLoaderSuccessBlock)success
                                             error:(EXUpdatesAppLoaderErrorBlock)error
{
  EXUpdatesUpdate *embeddedManifest = [[self class] embeddedManifestWithConfig:self.config
                                                                      database:self.database];
  if (embeddedManifest) {
    self.manifestBlock = manifestBlock;
    self.assetBlock = assetBlock;
    self.successBlock = success;
    self.errorBlock = error;
    [self startLoadingFromManifest:embeddedManifest];
  } else {
    error([NSError errorWithDomain:EXUpdatesEmbeddedAppLoaderErrorDomain
                              code:1008
                          userInfo:@{NSLocalizedDescriptionKey: @"Failed to load embedded manifest. Make sure you have configured expo-updates correctly."}]);
  }
}

- (void)downloadAsset:(EXUpdatesAsset *)asset
{
  NSURL *destinationUrl = [self.directory URLByAppendingPathComponent:asset.filename];

  dispatch_async([EXUpdatesFileDownloader assetFilesQueue], ^{
    if ([[NSFileManager defaultManager] fileExistsAtPath:[destinationUrl path]]) {
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [self handleAssetDownloadAlreadyExists:asset];
      });
    } else {
      NSAssert(asset.mainBundleFilename, @"embedded asset mainBundleFilename must be nonnull");
      NSString *bundlePath = [EXUpdatesUtils pathForBundledAsset:asset];
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
               onManifest:(EXUpdatesAppLoaderManifestBlock)manifestBlock
                    asset:(EXUpdatesAppLoaderAssetBlock)assetBlock
                  success:(EXUpdatesAppLoaderSuccessBlock)success
                    error:(EXUpdatesAppLoaderErrorBlock)error
{
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call EXUpdatesEmbeddedAppLoader#loadUpdateFromUrl" userInfo:nil];
}

@end

NS_ASSUME_NONNULL_END
