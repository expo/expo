//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesAppLoaderRemote.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesAppLoaderRemote ()

@property (nonatomic, strong) EXUpdatesFileDownloader *downloader;

@end

@implementation EXUpdatesAppLoaderRemote

- (instancetype)init
{
  if (self = [super init]) {
    _downloader = [[EXUpdatesFileDownloader alloc] init];
  }
  return self;
}

/**
 * we expect the server to respond with a JSON object with the following fields:
 * id (UUID string)
 * commitTime (timestamp number)
 * binaryVersions (comma separated list - string)
 * bundleUrl (string)
 * metadata (arbitrary object)
 * assets (array of asset objects with `url` and `type` keys)
 */

- (void)loadUpdateFromUrl:(NSURL *)url
{
  [_downloader downloadDataFromURL:url successBlock:^(NSData * data, NSURLResponse * response) {
    NSError *err;
    id manifest = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&err];
    NSAssert(!err && manifest && [manifest isKindOfClass:[NSDictionary class]], @"manifest should be a valid JSON object");

    self.manifest = (NSDictionary *)manifest;
    [self startLoadingFromManifest];
  } errorBlock:^(NSError * error, NSURLResponse * response) {
    // TODO: handle error
  }];
}

- (void)downloadAsset:(EXUpdatesAsset *)asset
{
  NSURL *updatesDirectory = [EXUpdatesAppController sharedInstance].updatesDirectory;
  NSURL *urlOnDisk = [updatesDirectory URLByAppendingPathComponent:asset.filename];
  [_downloader downloadFileFromURL:asset.url toPath:[urlOnDisk path] successBlock:^(NSData * data, NSURLResponse * response) {
    [self handleAssetDownloadWithData:data response:response asset:asset];
  } errorBlock:^(NSError * error, NSURLResponse * response) {
    [self handleAssetDownloadWithError:error asset:asset];
  }];
}

@end

NS_ASSUME_NONNULL_END
