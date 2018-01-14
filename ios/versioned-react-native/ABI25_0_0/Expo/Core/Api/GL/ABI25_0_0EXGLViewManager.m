#import "ABI25_0_0EXGLViewManager.h"

#import "ABI25_0_0EXGLView.h"

#import <ReactABI25_0_0/ABI25_0_0RCTUIManager.h>

@interface ABI25_0_0EXGLViewManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI25_0_0EXGLView *> *arSessions;
@property (nonatomic, assign) NSUInteger nextARSessionId;

@end

@implementation ABI25_0_0EXGLViewManager

ABI25_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

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
  return [[ABI25_0_0EXGLView alloc] initWithManager:self];
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI25_0_0RCTDirectEventBlock);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

ABI25_0_0RCT_REMAP_METHOD(startARSessionAsync,
                 startARSessionAsyncWithReactABI25_0_0Tag:(nonnull NSNumber *)tag
                 resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject)
{
  NSUInteger sessionId = _nextARSessionId++;
  [self.bridge.uiManager addUIBlock:^(__unused ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[tag];
    if (![view isKindOfClass:[ABI25_0_0EXGLView class]]) {
      reject(@"E_GLVIEW_MANAGER_BAD_VIEW_TAG", nil, ABI25_0_0RCTErrorWithMessage(@"ExponentGLViewManager.startARSessionAsync: Expected an ABI25_0_0EXGLView"));
      return;
    }
    ABI25_0_0EXGLView *exglView = (ABI25_0_0EXGLView *)view;
    _arSessions[@(sessionId)] = exglView;

    NSMutableDictionary *response = [[exglView maybeStartARSession] mutableCopy];
    if (response[@"error"]) {
      reject(@"ERR_ARKIT_FAILED_TO_INIT", response[@"error"], ABI25_0_0RCTErrorWithMessage(response[@"error"]));
    } else {
      response[@"sessionId"] = @(sessionId);
      resolve(response);
    }
  }];
}

ABI25_0_0RCT_REMAP_METHOD(stopARSessionAsync,
                 stopARSessionAsyncWithId:(nonnull NSNumber *)sessionId
                 resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI25_0_0EXGLView *exglView = _arSessions[sessionId];
    if (exglView) {
      [exglView maybeStopARSession];
      [_arSessions removeObjectForKey:sessionId];
    }
    resolve(nil);
  }];
}

ABI25_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARMatrices,
                                      nullable NSDictionary *,
                                      getARMatricesWithSessionId:(nonnull NSNumber *)sessionId
                                      viewportWidth:(nonnull NSNumber *)vpWidth
                                      viewportHeight:(nonnull NSNumber *)vpHeight
                                      zNear:(nonnull NSNumber *)zNear
                                      zFar:(nonnull NSNumber *)zFar)
{
  ABI25_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView arMatricesForViewportSize:CGSizeMake([vpWidth floatValue], [vpHeight floatValue])
                                       zNear:[zNear floatValue]
                                        zFar:[zFar floatValue]];
}


ABI25_0_0RCT_REMAP_METHOD(setIsPlaneDetectionEnabled,
                 setIsPlaneDetectionEnabledWithSessionId:(nonnull NSNumber *)sessionId
                 planeDetectionEnabled:(BOOL)planeDetectionEnabled)
{
  ABI25_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setIsPlaneDetectionEnabled:planeDetectionEnabled];
}

ABI25_0_0RCT_REMAP_METHOD(setIsLightEstimationEnabled,
                 setIsLightEstimationEnabledWithSessionId:(nonnull NSNumber *)sessionId
                 lightEstimationEnabled:(BOOL)lightEstimationEnabled)
{
  ABI25_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setIsLightEstimationEnabled:lightEstimationEnabled];
}

ABI25_0_0RCT_REMAP_METHOD(setWorldAlignment,
                 setWorldAlignmentWithSessionId:(nonnull NSNumber *)sessionId
                 worldAlignment:(NSInteger)worldAlignment)
{
  ABI25_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setWorldAlignment:worldAlignment];
}

ABI25_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARLightEstimation,
                                      nullable NSDictionary *,
                                      getARLightEstimationWithSessionId:(nonnull NSNumber *)sessionId)
{
  ABI25_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }

  return [exglView arLightEstimation];
}

ABI25_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getRawFeaturePoints,
                                      nullable NSDictionary *,
                                      getRawFeaturePointsWithSessionId:(nonnull NSNumber *)sessionId)
{
  ABI25_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView rawFeaturePoints];
}

ABI25_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getPlanes,
                                      nullable NSDictionary *,
                                      getPlanesWithSessionId:(nonnull NSNumber *)sessionId)
{
  ABI25_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView planes];
}

@end
