#import "EXGLView.h"

#include <OpenGLES/ES2/gl.h>
#include <OpenGLES/ES2/glext.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

#import "EXUnversioned.h"

#import <GPUImage.h>

#if __has_include("EXGLARSessionManager.h")
#import "EXGLARSessionManager.h"
#else
#import "EXGLARSessionManagerStub.h"
#endif

@interface EXGLView ()

@property (nonatomic, weak) EXGLViewManager *viewManager;
@property (nonatomic, assign) GLuint viewFramebuffer;
@property (nonatomic, assign) GLuint viewColorbuffer;
@property (nonatomic, assign) GLuint viewDepthStencilbuffer;
@property (nonatomic, assign) GLuint msaaFramebuffer;
@property (nonatomic, assign) GLuint msaaRenderbuffer;

@property (nonatomic, strong) CADisplayLink *displayLink;

@property (nonatomic, assign) NSNumber *msaaSamples;

@property (nonatomic, strong) id arSessionManager;

@end


@interface RCTBridge ()

- (JSGlobalContextRef)jsContextRef;
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

@end


@implementation EXGLView

RCT_NOT_IMPLEMENTED(- (instancetype)init);

// Specify that we want this UIView to be backed by a CAEAGLLayer
+ (Class)layerClass {
  return [CAEAGLLayer class];
}

- (instancetype)initWithManager:(EXGLViewManager *)viewManager
{
  if ((self = [super init])) {
    _viewManager = viewManager;

    self.contentScaleFactor = RCTScreenScale();

    // Initialize properties of our backing CAEAGLLayer
    CAEAGLLayer *eaglLayer = (CAEAGLLayer *) self.layer;
    eaglLayer.opaque = YES;
    eaglLayer.drawableProperties = @{
      kEAGLDrawablePropertyRetainedBacking: @(YES),
      kEAGLDrawablePropertyColorFormat: kEAGLColorFormatRGBA8,
    };

    // Initialize GL context, view buffers will be created on layout event
    _eaglCtx = [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES2
                                     sharegroup:GPUImageContext.sharedImageProcessingContext.context.sharegroup];
    _msaaFramebuffer = _msaaRenderbuffer = _viewFramebuffer = _viewColorbuffer = _viewDepthStencilbuffer = 0;

    // Set up a draw loop
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(draw)];
//    _displayLink.preferredFramesPerSecond = 60;
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];

    // Will fill this in later from JS thread once `onSurfaceCreate` callback is set
    _exglCtxId = 0;
  }
  return self;
}

- (void)layoutSubviews
{
  [self resizeViewBuffersToWidth:self.contentScaleFactor * self.frame.size.width
                          height:self.contentScaleFactor * self.frame.size.height];
}

- (void)setOnSurfaceCreate:(RCTDirectEventBlock)onSurfaceCreate
{
  _onSurfaceCreate = onSurfaceCreate;
  if (_onSurfaceCreate) {
    // Got non-empty onSurfaceCreate callback -- set up JS binding -- only possible on JavaScriptCore
    RCTBridge *bridge = _viewManager.bridge;
    if (!bridge.executorClass || [NSStringFromClass(bridge.executorClass) isEqualToString:@"RCTJSCExecutor"]) {
      // On JS thread, extract JavaScriptCore context, create EXGL context, call JS callback
      __weak __typeof__(self) weakSelf = self;
      __weak __typeof__(bridge) weakBridge = bridge;
      [bridge dispatchBlock:^{
        __typeof__(self) self = weakSelf;
        __typeof__(bridge) bridge = weakBridge;
        if (!self || !bridge || !bridge.valid) {
          return;
        }

        JSGlobalContextRef jsContextRef = [bridge jsContextRef];
        if (!jsContextRef) {
          RCTLogError(@"EXGL: The React Native bridge unexpectedly does not have a JavaScriptCore context.");
          return;
        }

        _exglCtxId = UEXGLContextCreate(jsContextRef);
        _onSurfaceCreate(@{ @"exglCtxId": @(_exglCtxId) });
      } queue:RCTJSThread];
    } else {
      RCTLog(@"EXGL: Can only run on JavaScriptCore! Do you have 'Remote Debugging' enabled in your app's Developer Menu (https://facebook.github.io/react-native/docs/debugging.html)? EXGL is not supported while using Remote Debugging, you will need to disable it to use EXGL.");
    }
  }
}

