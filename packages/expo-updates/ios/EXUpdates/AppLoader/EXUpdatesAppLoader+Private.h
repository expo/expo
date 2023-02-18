//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLoader.h>
#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesAppLoader ()

@property (nonatomic, strong) EXUpdatesDatabase *database;
@property (nonatomic, strong) NSURL *directory;
@property (nonatomic, strong, nullable) EXUpdatesUpdate *launchedUpdate;
@property (nonatomic, strong) EXUpdatesUpdateResponse *updateResponseContainingManifest;
@property (nonatomic, copy) EXUpdatesAppLoaderUpdateResponseBlock updateResponseBlock;
@property (nonatomic, copy) EXUpdatesAppLoaderAssetBlock assetBlock;
@property (nonatomic, copy) EXUpdatesAppLoaderSuccessBlock successBlock;
@property (nonatomic, copy) EXUpdatesAppLoaderErrorBlock errorBlock;

- (void)startLoadingFromUpdateResponse:(EXUpdatesUpdateResponse *)updateResponse;
- (void)handleAssetDownloadAlreadyExists:(EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithData:(NSData *)data response:(nullable NSURLResponse *)response asset:(EXUpdatesAsset *)asset;
- (void)handleAssetDownloadWithError:(NSError *)error asset:(EXUpdatesAsset *)asset;

- (void)downloadAsset:(EXUpdatesAsset *)asset;

@end

NS_ASSUME_NONNULL_END
