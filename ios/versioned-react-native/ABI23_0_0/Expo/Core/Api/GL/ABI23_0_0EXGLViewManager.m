#import "ABI23_0_0EXGLViewManager.h"

#import "ABI23_0_0EXGLView.h"

#import <ReactABI23_0_0/ABI23_0_0RCTUIManager.h>

@interface ABI23_0_0EXGLViewManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI23_0_0EXGLView *> *arSessions;
@property (nonatomic, assign) NSUInteger nextARSessionId;

@end

@implementation ABI23_0_0EXGLViewManager

ABI23_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

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
  return [[ABI23_0_0EXGLView alloc] initWithManager:self];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI23_0_0RCTDirectEventBlock);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

ABI23_0_0RCT_REMAP_METHOD(startARSessionAsync,
                 startARSessionAsyncWithReactABI23_0_0Tag:(nonnull NSNumber *)tag
                 resolver:(ABI23_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI23_0_0RCTPromiseRejectBlock)reject)
{
  NSUInteger sessionId = _nextARSessionId++;
  [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[tag];
    if (![view isKindOfClass:[ABI23_0_0EXGLView class]]) {
      reject(@"E_GLVIEW_MANAGER_BAD_VIEW_TAG", nil, ABI23_0_0RCTErrorWithMessage(@"ExponentGLViewManager.startARSessionAsync: Expected an ABI23_0_0EXGLView"));
      return;
    }
    ABI23_0_0EXGLView *exglView = (ABI23_0_0EXGLView *)view;
    _arSessions[@(sessionId)] = exglView;

    NSMutableDictionary *response = [[exglView maybeStartARSession] mutableCopy];
    if (response[@"error"]) {
      reject(@"ERR_ARKIT_FAILED_TO_INIT", response[@"error"], ABI23_0_0RCTErrorWithMessage(response[@"error"]));
    } else {
      response[@"sessionId"] = @(sessionId);
      resolve(response);
    }
  }];
}

ABI23_0_0RCT_REMAP_METHOD(stopARSessionAsync,
                 stopARSessionAsyncWithId:(nonnull NSNumber *)sessionId
                 resolver:(ABI23_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI23_0_0RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI23_0_0EXGLView *exglView = _arSessions[sessionId];
    if (exglView) {
      [exglView maybeStopARSession];
      [_arSessions removeObjectForKey:sessionId];
    }
    resolve(nil);
  }];
}

ABI23_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARMatrices,
                                      getARMatricesWithSessionId:(nonnull NSNumber *)sessionId
                                      viewportWidth:(nonnull NSNumber *)vpWidth
                                      viewportHeight:(nonnull NSNumber *)vpHeight
                                      zNear:(nonnull NSNumber *)zNear
                                      zFar:(nonnull NSNumber *)zFar)
{
  ABI23_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView arMatricesForViewportSize:CGSizeMake([vpWidth floatValue], [vpHeight floatValue])
                                       zNear:[zNear floatValue]
                                        zFar:[zFar floatValue]];
}

@end