- (void)deleteViewBuffers
{
  [EAGLContext setCurrentContext:_eaglCtx];
  if (_viewDepthStencilbuffer != 0) {
    glDeleteRenderbuffers(1, &_viewDepthStencilbuffer);
    _viewDepthStencilbuffer = 0;
  }
  if (_viewColorbuffer != 0) {
    glDeleteRenderbuffers(1, &_viewColorbuffer);
    _viewColorbuffer = 0;
  }
  if (_viewFramebuffer != 0) {
    glDeleteFramebuffers(1, &_viewFramebuffer);
    _viewFramebuffer = 0;
  }
  if (_msaaRenderbuffer != 0) {
    glDeleteRenderbuffers(1, &_msaaRenderbuffer);
    _msaaRenderbuffer = 0;
  }
  if (_msaaFramebuffer != 0) {
    glDeleteFramebuffers(1, &_msaaFramebuffer);
    _msaaFramebuffer = 0;
  }
}

- (void)resizeViewBuffersToWidth:(short)width height:(short)height
{
  [EAGLContext setCurrentContext:_eaglCtx];

  // Save surrounding framebuffer/renderbuffer
  GLint prevFramebuffer;
  GLint prevRenderbuffer;
  glGetIntegerv(GL_FRAMEBUFFER_BINDING, &prevFramebuffer);
  glGetIntegerv(GL_RENDERBUFFER_BINDING, &prevRenderbuffer);
  if (prevFramebuffer == _viewFramebuffer) {
    prevFramebuffer = 0;
  }

  // Delete old buffers if they exist
  [self deleteViewBuffers];

  // Set up view framebuffer
  glGenFramebuffers(1, &_viewFramebuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, _viewFramebuffer);

  // Set up new color renderbuffer
  glGenRenderbuffers(1, &_viewColorbuffer);
  glBindRenderbuffer(GL_RENDERBUFFER, _viewColorbuffer);
  [_eaglCtx renderbufferStorage:GL_RENDERBUFFER fromDrawable:(CAEAGLLayer *)self.layer];
  glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                            GL_RENDERBUFFER, _viewColorbuffer);
  GLint realWidth, realHeight;
  glGetRenderbufferParameteriv(GL_RENDERBUFFER, GL_RENDERBUFFER_WIDTH, &realWidth);
  glGetRenderbufferParameteriv(GL_RENDERBUFFER, GL_RENDERBUFFER_HEIGHT, &realHeight);

  // Set up MSAA framebuffer/renderbuffer
  glGenFramebuffers(1, &_msaaFramebuffer);
  glGenRenderbuffers(1, &_msaaRenderbuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, _msaaFramebuffer);
  glBindRenderbuffer(GL_RENDERBUFFER, _msaaRenderbuffer);
  glRenderbufferStorageMultisampleAPPLE(GL_RENDERBUFFER, self.msaaSamples.intValue, GL_RGBA8_OES,
                                        realWidth, realHeight);
  glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                            GL_RENDERBUFFER, _msaaRenderbuffer);

  // Set up new depth+stencil renderbuffer
  glGenRenderbuffers(1, &_viewDepthStencilbuffer);
  glBindRenderbuffer(GL_RENDERBUFFER, _viewDepthStencilbuffer);
  glRenderbufferStorageMultisampleAPPLE(GL_RENDERBUFFER, self.msaaSamples.intValue, GL_DEPTH24_STENCIL8_OES,
                                        realWidth, realHeight);
  glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT,
                            GL_RENDERBUFFER, _viewDepthStencilbuffer);
  glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_STENCIL_ATTACHMENT,
                            GL_RENDERBUFFER, _viewDepthStencilbuffer);

  // Resize viewport
  glViewport(0, 0, width, height);

  // Restore surrounding framebuffer/renderbuffer
  if (prevFramebuffer != 0) {
    glBindFramebuffer(GL_FRAMEBUFFER, prevFramebuffer);
  }
  glBindRenderbuffer(GL_RENDERBUFFER, prevRenderbuffer);

  // TODO(nikki): Notify JS component of resize
}

