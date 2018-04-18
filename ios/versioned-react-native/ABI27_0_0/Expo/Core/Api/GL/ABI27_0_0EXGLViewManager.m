#import "ABI27_0_0EXGLViewManager.h"

#import "ABI27_0_0EXGLView.h"

#import <ReactABI27_0_0/ABI27_0_0RCTUIManager.h>

@interface ABI27_0_0EXGLViewManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI27_0_0EXGLView *> *arSessions;
@property (nonatomic, assign) NSUInteger nextARSessionId;

@end

@implementation ABI27_0_0EXGLViewManager

ABI27_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _arSessions = [NSMutableDictionary dictionary];
    _nextARSessionId = 0;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (UIView *)view
{
  return [[ABI27_0_0EXGLView alloc] initWithManager:self];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI27_0_0RCTDirectEventBlock);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

ABI27_0_0RCT_REMAP_METHOD(startARSessionAsync,
                 startARSessionAsyncWithReactABI27_0_0Tag:(nonnull NSNumber *)tag
                 resolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
  NSUInteger sessionId = _nextARSessionId++;
  [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[tag];
    if (![view isKindOfClass:[ABI27_0_0EXGLView class]]) {
      reject(@"E_GLVIEW_MANAGER_BAD_VIEW_TAG", nil, ABI27_0_0RCTErrorWithMessage(@"ExponentGLViewManager.startARSessionAsync: Expected an ABI27_0_0EXGLView"));
      return;
    }
    ABI27_0_0EXGLView *exglView = (ABI27_0_0EXGLView *)view;
    _arSessions[@(sessionId)] = exglView;

    NSMutableDictionary *response = [[exglView maybeStartARSession] mutableCopy];
    if (response[@"error"]) {
      reject(@"ERR_ARKIT_FAILED_TO_INIT", response[@"error"], ABI27_0_0RCTErrorWithMessage(response[@"error"]));
    } else {
      response[@"sessionId"] = @(sessionId);
      resolve(response);
    }
  }];
}

ABI27_0_0RCT_REMAP_METHOD(stopARSessionAsync,
                 stopARSessionAsyncWithId:(nonnull NSNumber *)sessionId
                 resolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI27_0_0EXGLView *exglView = _arSessions[sessionId];
    if (exglView) {
      [exglView maybeStopARSession];
      [_arSessions removeObjectForKey:sessionId];
    }
    resolve(nil);
  }];
}

ABI27_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARMatrices,
                                      nullable NSDictionary *,
                                      getARMatricesWithSessionId:(nonnull NSNumber *)sessionId
                                      viewportWidth:(nonnull NSNumber *)vpWidth
                                      viewportHeight:(nonnull NSNumber *)vpHeight
                                      zNear:(nonnull NSNumber *)zNear
                                      zFar:(nonnull NSNumber *)zFar)
{
  ABI27_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView arMatricesForViewportSize:CGSizeMake([vpWidth floatValue], [vpHeight floatValue])
                                       zNear:[zNear floatValue]
                                        zFar:[zFar floatValue]];
}


ABI27_0_0RCT_REMAP_METHOD(setIsPlaneDetectionEnabled,
                 setIsPlaneDetectionEnabledWithSessionId:(nonnull NSNumber *)sessionId
                 planeDetectionEnabled:(BOOL)planeDetectionEnabled)
{
  ABI27_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setIsPlaneDetectionEnabled:planeDetectionEnabled];
}

ABI27_0_0RCT_REMAP_METHOD(setIsLightEstimationEnabled,
                 setIsLightEstimationEnabledWithSessionId:(nonnull NSNumber *)sessionId
                 lightEstimationEnabled:(BOOL)lightEstimationEnabled)
{
  ABI27_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setIsLightEstimationEnabled:lightEstimationEnabled];
}

ABI27_0_0RCT_REMAP_METHOD(setWorldAlignment,
                 setWorldAlignmentWithSessionId:(nonnull NSNumber *)sessionId
                 worldAlignment:(NSInteger)worldAlignment)
{
  ABI27_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setWorldAlignment:worldAlignment];
}

ABI27_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARLightEstimation,
                                      nullable NSDictionary *,
                                      getARLightEstimationWithSessionId:(nonnull NSNumber *)sessionId)
{
  ABI27_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }

  return [exglView arLightEstimation];
}

ABI27_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getRawFeaturePoints,
                                      nullable NSDictionary *,
                                      getRawFeaturePointsWithSessionId:(nonnull NSNumber *)sessionId)
{
  ABI27_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView rawFeaturePoints];
}

ABI27_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getPlanes,
                                      nullable NSDictionary *,
                                      getPlanesWithSessionId:(nonnull NSNumber *)sessionId)
{
  ABI27_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView planes];
}

@end
