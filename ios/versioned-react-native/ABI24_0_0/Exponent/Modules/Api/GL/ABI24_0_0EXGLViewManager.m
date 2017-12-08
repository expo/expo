#import "ABI24_0_0EXGLViewManager.h"

#import "ABI24_0_0EXGLView.h"

#import <ReactABI24_0_0/ABI24_0_0RCTUIManager.h>

@interface ABI24_0_0EXGLViewManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI24_0_0EXGLView *> *arSessions;
@property (nonatomic, assign) NSUInteger nextARSessionId;

@end

@implementation ABI24_0_0EXGLViewManager

ABI24_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _arSessions = [NSMutableDictionary dictionary];
    _nextARSessionId = 0;
  }
  return self;
}

- (UIView *)view
{
  return [[ABI24_0_0EXGLView alloc] initWithManager:self];
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI24_0_0RCTDirectEventBlock);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

ABI24_0_0RCT_REMAP_METHOD(startARSessionAsync,
                 startARSessionAsyncWithReactABI24_0_0Tag:(nonnull NSNumber *)tag
                 resolver:(ABI24_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject)
{
  NSUInteger sessionId = _nextARSessionId++;
  [self.bridge.uiManager addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[tag];
    if (![view isKindOfClass:[ABI24_0_0EXGLView class]]) {
      reject(@"E_GLVIEW_MANAGER_BAD_VIEW_TAG", nil, ABI24_0_0RCTErrorWithMessage(@"ExponentGLViewManager.startARSessionAsync: Expected an ABI24_0_0EXGLView"));
      return;
    }
    ABI24_0_0EXGLView *exglView = (ABI24_0_0EXGLView *)view;
    _arSessions[@(sessionId)] = exglView;

    NSMutableDictionary *response = [[exglView maybeStartARSession] mutableCopy];
    if (response[@"error"]) {
      reject(@"ERR_ARKIT_FAILED_TO_INIT", response[@"error"], ABI24_0_0RCTErrorWithMessage(response[@"error"]));
    } else {
      response[@"sessionId"] = @(sessionId);
      resolve(response);
    }
  }];
}

ABI24_0_0RCT_REMAP_METHOD(stopARSessionAsync,
                 stopARSessionAsyncWithId:(nonnull NSNumber *)sessionId
                 resolver:(ABI24_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI24_0_0EXGLView *exglView = _arSessions[sessionId];
    if (exglView) {
      [exglView maybeStopARSession];
      [_arSessions removeObjectForKey:sessionId];
    }
    resolve(nil);
  }];
}

ABI24_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARMatrices,
                                      nullable NSDictionary *,
                                      getARMatricesWithSessionId:(nonnull NSNumber *)sessionId
                                      viewportWidth:(nonnull NSNumber *)vpWidth
                                      viewportHeight:(nonnull NSNumber *)vpHeight
                                      zNear:(nonnull NSNumber *)zNear
                                      zFar:(nonnull NSNumber *)zFar)
{
  ABI24_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView arMatricesForViewportSize:CGSizeMake([vpWidth floatValue], [vpHeight floatValue])
                                       zNear:[zNear floatValue]
                                        zFar:[zFar floatValue]];
}


ABI24_0_0RCT_REMAP_METHOD(setIsPlaneDetectionEnabled,
                 setIsPlaneDetectionEnabledWithSessionId:(nonnull NSNumber *)sessionId
                 planeDetectionEnabled:(BOOL)planeDetectionEnabled)
{
  ABI24_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setIsPlaneDetectionEnabled:planeDetectionEnabled];
}

ABI24_0_0RCT_REMAP_METHOD(setIsLightEstimationEnabled,
                 setIsLightEstimationEnabledWithSessionId:(nonnull NSNumber *)sessionId
                 lightEstimationEnabled:(BOOL)lightEstimationEnabled)
{
  ABI24_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setIsLightEstimationEnabled:lightEstimationEnabled];
}

ABI24_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARLightEstimation,
                                      nullable NSDictionary *,
                                      getARLightEstimationWithSessionId:(nonnull NSNumber *)sessionId)
{
  ABI24_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }

  return [exglView arLightEstimation];
}

ABI24_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getRawFeaturePoints,
                                      nullable NSDictionary *,
                                      getRawFeaturePointsWithSessionId:(nonnull NSNumber *)sessionId)
{
  ABI24_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView rawFeaturePoints];
}

@end