// TODO(nikki): Should all this be done in `dealloc` instead?
- (void)removeFromSuperview
{
  // Stop AR session if running
  [self maybeStopARSession];

  // Destroy JS binding
  UEXGLContextDestroy(_exglCtxId);

  // Destroy GL objects owned by us
  [self deleteViewBuffers];

  // Stop draw loop
  [_displayLink invalidate];
  _displayLink = nil;

  [super removeFromSuperview];
}

- (void)draw
{
  // _exglCtxId may be unset if we get here (on the UI thread) before UEXGLContextCreate(...) is
  // called on the JS thread to create the EXGL context and save its id (see init method). In
  // this case no GL work has been sent yet so we skip this frame.
  //
  // _viewFramebuffer may be 0 if we haven't had a layout event yet and so the size of the
  // framebuffer to create is unknown. In this case we have nowhere to render to so we skip
  // this frame (the GL work to run remains on the queue for next time).
  if (_exglCtxId != 0 && _viewFramebuffer != 0) {
    [EAGLContext setCurrentContext:_eaglCtx];

    // Update AR stuff if we have an AR session running
    if (_arSessionManager) {
      [_arSessionManager updateARCamTexture];
    }

    UEXGLContextSetDefaultFramebuffer(_exglCtxId, _msaaFramebuffer);
    UEXGLContextFlush(_exglCtxId);

    // Present current state of view buffers
    // TODO(nikki): This should happen exactly at `gl.endFrameEXP()` in the queue
    if (_viewColorbuffer != 0)
    {
      // Save surrounding framebuffer/renderbuffer
      GLint prevFramebuffer;
      GLint prevRenderbuffer;
      glGetIntegerv(GL_FRAMEBUFFER_BINDING, &prevFramebuffer);
      glGetIntegerv(GL_RENDERBUFFER_BINDING, &prevRenderbuffer);
      if (prevFramebuffer == _viewFramebuffer) {
        prevFramebuffer = 0;
      }

      // Resolve multisampling and present
      glBindFramebuffer(GL_READ_FRAMEBUFFER_APPLE, _msaaFramebuffer);
      glBindFramebuffer(GL_DRAW_FRAMEBUFFER_APPLE, _viewFramebuffer);
      glResolveMultisampleFramebufferAPPLE();
      glBindRenderbuffer(GL_RENDERBUFFER, _viewColorbuffer);
      [_eaglCtx presentRenderbuffer:GL_RENDERBUFFER];

      // Restore surrounding framebuffer/renderbuffer
      if (prevFramebuffer != 0) {
        glBindFramebuffer(GL_FRAMEBUFFER, prevFramebuffer);
      }
      glBindRenderbuffer(GL_RENDERBUFFER, prevRenderbuffer);
    }
  }
}

#pragma mark - maybe AR

- (NSDictionary *)maybeStartARSession
{
  Class sessionManagerClass = NSClassFromString(@"EXGLARSessionManager");
  if (sessionManagerClass) {
    _arSessionManager = [[sessionManagerClass alloc] init];
  } else {
    return @{ @"error": @"AR capabilities were not included with this build." };
  }
  return [_arSessionManager startARSessionWithGLView:self];
}

- (void)maybeStopARSession
{
  if (_arSessionManager) {
    [_arSessionManager stopARSession];
    _arSessionManager = nil;
  }
}

- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar
{
  if (_arSessionManager) {
    return [_arSessionManager arMatricesForViewportSize:viewportSize zNear:zNear zFar:zFar];
  }
  return @{};
}

@end
