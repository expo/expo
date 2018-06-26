// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCore/EXUtilities.h>
#import <EXGL/EXGLView.h>
#import <EXGL/EXGLContext.h>

#include <OpenGLES/ES2/glext.h>
#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>

#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)
#define SHADER_STRING(text) @ STRINGIZE2(text)

@interface EXGLView ()

@property (nonatomic, assign) GLint layerWidth;
@property (nonatomic, assign) GLint layerHeight;
@property (nonatomic, assign) GLuint viewFramebuffer;
@property (nonatomic, assign) GLuint viewColorbuffer;
@property (nonatomic, assign) GLuint viewDepthStencilbuffer;
@property (nonatomic, assign) GLuint msaaFramebuffer;
@property (nonatomic, assign) GLuint msaaRenderbuffer;
@property (nonatomic, strong) dispatch_queue_t glQueue;

@property (nonatomic, strong) CADisplayLink *displayLink;

@property (nonatomic, assign) BOOL isLayouted;
@property (nonatomic, assign) BOOL renderbufferPresented;
@property (nonatomic, assign) CGSize viewBuffersSize;

@property (nonatomic, weak) id arSessionManager;

@end

@implementation EXGLView

// Specify that we want this UIView to be backed by a CAEAGLLayer
+ (Class)layerClass {
  return [CAEAGLLayer class];
}

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if ((self = [super init])) {
    _isLayouted = NO;
    _renderbufferPresented = YES;
    _viewBuffersSize = CGSizeZero;
    
    self.contentScaleFactor = [EXUtilities screenScale];
    
    // Initialize properties of our backing CAEAGLLayer
    CAEAGLLayer *eaglLayer = (CAEAGLLayer *) self.layer;
    eaglLayer.opaque = YES;
    eaglLayer.drawableProperties = @{
      kEAGLDrawablePropertyRetainedBacking: @(YES),
      kEAGLDrawablePropertyColorFormat: kEAGLColorFormatRGBA8,
    };

    // Initialize GL context
    _glContext = [[EXGLContext alloc] initWithDelegate:self andModuleRegistry:moduleRegistry];
    _uiEaglCtx = [_glContext createSharedEAGLContext];
    [_glContext initialize:nil];

    // View buffers will be created on layout event
    _msaaFramebuffer = _msaaRenderbuffer = _viewFramebuffer = _viewColorbuffer = _viewDepthStencilbuffer = 0;
    
    // Set up a draw loop
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(draw)];
    //    _displayLink.preferredFramesPerSecond = 60;
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
  return self;
}

- (UEXGLContextId)exglCtxId
{
  return [_glContext contextId];
}

- (void)maybeCallSurfaceCreated
{
  // Because initialization things happen asynchronously,
  // we need to be sure that they all are done before we pass GL object to JS.

  if (_onSurfaceCreate && _glContext.isInitialized && _isLayouted) {
    UEXGLContextId exglCtxId = _glContext.contextId;
    UEXGLContextSetDefaultFramebuffer(exglCtxId, _msaaFramebuffer);
    _onSurfaceCreate(@{ @"exglCtxId": @(exglCtxId) });

    // unset onSurfaceCreate - it will not be needed anymore
    _onSurfaceCreate = nil;
  }
}

- (void)layoutSubviews
{
  [self resizeViewBuffersToWidth:self.contentScaleFactor * self.frame.size.width
                          height:self.contentScaleFactor * self.frame.size.height];

  _isLayouted = YES;
  [self maybeCallSurfaceCreated];
}

- (void)setOnSurfaceCreate:(EXDirectEventBlock)onSurfaceCreate
{
  _onSurfaceCreate = onSurfaceCreate;
  [self maybeCallSurfaceCreated];
}

- (void)runOnUIThread:(void(^)(void))callback
{
  dispatch_sync(dispatch_get_main_queue(), ^{
    [self->_glContext runInEAGLContext:self->_uiEaglCtx callback:callback];
  });
}

