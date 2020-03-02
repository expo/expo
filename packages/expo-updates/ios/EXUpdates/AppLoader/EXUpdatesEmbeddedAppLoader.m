//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const kEXUpdatesEmbeddedManifestName = @"shell-app-manifest";
NSString * const kEXUpdatesEmbeddedManifestType = @"json";
NSString * const kEXUpdatesEmbeddedBundleFilename = @"shell-app";
NSString * const kEXUpdatesEmbeddedBundleFileType = @"bundle";

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
        NSLog(@"Could not read embedded manifest: %@", [err localizedDescription]);
      } else {
        NSAssert([manifest isKindOfClass:[NSDictionary class]], @"embedded manifest should be a valid JSON file");
        embeddedManifest = [EXUpdatesUpdate updateWithManifest:(NSDictionary *)manifest];
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
      NSString *bundlePath = [[NSBundle mainBundle] pathForResource:asset.mainBundleFilename ofType:asset.type];
      NSAssert(bundlePath, @"NSBundle must contain the expected assets");

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
