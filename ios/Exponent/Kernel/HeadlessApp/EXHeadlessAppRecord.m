// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXHeadlessAppRecord.h"
#import "EXReactAppManager.h"
#import "EXAppLoaderExpoUpdates.h"

@interface EXHeadlessAppRecord ()

@property (nonatomic, assign) BOOL isBridgeAlreadyLoading;
@property (nonatomic, strong) void(^callback)(BOOL success, NSError * _Nullable error);

@end


@implementation EXHeadlessAppRecord

@synthesize appManager = _appManager;
@synthesize appLoader = _appLoader;

- (nonnull instancetype)initWithManifestUrl:(NSURL *)manifestUrl
                                   callback:(void(^)(BOOL success, NSError * _Nullable error))callback
{
  if (self = [super init]) {
    _callback = callback;
    _isBridgeAlreadyLoading = NO;

    _appManager = [[EXReactAppManager alloc] initWithAppRecord:self initialProps:nil];
    [_appManager setIsHeadless:YES];
    [_appManager setDelegate:self];

    _appLoader = [[EXAppLoaderExpoUpdates alloc] initWithManifestUrl:manifestUrl];

    [_appLoader setDelegate:self];
    [_appLoader request];
  }
  return self;
}

- (void)rebuildBridge
{
  if (!_isBridgeAlreadyLoading) {
    _isBridgeAlreadyLoading = YES;
    [_appManager rebuildBridge];
  }
}

- (void)maybeExecuteCallbackWithSuccess:(BOOL)success error:(nullable NSError *)error
{
  if (_callback != nil) {
    _callback(success, error);
    _callback = nil;
  }
}

# pragma mark - EXAppRecordInterface

- (void)invalidate
{
  [_appManager invalidate];
  _appLoader = nil;
  _appManager = nil;
}

# pragma mark - EXReactAppManagerUIDelegate

- (void)reactAppManager:(EXReactAppManager *)appManager failedToLoadJavaScriptWithError:(NSError *)error
{
  [self maybeExecuteCallbackWithSuccess:NO error:error];
}

- (void)reactAppManagerIsReadyForLoad:(EXReactAppManager *)appManager
{
  [self maybeExecuteCallbackWithSuccess:YES error:nil];
}

- (void)reactAppManagerDidInvalidate:(EXReactAppManager *)appManager {}
- (void)reactAppManagerFinishedLoadingJavaScript:(EXReactAppManager *)appManager {}
- (void)reactAppManagerStartedLoadingJavaScript:(EXReactAppManager *)appManager {}
- (void)reactAppManagerAppContentDidAppear:(EXReactAppManager *)appManager {}
- (void)reactAppManagerAppContentWillReload:(EXReactAppManager *)appManager {}


# pragma mark - EXAppLoaderDelegate

- (void)appLoader:(EXAbstractLoader *)appLoader didLoadOptimisticManifest:(NSDictionary *)manifest
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self rebuildBridge];
  });
}

- (void)appLoader:(EXAbstractLoader *)appLoader didFinishLoadingManifest:(NSDictionary *)manifest bundle:(NSData *)data
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self rebuildBridge];
    if (self->_appManager.status == kEXReactAppManagerStatusBridgeLoading) {
      [self->_appManager appLoaderFinished];
    }
  });
}

- (void)appLoader:(EXAbstractLoader *)appLoader didFailWithError:(NSError *)error
{
  if (_appManager.status == kEXReactAppManagerStatusBridgeLoading) {
    [_appManager appLoaderFailedWithError:error];
  }
  [self maybeExecuteCallbackWithSuccess:NO error:error];
}

- (void)appLoader:(EXAbstractLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress {}
- (void)appLoader:(EXAbstractLoader *)appLoader didResolveUpdatedBundleWithManifest:(NSDictionary *)manifest isFromCache:(BOOL)isFromCache error:(NSError *)error {}

@end