- (void)deleteViewBuffers
{
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
  CGSize newViewBuffersSize = CGSizeMake(width, height);
  
  // Don't resize if size hasn't changed and the current size is not zero
  if (CGSizeEqualToSize(newViewBuffersSize, _viewBuffersSize) && !CGSizeEqualToSize(_viewBuffersSize, CGSizeZero)) {
    return;
  }
  
  // update viewBuffersSize on UI thread (before actual resize takes place)
  // to get rid of redundant resizes if layoutSubviews is called multiple times with the same frame size
  _viewBuffersSize = newViewBuffersSize;

  [_glContext runAsync:^{
    // Save surrounding framebuffer/renderbuffer
    GLint prevFramebuffer;
    GLint prevRenderbuffer;
    glGetIntegerv(GL_FRAMEBUFFER_BINDING, &prevFramebuffer);
    glGetIntegerv(GL_RENDERBUFFER_BINDING, &prevRenderbuffer);
    if (prevFramebuffer == self->_viewFramebuffer) {
      prevFramebuffer = 0;
    }
    
    // Delete old buffers if they exist
    [self deleteViewBuffers];
    
    // Set up view framebuffer
    glGenFramebuffers(1, &self->_viewFramebuffer);
    glBindFramebuffer(GL_FRAMEBUFFER, self->_viewFramebuffer);
    
    // Set up new color renderbuffer
    glGenRenderbuffers(1, &self->_viewColorbuffer);
    glBindRenderbuffer(GL_RENDERBUFFER, self->_viewColorbuffer);
    
    [self runOnUIThread:^{
      glBindRenderbuffer(GL_RENDERBUFFER, self->_viewColorbuffer);
      [self->_uiEaglCtx renderbufferStorage:GL_RENDERBUFFER fromDrawable:(CAEAGLLayer *)self.layer];
    }];
    
    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                              GL_RENDERBUFFER, self->_viewColorbuffer);
    glGetRenderbufferParameteriv(GL_RENDERBUFFER, GL_RENDERBUFFER_WIDTH, &self->_layerWidth);
    glGetRenderbufferParameteriv(GL_RENDERBUFFER, GL_RENDERBUFFER_HEIGHT, &self->_layerHeight);
    
    // Set up MSAA framebuffer/renderbuffer
    glGenFramebuffers(1, &self->_msaaFramebuffer);
    glGenRenderbuffers(1, &self->_msaaRenderbuffer);
    glBindFramebuffer(GL_FRAMEBUFFER, self->_msaaFramebuffer);
    glBindRenderbuffer(GL_RENDERBUFFER, self->_msaaRenderbuffer);
    glRenderbufferStorageMultisample(GL_RENDERBUFFER, self.msaaSamples.intValue, GL_RGBA8,
                                     self->_layerWidth, self->_layerHeight);
    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                              GL_RENDERBUFFER, self->_msaaRenderbuffer);

    if (self->_glContext.isInitialized) {
      UEXGLContextSetDefaultFramebuffer(self->_glContext.contextId, self->_msaaFramebuffer);
    }
    
    // Set up new depth+stencil renderbuffer
    glGenRenderbuffers(1, &self->_viewDepthStencilbuffer);
    glBindRenderbuffer(GL_RENDERBUFFER, self->_viewDepthStencilbuffer);
    glRenderbufferStorageMultisample(GL_RENDERBUFFER, self.msaaSamples.intValue, GL_DEPTH24_STENCIL8,
                                     self->_layerWidth, self->_layerHeight);
    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT,
                              GL_RENDERBUFFER, self->_viewDepthStencilbuffer);
    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_STENCIL_ATTACHMENT,
                              GL_RENDERBUFFER, self->_viewDepthStencilbuffer);
    
    // Resize viewport
    glViewport(0, 0, width, height);
    
    // Restore surrounding framebuffer/renderbuffer
    if (prevFramebuffer != 0) {
      glBindFramebuffer(GL_FRAMEBUFFER, prevFramebuffer);
    }
    glBindRenderbuffer(GL_RENDERBUFFER, prevRenderbuffer);
    
    // TODO(nikki): Notify JS component of resize
  }];
}

