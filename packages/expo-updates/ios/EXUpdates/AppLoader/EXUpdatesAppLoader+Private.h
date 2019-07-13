//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLoader.h>
#import <EXUpdates/EXUpdatesAsset.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesAppLoader ()

@property (nonatomic, strong) NSDictionary *manifest;

- (void)startLoadingFromManifest;
- (void)handleAssetDownloadWithData:(NSData *)data response:(NSURLResponse * _Nullable)response asset:(EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithError:(NSError *)error asset:(EXUpdatesAsset *)asset;

- (void)downloadAsset:(EXUpdatesAsset *)asset;

@end

NS_ASSUME_NONNULL_END
