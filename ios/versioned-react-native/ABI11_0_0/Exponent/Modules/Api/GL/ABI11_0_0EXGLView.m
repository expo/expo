#import "ABI11_0_0EXGLView.h"

#import "ABI11_0_0RCTJSCExecutor.h"

#import <EXGL.h>


@interface ABI11_0_0EXGLView ()

@property (nonatomic, weak) ABI11_0_0EXGLViewManager *viewManager;
@property (nonatomic, strong) GLKViewController *controller;
@property (nonatomic, assign) BOOL onSurfaceCreateCalled;
@property (nonatomic, assign) EXGLContextId exglCtxId;

@end

@implementation ABI11_0_0EXGLView

ABI11_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init);

- (instancetype)initWithManager:(ABI11_0_0EXGLViewManager *)viewManager
{
  if ((self = [super init])) {
    self.context = [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES2];
    self.drawableColorFormat = GLKViewDrawableColorFormatRGBA8888;
    self.drawableDepthFormat = GLKViewDrawableDepthFormat24;
    self.drawableStencilFormat = GLKViewDrawableStencilFormat8;
    self.drawableMultisample = GLKViewDrawableMultisample4X;
    self.enableSetNeedsDisplay = YES;

    _controller = [[GLKViewController alloc] init];
    _controller.view = self;
    _controller.preferredFramesPerSecond = 60;

    _viewManager = viewManager;

    _onSurfaceCreateCalled = NO;
    _exglCtxId = 0;
  }
  return self;
}

- (void)removeFromSuperview
{
  _controller = nil;
  EXGLContextDestroy(_exglCtxId);
  [super removeFromSuperview];
}

- (void)drawRect:(CGRect)rect
{
  if (!_onSurfaceCreateCalled) {
    // Can only run on JavaScriptCore
    id<ABI11_0_0RCTJavaScriptExecutor> executor = [_viewManager.bridge valueForKey:@"javaScriptExecutor"];
    if ([executor isKindOfClass:NSClassFromString(@"ABI11_0_0RCTJSCExecutor")]) {
      // On JS thread, extract JavaScriptCore context, create ABI11_0_0EXGL context, call JS callback
      __weak __typeof__(self) weakSelf = self;
      __weak __typeof__(executor) weakExecutor = executor;
      [executor executeBlockOnJavaScriptQueue:^{
        __typeof__(self) self = weakSelf;
        ABI11_0_0RCTJSCExecutor *executor = weakExecutor;
        if (self && executor) {
          _exglCtxId = EXGLContextCreate(executor.jsContext.JSGlobalContextRef);
          _onSurfaceCreate(@{ @"exglCtxId": @(_exglCtxId) });
        }
      }];
    } else {
      ABI11_0_0RCTLog(@"ABI11_0_0EXGL: Can only run on JavaScriptCore!");
    }
    _onSurfaceCreateCalled = YES;
  }

  if (_exglCtxId > 0) { // zero indicates invalid ABI11_0_0EXGLContextId
   EXGLContextFlush(_exglCtxId);
  }
}

@end
