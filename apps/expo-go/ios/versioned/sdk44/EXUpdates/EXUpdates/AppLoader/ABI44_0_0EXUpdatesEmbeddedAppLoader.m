//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesFileDownloader.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI44_0_0EXUpdatesEmbeddedManifestName = @"app";
NSString * const ABI44_0_0EXUpdatesEmbeddedManifestType = @"manifest";
NSString * const ABI44_0_0EXUpdatesEmbeddedBundleFilename = @"app";
NSString * const ABI44_0_0EXUpdatesEmbeddedBundleFileType = @"bundle";
NSString * const ABI44_0_0EXUpdatesBareEmbeddedBundleFilename = @"main";
NSString * const ABI44_0_0EXUpdatesBareEmbeddedBundleFileType = @"jsbundle";

static NSString * const ABI44_0_0EXUpdatesEmbeddedAppLoaderErrorDomain = @"ABI44_0_0EXUpdatesEmbeddedAppLoader";

@implementation ABI44_0_0EXUpdatesEmbeddedAppLoader

+ (nullable ABI44_0_0EXUpdatesUpdate *)embeddedManifestWithConfig:(ABI44_0_0EXUpdatesConfig *)config
                                                database:(nullable ABI44_0_0EXUpdatesDatabase *)database
{
  static ABI44_0_0EXUpdatesUpdate *embeddedManifest;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!config.hasEmbeddedUpdate) {
      embeddedManifest = nil;
    } else if (!embeddedManifest) {
      NSBundle *frameworkBundle = [NSBundle bundleForClass:[self class]];
      NSURL *bundleUrl = [frameworkBundle.resourceURL URLByAppendingPathComponent:@"ABI44_0_0EXUpdates.bundle"];
      NSBundle *bundle = [NSBundle bundleWithURL:bundleUrl];
      NSString *path = [bundle pathForResource:ABI44_0_0EXUpdatesEmbeddedManifestName ofType:ABI44_0_0EXUpdatesEmbeddedManifestType];
      NSData *manifestData = [NSData dataWithContentsOfFile:path];

      // Fallback to main bundle if the embedded manifest is not found in ABI44_0_0EXUpdates.bundle. This is a special case
      // to support the existing structure of Expo "shell apps"
      if (!manifestData) {
        path = [[NSBundle mainBundle] pathForResource:ABI44_0_0EXUpdatesEmbeddedManifestName ofType:ABI44_0_0EXUpdatesEmbeddedManifestType];
        manifestData = [NSData dataWithContentsOfFile:path];
      }

      // Not found in ABI44_0_0EXUpdates.bundle or main bundle
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
        embeddedManifest = [ABI44_0_0EXUpdatesUpdate updateWithEmbeddedManifest:[mutableManifest copy]
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

- (void)loadUpdateFromEmbeddedManifestWithCallback:(ABI44_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                                           onAsset:(ABI44_0_0EXUpdatesAppLoaderAssetBlock)assetBlock
                                           success:(ABI44_0_0EXUpdatesAppLoaderSuccessBlock)success
                                             error:(ABI44_0_0EXUpdatesAppLoaderErrorBlock)error
{
  ABI44_0_0EXUpdatesUpdate *embeddedManifest = [[self class] embeddedManifestWithConfig:self.config
                                                                      database:self.database];
  if (embeddedManifest) {
    self.manifestBlock = manifestBlock;
    self.assetBlock = assetBlock;
    self.successBlock = success;
    self.errorBlock = error;
    [self startLoadingFromManifest:embeddedManifest];
  } else {
    error([NSError errorWithDomain:ABI44_0_0EXUpdatesEmbeddedAppLoaderErrorDomain
                              code:1008
                          userInfo:@{NSLocalizedDescriptionKey: @"Failed to load embedded manifest. Make sure you have configured expo-updates correctly."}]);
  }
}

- (void)downloadAsset:(ABI44_0_0EXUpdatesAsset *)asset
{
  NSURL *destinationUrl = [self.directory URLByAppendingPathComponent:asset.filename];

  dispatch_async([ABI44_0_0EXUpdatesFileDownloader assetFilesQueue], ^{
    if ([[NSFileManager defaultManager] fileExistsAtPath:[destinationUrl path]]) {
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [self handleAssetDownloadAlreadyExists:asset];
      });
    } else {
      NSAssert(asset.mainBundleFilename, @"embedded asset mainBundleFilename must be nonnull");
      NSString *bundlePath = [ABI44_0_0EXUpdatesUtils pathForBundledAsset:asset];
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
               onManifest:(ABI44_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                    asset:(ABI44_0_0EXUpdatesAppLoaderAssetBlock)assetBlock
                  success:(ABI44_0_0EXUpdatesAppLoaderSuccessBlock)success
                    error:(ABI44_0_0EXUpdatesAppLoaderErrorBlock)error
{
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call ABI44_0_0EXUpdatesEmbeddedAppLoader#loadUpdateFromUrl" userInfo:nil];
}

@end

NS_ASSUME_NONNULL_END
