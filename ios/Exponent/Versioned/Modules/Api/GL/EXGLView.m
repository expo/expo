#import "EXGLView.h"

#include <OpenGLES/ES2/gl.h>
#include <OpenGLES/ES2/glext.h>

#import "RCTJSCExecutor.h"

#import "EXUnversioned.h"
#import <EXGL.h>


@interface EXGLView ()

@property (nonatomic, weak) EXGLViewManager *viewManager;

@property (nonatomic, strong) EAGLContext *eaglCtx;
@property (nonatomic, assign) GLuint viewFramebuffer;
@property (nonatomic, assign) GLuint viewColorbuffer;
@property (nonatomic, assign) GLuint viewDepthStencilbuffer;

@property (nonatomic, strong) CADisplayLink *displayLink;

@property (nonatomic, assign) EX_UNVERSIONED(EXGLContextId) exglCtxId;

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

    // Initialize properties of our backing CAEAGLLayer
    CAEAGLLayer *eaglLayer = (CAEAGLLayer *) self.layer;
    eaglLayer.opaque = YES;
    eaglLayer.drawableProperties = @{
      kEAGLDrawablePropertyRetainedBacking: @(YES),
      kEAGLDrawablePropertyColorFormat: kEAGLColorFormatRGBA8,
    };

    // Initialize GL context, view buffers will be created on layout event
    self.eaglCtx = [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES2];
    _viewFramebuffer = _viewColorbuffer = _viewDepthStencilbuffer = 0;

    // Set up a draw loop
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(draw)];
    _displayLink.preferredFramesPerSecond = 60;
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];

    // Setup JS binding -- only possible on JavaScriptCore
    id<RCTJavaScriptExecutor> executor = [_viewManager.bridge valueForKey:@"javaScriptExecutor"];
    if ([executor isKindOfClass:NSClassFromString(@"RCTJSCExecutor")]) {
      // On JS thread, extract JavaScriptCore context, create EXGL context, call JS callback
      __weak __typeof__(self) weakSelf = self;
      __weak __typeof__(executor) weakExecutor = executor;
      [executor executeBlockOnJavaScriptQueue:^{
        __typeof__(self) self = weakSelf;
        RCTJSCExecutor *executor = weakExecutor;
        if (self && executor) {
          _exglCtxId = EX_UNVERSIONED(EXGLContextCreate)(executor.jsContext.JSGlobalContextRef);
          _onSurfaceCreate(@{ @"exglCtxId": @(_exglCtxId) });
        }
      }];
    } else {
      RCTLog(@"EXGL: Can only run on JavaScriptCore!");
    }
  }
  return self;
}

- (void)layoutSubviews
{
  [self resizeViewBuffersToWidth:self.frame.size.width height:self.frame.size.height];
}

- (void)deleteViewBuffers
{
  [EAGLContext setCurrentContext:self.eaglCtx];
  if (_viewDepthStencilbuffer != 0) {
    glDeleteRenderbuffers(1, &_viewDepthStencilbuffer);
  }
  if (_viewColorbuffer != 0) {
    glDeleteRenderbuffers(1, &_viewColorbuffer);
  }
  if (_viewFramebuffer != 0) {
    glDeleteFramebuffers(1, &_viewFramebuffer);
  }
}

- (void)resizeViewBuffersToWidth:(short)width height:(short)height
{
  [EAGLContext setCurrentContext:self.eaglCtx];

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

  // Set up new framebuffer
  glGenFramebuffers(1, &_viewFramebuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, _viewFramebuffer);

  // Set up new color renderbuffer
  glGenRenderbuffers(1, &_viewColorbuffer);
  glBindRenderbuffer(GL_RENDERBUFFER, _viewColorbuffer);
  [self.eaglCtx renderbufferStorage:GL_RENDERBUFFER fromDrawable:(CAEAGLLayer *)self.layer];
  glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                            GL_RENDERBUFFER, _viewColorbuffer);

  // Set up new depth+stencil renderbuffer
  glGenRenderbuffers(1, &_viewDepthStencilbuffer);
  glBindRenderbuffer(GL_RENDERBUFFER, _viewDepthStencilbuffer);
  glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH24_STENCIL8_OES,
                        self.frame.size.width, self.frame.size.height);
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
  EX_UNVERSIONED(EXGLContextDestroy)(_exglCtxId);

  // Destroy GL objects owned by us
  [self deleteViewBuffers];

  // Stop draw loop
  [_displayLink invalidate];
  _displayLink = nil;

  [super removeFromSuperview];
}

- (void)draw
{
  // _exglCtxId may be unset if we get here (on the UI thread) before EXGLContextCreate(...) is
  // called on the JS thread to create the EXGL context and save its id (see init method)
  if (_exglCtxId != 0) {
    [EAGLContext setCurrentContext:self.eaglCtx];

    // Bind view framebuffer if at zero
    // TODO(nikki): Put this in JS binding for `gl.bindFramebuffer(GL_FRAMEBUFFER, 0)`
    {
      GLint framebuffer;
      glGetIntegerv(GL_FRAMEBUFFER_BINDING, &framebuffer);
      if (framebuffer == 0) {
        glBindFramebuffer(GL_FRAMEBUFFER, _viewFramebuffer);
      }
    }

    // Run GL commands queued from JS
    EX_UNVERSIONED(EXGLContextFlush)(_exglCtxId);

    // Present current state of view buffers
    // TODO(nikki): This should happen exactly at `gl.endFrameEXP()` in the queue
    if (_viewColorbuffer != 0)
    {
      // Present view color renderbuffer
      GLint prevRenderbuffer;
      glGetIntegerv(GL_RENDERBUFFER_BINDING, &prevRenderbuffer);
      glBindRenderbuffer(GL_RENDERBUFFER, _viewColorbuffer);
      [self.eaglCtx presentRenderbuffer:GL_RENDERBUFFER];
      glBindRenderbuffer(GL_RENDERBUFFER, prevRenderbuffer);
    }
  }
}

@end
