#import "ABI16_0_0EXGLView.h"

#include <OpenGLES/ES2/gl.h>
#include <OpenGLES/ES2/glext.h>

#import <ReactABI16_0_0/ABI16_0_0RCTUtils.h>
#import <ReactABI16_0_0/ABI16_0_0RCTJSCExecutor.h>

#import "ABI16_0_0EXUnversioned.h"
#import <EXGL.h>


@interface ABI16_0_0EXGLView ()

@property (nonatomic, weak) ABI16_0_0EXGLViewManager *viewManager;

@property (nonatomic, strong) EAGLContext *eaglCtx;
@property (nonatomic, assign) GLuint viewFramebuffer;
@property (nonatomic, assign) GLuint viewColorbuffer;
@property (nonatomic, assign) GLuint viewDepthStencilbuffer;
@property (nonatomic, assign) GLuint msaaFramebuffer;
@property (nonatomic, assign) GLuint msaaRenderbuffer;

@property (nonatomic, strong) CADisplayLink *displayLink;

@property (nonatomic, assign) UEXGLContextId exglCtxId;

@property (nonatomic, assign) NSNumber *msaaSamples;

@end

@implementation ABI16_0_0EXGLView

ABI16_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init);

// Specify that we want this UIView to be backed by a CAEAGLLayer
+ (Class)layerClass {
  return [CAEAGLLayer class];
}

- (instancetype)initWithManager:(ABI16_0_0EXGLViewManager *)viewManager
{
  if ((self = [super init])) {
    _viewManager = viewManager;

    self.contentScaleFactor = ABI16_0_0RCTScreenScale();

    // Initialize properties of our backing CAEAGLLayer
    CAEAGLLayer *eaglLayer = (CAEAGLLayer *) self.layer;
    eaglLayer.opaque = YES;
    eaglLayer.drawableProperties = @{
      kEAGLDrawablePropertyRetainedBacking: @(YES),
      kEAGLDrawablePropertyColorFormat: kEAGLColorFormatRGBA8,
    };

    // Initialize GL context, view buffers will be created on layout event
    _eaglCtx = [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES2];
    _msaaFramebuffer = _msaaRenderbuffer = _viewFramebuffer = _viewColorbuffer = _viewDepthStencilbuffer = 0;

    // Set up a draw loop
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(draw)];
//    _displayLink.preferredFramesPerSecond = 60;
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];

    // Setup JS binding -- only possible on JavaScriptCore
    _exglCtxId = 0;
    id<ABI16_0_0RCTJavaScriptExecutor> executor = [_viewManager.bridge valueForKey:@"javaScriptExecutor"];
    if ([executor isKindOfClass:NSClassFromString(@"ABI16_0_0RCTJSCExecutor")]) {
      // On JS thread, extract JavaScriptCore context, create ABI16_0_0EXGL context, call JS callback
      __weak __typeof__(self) weakSelf = self;
      __weak __typeof__(executor) weakExecutor = executor;
      [executor executeBlockOnJavaScriptQueue:^{
        __typeof__(self) self = weakSelf;
        ABI16_0_0RCTJSCExecutor *executor = weakExecutor;
        if (self && executor) {
          _exglCtxId = UEXGLContextCreate(executor.jsContext.JSGlobalContextRef);
          _onSurfaceCreate(@{ @"exglCtxId": @(_exglCtxId) });
        }
      }];
    } else {
      ABI16_0_0RCTLog(@"ABI16_0_0EXGL: Can only run on JavaScriptCore! Do you have 'Remote Debugging' enabled in your app's Developer Menu (https://facebook.github.io/ReactABI16_0_0-native/docs/debugging.html)? ABI16_0_0EXGL is not supported while using Remote Debugging, you will need to disable it to use ABI16_0_0EXGL.");
    }
  }
  return self;
}

- (void)layoutSubviews
{
  [self resizeViewBuffersToWidth:self.contentScaleFactor * self.frame.size.width
                          height:self.contentScaleFactor * self.frame.size.height];
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
  // called on the JS thread to create the ABI16_0_0EXGL context and save its id (see init method). In
  // this case no GL work has been sent yet so we skip this frame.
  //
  // _viewFramebuffer may be 0 if we haven't had a layout event yet and so the size of the
  // framebuffer to create is unknown. In this case we have nowhere to render to so we skip
  // this frame (the GL work to run remains on the queue for next time).
  if (_exglCtxId != 0 && _viewFramebuffer != 0) {
    [EAGLContext setCurrentContext:_eaglCtx];
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

@end
