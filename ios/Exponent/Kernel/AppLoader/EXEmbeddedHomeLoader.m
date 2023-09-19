// Copyright 2020-present 650 Industries. All rights reserved.

#import "EXEmbeddedHomeLoader.h"
#import "EXKernel.h"

#import <React/RCTUtils.h>

@import EXManifests;

NS_ASSUME_NONNULL_BEGIN

NSString * const EXEmbeddedHomeLoaderErrorDomain = @"embedded-home-loader";

NSString *kEXHomeBundleResourceName = @"kernel.ios";
NSString *kEXHomeManifestResourceName = @"kernel-manifest";

typedef NS_ENUM(NSInteger, EXEmbeddedHomeLoaderErrorCode) {
  EXEmbeddedHomeLoaderErrorCodeUnableToLoadEmbeddedManifest,
  EXEmbeddedHomeLoaderErrorCodeUnableToLoadEmbeddedBundle,
};

@interface EXEmbeddedHomeLoader ()

@property (nonatomic, strong, nullable) EXManifestsManifest *manifest;
@property (nonatomic, strong, nullable) NSData *bundle;
@property (nonatomic, assign) BOOL isUpToDate;

@end

@implementation EXEmbeddedHomeLoader

- (nonnull instancetype)init {
  return self = [super init];
}

@synthesize manifest = _manifest;
@synthesize bundle = _bundle;
@synthesize isUpToDate = _isUpToDate;

#pragma mark - getters and lifecycle

- (void)_reset
{
  _manifest = nil;
  _bundle = nil;
}

- (EXAppLoaderStatus)status
{
  if (_bundle) {
    return kEXAppLoaderStatusHasManifestAndBundle;
  } else if (_manifest) {
    return kEXAppLoaderStatusHasManifest;
  }
  return kEXAppLoaderStatusNew;
}

- (nullable EXManifestsManifest *)manifest
{
  return _manifest;
}

- (nullable NSData *)bundle
{
  return _bundle;
}

- (BOOL)supportsBundleReload
{
  return NO;
}

#pragma mark - public

- (void)request
{
  [self _reset];
  [self _beginRequest];
}

- (void)requestFromCache
{
  [self request];
}

#pragma mark - internal

- (void)_beginRequest
{
  NSString *manifestPath = [[NSBundle mainBundle] pathForResource:kEXHomeManifestResourceName ofType:@"json"];
  if (!manifestPath) {
    NSError *error = [NSError errorWithDomain:EXEmbeddedHomeLoaderErrorDomain code:EXEmbeddedHomeLoaderErrorCodeUnableToLoadEmbeddedManifest userInfo:@{
      NSLocalizedDescriptionKey: @"Could not load embedded manifest"
    }];
    [self.delegate appLoader:self didFailWithError:error];
    return;
  }

  NSError *stringReadError;
  NSString *manifestJson = [NSString stringWithContentsOfFile:manifestPath encoding:NSUTF8StringEncoding error:&stringReadError];
  if (stringReadError) {
    [self.delegate appLoader:self didFailWithError:stringReadError];
    return;
  }

  id manifest = RCTJSONParse(manifestJson, nil);
  if (![manifest isKindOfClass:[NSDictionary class]]) {
    NSError *error = [NSError errorWithDomain:EXEmbeddedHomeLoaderErrorDomain code:EXEmbeddedHomeLoaderErrorCodeUnableToLoadEmbeddedManifest userInfo:@{
      NSLocalizedDescriptionKey: @"Embedded manifest not valid JSON"
    }];
    [self.delegate appLoader:self didFailWithError:error];
    return;
  }

  if (!([manifest[@"id"] isEqualToString:@"@exponent/home"])) {
    DDLogError(@"Bundled kernel manifest was published with an id other than @exponent/home");
  }

  _manifest = [EXManifestsManifestFactory manifestForManifestJSON:manifest];
  if (self.delegate) {
    [self.delegate appLoader:self didLoadOptimisticManifest:_manifest];
  }

  _isUpToDate = true;

  NSString *bundlePath = [[NSBundle mainBundle] pathForResource:kEXHomeBundleResourceName ofType:@"bundle"];
  if (!bundlePath) {
    NSError *error = [NSError errorWithDomain:EXEmbeddedHomeLoaderErrorDomain code:EXEmbeddedHomeLoaderErrorCodeUnableToLoadEmbeddedManifest userInfo:@{
      NSLocalizedDescriptionKey: @"Could not load embedded bundle"
    }];
    [self.delegate appLoader:self didFailWithError:error];
    return;
  }

  NSError *dataReadError;
  NSData *bundleData = [NSData dataWithContentsOfFile:bundlePath options:0 error:&dataReadError];
  if (dataReadError) {
    [self.delegate appLoader:self didFailWithError:dataReadError];
    return;
  }

  _bundle = bundleData;

  if (self.delegate) {
    [self.delegate appLoader:self didFinishLoadingManifest:_manifest bundle:_bundle];
  }
}

@end

NS_ASSUME_NONNULL_END
