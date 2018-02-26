#import "EXGLViewManager.h"

#import "EXGLView.h"

#import <React/RCTUIManager.h>

@interface EXGLViewManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXGLView *> *arSessions;
@property (nonatomic, assign) NSUInteger nextARSessionId;

@end

@implementation EXGLViewManager

RCT_EXPORT_MODULE(ExponentGLViewManager);

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
  return [[EXGLView alloc] initWithManager:self];
}

RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

RCT_REMAP_METHOD(startARSessionAsync,
                 startARSessionAsyncWithReactTag:(nonnull NSNumber *)tag
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSUInteger sessionId = _nextARSessionId++;
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[tag];
    if (![view isKindOfClass:[EXGLView class]]) {
      reject(@"E_GLVIEW_MANAGER_BAD_VIEW_TAG", nil, RCTErrorWithMessage(@"ExponentGLViewManager.startARSessionAsync: Expected an EXGLView"));
      return;
    }
    EXGLView *exglView = (EXGLView *)view;
    _arSessions[@(sessionId)] = exglView;

    NSMutableDictionary *response = [[exglView maybeStartARSession] mutableCopy];
    if (response[@"error"]) {
      reject(@"ERR_ARKIT_FAILED_TO_INIT", response[@"error"], RCTErrorWithMessage(response[@"error"]));
    } else {
      response[@"sessionId"] = @(sessionId);
      resolve(response);
    }
  }];
}

RCT_REMAP_METHOD(stopARSessionAsync,
                 stopARSessionAsyncWithId:(nonnull NSNumber *)sessionId
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    EXGLView *exglView = _arSessions[sessionId];
    if (exglView) {
      [exglView maybeStopARSession];
      [_arSessions removeObjectForKey:sessionId];
    }
    resolve(nil);
  }];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARMatrices,
                                      nullable NSDictionary *,
                                      getARMatricesWithSessionId:(nonnull NSNumber *)sessionId
                                      viewportWidth:(nonnull NSNumber *)vpWidth
                                      viewportHeight:(nonnull NSNumber *)vpHeight
                                      zNear:(nonnull NSNumber *)zNear
                                      zFar:(nonnull NSNumber *)zFar)
{
  EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView arMatricesForViewportSize:CGSizeMake([vpWidth floatValue], [vpHeight floatValue])
                                       zNear:[zNear floatValue]
                                        zFar:[zFar floatValue]];
}


RCT_REMAP_METHOD(setIsPlaneDetectionEnabled,
                 setIsPlaneDetectionEnabledWithSessionId:(nonnull NSNumber *)sessionId
                 planeDetectionEnabled:(BOOL)planeDetectionEnabled)
{
  EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setIsPlaneDetectionEnabled:planeDetectionEnabled];
}

RCT_REMAP_METHOD(setIsLightEstimationEnabled,
                 setIsLightEstimationEnabledWithSessionId:(nonnull NSNumber *)sessionId
                 lightEstimationEnabled:(BOOL)lightEstimationEnabled)
{
  EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setIsLightEstimationEnabled:lightEstimationEnabled];
}

RCT_REMAP_METHOD(setWorldAlignment,
                 setWorldAlignmentWithSessionId:(nonnull NSNumber *)sessionId
                 worldAlignment:(NSInteger)worldAlignment)
{
  EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return;
  }
  [exglView setWorldAlignment:worldAlignment];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARLightEstimation,
                                      nullable NSDictionary *,
                                      getARLightEstimationWithSessionId:(nonnull NSNumber *)sessionId)
{
  EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }

  return [exglView arLightEstimation];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getRawFeaturePoints,
                                      nullable NSDictionary *,
                                      getRawFeaturePointsWithSessionId:(nonnull NSNumber *)sessionId)
{
  EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView rawFeaturePoints];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getPlanes,
                                      nullable NSDictionary *,
                                      getPlanesWithSessionId:(nonnull NSNumber *)sessionId)
{
  EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView planes];
}

@end
