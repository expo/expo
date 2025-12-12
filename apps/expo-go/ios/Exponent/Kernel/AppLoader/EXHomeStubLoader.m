// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXHomeStubLoader.h"
#import "EXVersions.h"
#import "EXBuildConstants.h"

#import <React/RCTUtils.h>

@import EXManifests;

NS_ASSUME_NONNULL_BEGIN

@interface EXHomeStubLoader ()

@property (nonatomic, strong) EXManifestsManifest *manifest;
@property (nonatomic, assign) BOOL isUpToDate;
@property (nonatomic, assign) EXAppLoaderStatus loaderStatus;

@end

@implementation EXHomeStubLoader

- (instancetype)init
{
  if (self = [super init]) {
    NSDictionary *manifestJSON = @{
      @"id": @"@exponent/home",
      @"sdkVersion": [EXVersions sharedInstance].sdkVersion,
      @"runtimeVersion": @{
        @"policy": @"sdkVersion",
        @"value": [EXVersions sharedInstance].sdkVersion
      },
      @"slug": @"home",
      @"name": @"Expo Go",
      @"version": @"1.0.0"
    };

    _manifest = [EXManifestsManifestFactory manifestForManifestJSON:manifestJSON];
    _isUpToDate = YES;
    _loaderStatus = kEXAppLoaderStatusNew;
  }
  return self;
}

@synthesize manifest = _manifest;
@synthesize isUpToDate = _isUpToDate;

#pragma mark - EXAbstractLoader

- (EXAppLoaderStatus)status
{
  return _loaderStatus;
}

- (nullable NSData *)bundle
{
  return nil;
}

- (BOOL)supportsBundleReload
{
  return NO;
}

- (void)request
{
  if (self.delegate) {
    dispatch_async(dispatch_get_main_queue(), ^{
      self->_loaderStatus = kEXAppLoaderStatusHasManifest;
      [self.delegate appLoader:self didLoadOptimisticManifest:self->_manifest];
      [self.delegate appLoader:self didFinishLoadingManifest:self->_manifest bundle:nil];
    });
  }
}

- (void)requestFromCache
{
  [self request];
}

- (void)forceBundleReload
{
}

- (void)writeManifestToCache
{
}

@end

NS_ASSUME_NONNULL_END