// TODO(nikki): Should all this be done in `dealloc` instead?
- (void)removeFromSuperview
{
  // Destroy EXGLContext
  [_glContext destroy];

  // Stop draw loop
  [_displayLink invalidate];
  _displayLink = nil;
  
  [super removeFromSuperview];
}

- (void)draw
{
  // exglCtxId may be unset if we get here (on the UI thread) before UEXGLContextCreate(...) is
  // called on the JS thread to create the EXGL context and save its id (see EXGLContext.initializeContextWithBridge method).
  // In this case no GL work has been sent yet so we skip this frame.
  //
  // _viewFramebuffer may be 0 if we haven't had a layout event yet and so the size of the
  // framebuffer to create is unknown. In this case we have nowhere to render to so we skip
  // this frame (the GL work to run remains on the queue for next time).

  if (_glContext.isInitialized && _viewFramebuffer != 0) {
    // Present current state of view buffers
    // This happens exactly at `gl.endFrameEXP()` in the queue
    if (_viewColorbuffer != 0 && !_renderbufferPresented) {
      // bind renderbuffer and present it on the layer
      [_glContext runInEAGLContext:_uiEaglCtx callback:^{
        glBindRenderbuffer(GL_RENDERBUFFER, self->_viewColorbuffer);
        [self->_uiEaglCtx presentRenderbuffer:GL_RENDERBUFFER];
      }];
      
      // mark renderbuffer as presented
      _renderbufferPresented = YES;
    }
  }
}

// [GL thread] blits framebuffers and then sets a flag that informs UI thread
// about presenting the new content of the renderbuffer on the next draw call
- (void)blitFramebuffers
{
  if (_glContext.isInitialized && _viewFramebuffer != 0 && _viewColorbuffer != 0) {
    // Save surrounding framebuffer
    GLint prevFramebuffer;
    glGetIntegerv(GL_FRAMEBUFFER_BINDING, &prevFramebuffer);
    if (prevFramebuffer == _viewFramebuffer) {
      prevFramebuffer = 0;
    }
    
    // Resolve multisampling and present
    glBindFramebuffer(GL_READ_FRAMEBUFFER, _msaaFramebuffer);
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, _viewFramebuffer);
    
    // glBlitFramebuffer works only on OpenGL ES 3.0, so we need a fallback to Apple's extension for OpenGL ES 2.0
    if (_glContext.eaglCtx.API == kEAGLRenderingAPIOpenGLES3) {
      glBlitFramebuffer(0, 0, _layerWidth, _layerHeight, 0, 0, _layerWidth, _layerHeight, GL_COLOR_BUFFER_BIT, GL_NEAREST);
    } else {
      glResolveMultisampleFramebufferAPPLE();
    }
    
    // Restore surrounding framebuffer
    if (prevFramebuffer != 0) {
      glBindFramebuffer(GL_FRAMEBUFFER, prevFramebuffer);
    }
    
    // mark renderbuffer as not presented
    _renderbufferPresented = NO;
  }
}

#pragma mark - EXGLContextDelegate

// [GL thread]
- (void)glContextFlushed:(nonnull EXGLContext *)context
{
  // blit framebuffers if endFrameEXP was called
  if (UEXGLContextNeedsRedraw(_glContext.contextId)) {
    // actually draw isn't yet finished, but it's here to prevent blitting the same thing multiple times
    UEXGLContextDrawEnded(_glContext.contextId);

    [self blitFramebuffers];
  }
}

// [JS thread]
- (void)glContextInitialized:(nonnull EXGLContext *)context
{
  [self maybeCallSurfaceCreated];
}

// [GL thread]
- (void)glContextWillDestroy:(nonnull EXGLContext *)context
{
  // Stop AR session if running
  [self maybeStopARSession];
  
  // Destroy GL objects owned by us
  [self deleteViewBuffers];
}

- (UEXGLObjectId)glContextGetDefaultFramebuffer
{
  return _viewFramebuffer;
}

#pragma mark - maybe AR

- (void)setArSessionManager:(id)arSessionManager
{
  _arSessionManager = arSessionManager;
}

- (void)maybeStopARSession
{
  if (_arSessionManager) {
    [_arSessionManager stop];
    _arSessionManager = nil;
  }
}

@end
