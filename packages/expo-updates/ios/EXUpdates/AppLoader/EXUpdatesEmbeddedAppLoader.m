//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const kEXUpdatesEmbeddedManifestName = @"app";
NSString * const kEXUpdatesEmbeddedManifestType = @"manifest";
NSString * const kEXUpdatesEmbeddedBundleFilename = @"app";
NSString * const kEXUpdatesEmbeddedBundleFileType = @"bundle";
NSString * const kEXUpdatesBareEmbeddedBundleFilename = @"main";
NSString * const kEXUpdatesBareEmbeddedBundleFileType = @"jsbundle";

@implementation EXUpdatesEmbeddedAppLoader

+ (nullable EXUpdatesUpdate *)embeddedManifest
{
  static EXUpdatesUpdate *embeddedManifest;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!embeddedManifest) {
      NSString *path = [[NSBundle mainBundle] pathForResource:kEXUpdatesEmbeddedManifestName ofType:kEXUpdatesEmbeddedManifestType];
      NSData *manifestData = [NSData dataWithContentsOfFile:path];

      NSError *err;
      id manifest = [NSJSONSerialization JSONObjectWithData:manifestData options:kNilOptions error:&err];
      if (!manifest) {
        @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                       reason:@"The embedded manifest is invalid or could not be read. Make sure you have configured expo-updates correctly in your Xcode Build Phases."
                                     userInfo:@{}];
      } else {
        NSAssert([manifest isKindOfClass:[NSDictionary class]], @"embedded manifest should be a valid JSON file");
        embeddedManifest = [EXUpdatesUpdate updateWithEmbeddedManifest:(NSDictionary *)manifest];
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

- (void)loadUpdateFromEmbeddedManifestWithSuccess:(EXUpdatesAppLoaderSuccessBlock)success
                                            error:(EXUpdatesAppLoaderErrorBlock)error
{
  self.successBlock = success;
  self.errorBlock = error;
  [self startLoadingFromManifest:[[self class] embeddedManifest]];
}

- (void)downloadAsset:(EXUpdatesAsset *)asset
{
  NSURL *updatesDirectory = [EXUpdatesAppController sharedInstance].updatesDirectory;
  NSURL *destinationUrl = [updatesDirectory URLByAppendingPathComponent:asset.filename];

  dispatch_async(EXUpdatesAppController.sharedInstance.assetFilesQueue, ^{
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
                  success:(EXUpdatesAppLoaderSuccessBlock)success
                    error:(EXUpdatesAppLoaderErrorBlock)error
{
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call EXUpdatesEmbeddedAppLoader#loadUpdateFromUrl" userInfo:nil];
}

@end

NS_ASSUME_NONNULL_END
