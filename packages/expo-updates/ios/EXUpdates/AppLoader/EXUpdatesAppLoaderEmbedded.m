//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesAppLoaderEmbedded.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const kEXUpdatesEmbeddedManifestName = @"manifest";
static NSString * const kEXUpdatesEmbeddedManifestType = @"json";

@implementation EXUpdatesAppLoaderEmbedded

// embedded manifest expected to be manifest.json in NSBundle
// `assets` should be an array of objects with an `nsBundleFilename`
// property such that [[NSBundle mainBundle] pathForResource:asset.nsBundleFilename ofType:asset.type]
// returns the correct path

- (void)loadUpdateFromEmbeddedManifest
{
  NSString *path = [[NSBundle mainBundle] pathForResource:kEXUpdatesEmbeddedManifestName ofType:kEXUpdatesEmbeddedManifestType];
  NSData *manifestData = [NSData dataWithContentsOfFile:path];

  NSError *err;
  id manifest = [NSJSONSerialization JSONObjectWithData:manifestData options:kNilOptions error:&err];
  if (!manifest) {
    NSLog(@"Could not read embedded manifest: %@", [err localizedDescription]);
  } else {
    NSAssert([manifest isKindOfClass:[NSDictionary class]], @"embedded manifest should be a valid JSON file");
    self.manifest = (NSDictionary *)manifest;
    [self startLoadingFromManifest];
  }
}

- (void)downloadAsset:(EXUpdatesAsset *)asset
{
  NSURL *updatesDirectory = [EXUpdatesAppController sharedInstance].updatesDirectory;
  NSURL *destinationUrl = [updatesDirectory URLByAppendingPathComponent:asset.filename];

  NSAssert(asset.nsBundleFilename, @"asset nsBundleFilename must be nonnull");
  NSString *bundlePath = [[NSBundle mainBundle] pathForResource:asset.nsBundleFilename ofType:asset.type];

  NSError *err;
  if ([[NSFileManager defaultManager] copyItemAtPath:bundlePath toPath:[destinationUrl path] error:&err]) {
    [self handleAssetDownloadWithData:[NSData dataWithContentsOfFile:bundlePath] response:nil asset:asset];
  } else {
    [self handleAssetDownloadWithError:err asset:asset];
  }
}

- (void)loadUpdateFromUrl:(NSURL *)url
{
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call EXUpdatesAppLoaderEmbedded#loadUpdateFromUrl" userInfo:nil];
}

@end

NS_ASSUME_NONNULL_END
