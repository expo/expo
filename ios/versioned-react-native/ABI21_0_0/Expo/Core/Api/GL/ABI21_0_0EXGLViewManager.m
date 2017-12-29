#import "ABI21_0_0EXGLViewManager.h"

#import "ABI21_0_0EXGLView.h"

#import <ReactABI21_0_0/ABI21_0_0RCTUIManager.h>

@interface ABI21_0_0EXGLViewManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI21_0_0EXGLView *> *arSessions;
@property (nonatomic, assign) NSUInteger nextARSessionId;

@end

@implementation ABI21_0_0EXGLViewManager

ABI21_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

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
  return [[ABI21_0_0EXGLView alloc] initWithManager:self];
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

ABI21_0_0RCT_REMAP_METHOD(startARSession,
                 startARSessionWithReactABI21_0_0Tag:(nonnull NSNumber *)tag
                 resolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject)
{
  unsigned int sessionId = _nextARSessionId++;
  [self.bridge.uiManager addUIBlock:^(__unused ABI21_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[tag];
    if (![view isKindOfClass:[ABI21_0_0EXGLView class]]) {
      reject(@"E_GLVIEW_MANAGER_BAD_VIEW_TAG", nil, ABI21_0_0RCTErrorWithMessage(@"Expected an ABI21_0_0EXGLView"));
      return;
    }
    ABI21_0_0EXGLView *exglView = (ABI21_0_0EXGLView *)view;
    _arSessions[@(sessionId)] = exglView;

    NSMutableDictionary *response = [[exglView maybeStartARSession] mutableCopy];
    if (response[@"error"]) {
      reject(@"ERR_ARKIT_FAILED_TO_INIT", response[@"error"], ABI21_0_0RCTErrorWithMessage(response[@"error"]));
    } else {
      response[@"sessionId"] = @(sessionId);
      resolve(response);
    }
  }];
}

ABI21_0_0RCT_REMAP_METHOD(stopARSession,
                 stopARSessionWithId:(nonnull NSNumber *)sessionId
                 resolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI21_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI21_0_0EXGLView *exglView = _arSessions[sessionId];
    if (exglView) {
      [exglView maybeStopARSession];
    }
    resolve(nil);
  }];
}

ABI21_0_0RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARMatrices,
                                      getARMatricesWithSessionId:(nonnull NSNumber *)sessionId
                                      viewportWidth:(nonnull NSNumber *)vpWidth
                                      viewportHeight:(nonnull NSNumber *)vpHeight
                                      zNear:(nonnull NSNumber *)zNear
                                      zFar:(nonnull NSNumber *)zFar)
{
  ABI21_0_0EXGLView *exglView = _arSessions[sessionId];
  if (!exglView) {
    return nil;
  }
  return [exglView arMatricesForViewportSize:CGSizeMake([vpWidth floatValue], [vpHeight floatValue])
                                       zNear:[zNear floatValue]
                                        zFar:[zFar floatValue]];
}

@end
