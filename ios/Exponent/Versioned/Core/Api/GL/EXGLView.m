#import "EXGLView.h"
#import "EXGLContext.h"
#import "EXFileSystem.h"

#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>
#import <ARKit/ARKit.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

#import "EXUnversioned.h"

#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)
#define SHADER_STRING(text) @ STRINGIZE2(text)

#if __has_include("EXGLARSessionManager.h")
#import "EXGLARSessionManager.h"
#else
#import "EXGLARSessionManagerStub.h"
#endif

@interface EXGLView ()

@property (nonatomic, weak) EXGLViewManager *viewManager;

@property (nonatomic, assign) GLint layerWidth;
@property (nonatomic, assign) GLint layerHeight;
@property (nonatomic, assign) GLuint viewFramebuffer;
@property (nonatomic, assign) GLuint viewColorbuffer;
@property (nonatomic, assign) GLuint viewDepthStencilbuffer;
@property (nonatomic, assign) GLuint msaaFramebuffer;
@property (nonatomic, assign) GLuint msaaRenderbuffer;
@property (nonatomic, strong) dispatch_queue_t glQueue;

@property (nonatomic, strong) CADisplayLink *displayLink;

@property (nonatomic, assign) NSNumber *msaaSamples;
@property (nonatomic, assign) BOOL isLayouted;
@property (nonatomic, assign) BOOL renderbufferPresented;
@property (nonatomic, assign) CGSize viewBuffersSize;

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
    _isLayouted = NO;
    _renderbufferPresented = YES;
    _viewBuffersSize = CGSizeZero;
    
    self.contentScaleFactor = RCTScreenScale();
    
    // Initialize properties of our backing CAEAGLLayer
    CAEAGLLayer *eaglLayer = (CAEAGLLayer *) self.layer;
    eaglLayer.opaque = YES;
    eaglLayer.drawableProperties = @{
      kEAGLDrawablePropertyRetainedBacking: @(YES),
      kEAGLDrawablePropertyColorFormat: kEAGLColorFormatRGBA8,
    };

    // Initialize GL context
    EXGLObjectManager *objectManager = [viewManager.bridge moduleForClass:[EXGLObjectManager class]];
    _glContext = [[EXGLContext alloc] initWithDelegate:self andManager:objectManager];
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

- (void)setOnSurfaceCreate:(RCTDirectEventBlock)onSurfaceCreate
{
  _onSurfaceCreate = onSurfaceCreate;
  [self maybeCallSurfaceCreated];
}

- (void)runOnUIThread:(void(^)(void))callback
{
  dispatch_sync(dispatch_get_main_queue(), ^{
    [_glContext runInEAGLContext:_uiEaglCtx callback:callback];
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
    
    [self runOnUIThread:^{
      glBindRenderbuffer(GL_RENDERBUFFER, _viewColorbuffer);
      [_uiEaglCtx renderbufferStorage:GL_RENDERBUFFER fromDrawable:(CAEAGLLayer *)self.layer];
    }];
    
    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                              GL_RENDERBUFFER, _viewColorbuffer);
    glGetRenderbufferParameteriv(GL_RENDERBUFFER, GL_RENDERBUFFER_WIDTH, &_layerWidth);
    glGetRenderbufferParameteriv(GL_RENDERBUFFER, GL_RENDERBUFFER_HEIGHT, &_layerHeight);
    
    // Set up MSAA framebuffer/renderbuffer
    glGenFramebuffers(1, &_msaaFramebuffer);
    glGenRenderbuffers(1, &_msaaRenderbuffer);
    glBindFramebuffer(GL_FRAMEBUFFER, _msaaFramebuffer);
    glBindRenderbuffer(GL_RENDERBUFFER, _msaaRenderbuffer);
    glRenderbufferStorageMultisample(GL_RENDERBUFFER, self.msaaSamples.intValue, GL_RGBA8,
                                     _layerWidth, _layerHeight);
    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                              GL_RENDERBUFFER, _msaaRenderbuffer);

    if (_glContext.isInitialized) {
      UEXGLContextSetDefaultFramebuffer(_glContext.contextId, _msaaFramebuffer);
    }
    
    // Set up new depth+stencil renderbuffer
    glGenRenderbuffers(1, &_viewDepthStencilbuffer);
    glBindRenderbuffer(GL_RENDERBUFFER, _viewDepthStencilbuffer);
    glRenderbufferStorageMultisample(GL_RENDERBUFFER, self.msaaSamples.intValue, GL_DEPTH24_STENCIL8,
                                     _layerWidth, _layerHeight);
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
    // Update AR stuff if we have an AR session running
    if (_arSessionManager) {
      [_arSessionManager updateARCamTexture];
    }
    
    // Present current state of view buffers
    // This happens exactly at `gl.endFrameEXP()` in the queue
    if (_viewColorbuffer != 0 && !_renderbufferPresented) {
      // bind renderbuffer and present it on the layer
      [_glContext runInEAGLContext:_uiEaglCtx callback:^{
        glBindRenderbuffer(GL_RENDERBUFFER, _viewColorbuffer);
        [_uiEaglCtx presentRenderbuffer:GL_RENDERBUFFER];
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
    glBlitFramebuffer(0,0,_layerWidth,_layerHeight, 0,0,_layerWidth,_layerHeight, GL_COLOR_BUFFER_BIT, GL_NEAREST);
    
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

- (NSDictionary *)arLightEstimation
{
  if (_arSessionManager) {
    return [_arSessionManager arLightEstimation];
  }
  return @{};
}

- (NSDictionary *)rawFeaturePoints
{
  if (_arSessionManager) {
    return [_arSessionManager rawFeaturePoints];
  }
  return @{};
}

- (NSDictionary *)planes
{
  if (_arSessionManager) {
    return [_arSessionManager planes];
  }
  return @{};
}

- (void)setIsPlaneDetectionEnabled:(BOOL)planeDetectionEnabled
{
  if (_arSessionManager) {
    [_arSessionManager setIsPlaneDetectionEnabled:planeDetectionEnabled];
  }
}

- (void)setIsLightEstimationEnabled:(BOOL)lightEstimationEnabled
{
  if (_arSessionManager) {
    [_arSessionManager setIsLightEstimationEnabled:lightEstimationEnabled];
  }
}

- (void)setWorldAlignment:(NSInteger)worldAlignment
{
  if (_arSessionManager) {
    [_arSessionManager setWorldAlignment:worldAlignment];
  }
}

@end
