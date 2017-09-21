#import "EXGLView.h"

#include <OpenGLES/ES2/gl.h>
#include <OpenGLES/ES2/glext.h>
#import <ARKit/ARKit.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

#import "EXUnversioned.h"
#import <UEXGL.h>

#import <GPUImage.h>


@interface EXGLView ()

@property (nonatomic, weak) EXGLViewManager *viewManager;

@property (nonatomic, strong) EAGLContext *eaglCtx;
@property (nonatomic, assign) GLuint viewFramebuffer;
@property (nonatomic, assign) GLuint viewColorbuffer;
@property (nonatomic, assign) GLuint viewDepthStencilbuffer;
@property (nonatomic, assign) GLuint msaaFramebuffer;
@property (nonatomic, assign) GLuint msaaRenderbuffer;

@property (nonatomic, strong) CADisplayLink *displayLink;

@property (nonatomic, assign) UEXGLContextId exglCtxId;

@property (nonatomic, assign) NSNumber *msaaSamples;

@property (nonatomic, strong) ARSession *arSession;
@property (nonatomic, assign) GLuint arCamProgram;
@property (nonatomic, assign) int arCamPositionAttrib;
@property (nonatomic, assign) GLuint arCamBuffer;
@property (nonatomic, assign) CVOpenGLESTextureRef arCamYTex;
@property (nonatomic, assign) CVOpenGLESTextureRef arCamCbCrTex;
@property (nonatomic, assign) CVOpenGLESTextureCacheRef arCamCache;
@property (nonatomic, assign) GLuint arCamOutputTexture;
@property (nonatomic, assign) GLuint arCamOutputFramebuffer;
@property (nonatomic, assign) UEXGLObjectId arCamOutputEXGLObj;

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
    _arSession = nil;

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
  if (_arSession) {
    [self stopARSession];
  }

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
    if (_arSession) {
      [self updateARCamTexture];
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

static GLfloat arCamVerts[] = { -2.0f, 0.0f, 0.0f, -2.0f, 2.0f, 2.0f };

- (NSDictionary *)startARSession
{
  // Save previous GL state
  GLint prevBuffer, prevActiveTexture, prevTextureBinding, prevFramebuffer, prevProgram;
  glGetIntegerv(GL_ARRAY_BUFFER_BINDING, &prevBuffer);
  glGetIntegerv(GL_FRAMEBUFFER_BINDING, &prevFramebuffer);
  glGetIntegerv(GL_ACTIVE_TEXTURE, &prevActiveTexture);
  glGetIntegerv(GL_TEXTURE_BINDING_2D, &prevTextureBinding);
  glGetIntegerv(GL_CURRENT_PROGRAM, &prevProgram);

  _arSession = [[ARSession alloc] init];
  ARWorldTrackingConfiguration *arConfig = [[ARWorldTrackingConfiguration alloc] init];
  [_arSession runWithConfiguration:arConfig];

  CVReturn err = CVOpenGLESTextureCacheCreate(kCFAllocatorDefault, NULL, _eaglCtx, NULL, &_arCamCache);
  if (err) {
    NSLog(@"Error from CVOpenGLESTextureCacheCreate(...): %d", err);
  }
  _arCamYTex = NULL;
  _arCamCbCrTex = NULL;

  // Compile camera texture vertex and fragment shader
  GLuint camVert = glCreateShader(GL_VERTEX_SHADER);
  const char *camVertSrc = STRINGIZE
  (
   attribute vec2 position;
   varying vec2 vUv;
   void main() {
     vUv = position;
     gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
   }
  );
  glShaderSource(camVert, 1, &camVertSrc, NULL);
  glCompileShader(camVert);
  GLuint camFrag = glCreateShader(GL_FRAGMENT_SHADER);
  const char *camFragSrc = STRINGIZE
  (
   precision highp float;
   uniform sampler2D yMap;
   uniform sampler2D uvMap;
   varying vec2 vUv;
   void main() {
     vec2 textureCoordinate = vec2(vUv.t, vUv.s);
     // Using BT.709 which is the standard for HDTV
     mat3 colorConversionMatrix = mat3(1.164,  1.164, 1.164,
                                       0.0, -0.213, 2.112,
                                       1.793, -0.533, 0.0);
     mediump vec3 yuv;
     lowp vec3 rgb;
     yuv.x = texture2D(yMap, textureCoordinate).r - (16.0/255.0);
     yuv.yz = texture2D(uvMap, textureCoordinate).ra - vec2(0.5, 0.5);
     rgb = colorConversionMatrix * yuv;
     gl_FragColor = vec4(rgb, 1.);
   }
   );
  glShaderSource(camFrag, 1, &camFragSrc, NULL);
  glCompileShader(camFrag);

  // Link, use camera texture program, save and enable attributes
  _arCamProgram = glCreateProgram();
  glAttachShader(_arCamProgram, camVert);
  glAttachShader(_arCamProgram, camFrag);
  glLinkProgram(_arCamProgram);
  glUseProgram(_arCamProgram);
  glDeleteShader(camVert);
  glDeleteShader(camFrag);
  _arCamPositionAttrib = glGetAttribLocation(_arCamProgram, "position");
  glEnableVertexAttribArray(_arCamPositionAttrib);

  // Create camera texture buffer
  glGenBuffers(1, &_arCamBuffer);
  glBindBuffer(GL_ARRAY_BUFFER, _arCamBuffer);
  glBufferData(GL_ARRAY_BUFFER, sizeof(arCamVerts), arCamVerts, GL_STATIC_DRAW);

  // Bind camera texture 'position' attribute
  glVertexAttribPointer(_arCamPositionAttrib, 2, GL_FLOAT, GL_FALSE, 0, 0);

  // Create camera texture output framebuffer
  glActiveTexture(GL_TEXTURE0);
  glGenTextures(1, &_arCamOutputTexture);
  glBindTexture(GL_TEXTURE_2D, _arCamOutputTexture);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 1280, 720, 0, GL_RGBA, GL_UNSIGNED_BYTE, NULL);
  glGenFramebuffers(1, &_arCamOutputFramebuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, _arCamOutputFramebuffer);
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, _arCamOutputTexture, 0);

  // Create camera texture outpout EXGLObject
  _arCamOutputEXGLObj = UEXGLContextCreateObject(_exglCtxId);
  UEXGLContextMapObject(_exglCtxId, _arCamOutputEXGLObj, _arCamOutputTexture);

  // Restore previous GL state
  glBindBuffer(GL_ARRAY_BUFFER, prevBuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, prevFramebuffer);
  glActiveTexture(prevActiveTexture);
  glBindTexture(GL_TEXTURE_2D, prevTextureBinding);
  glUseProgram(prevProgram);

  return @{
    @"capturedImageTexture": @(_arCamOutputEXGLObj),
  };
}

- (void)stopARSession
{
  _arSession = nil;
  glDeleteProgram(_arCamProgram);
  glDeleteBuffers(1, &_arCamBuffer);
  glDeleteTextures(1, &_arCamOutputTexture);
  glDeleteFramebuffers(1, &_arCamOutputFramebuffer);
  UEXGLContextDestroyObject(_exglCtxId, _arCamOutputTexture);
}

+ (NSArray *)nsArrayForMatrix:(matrix_float4x4)mat
{
  const float *v = (const float *)&mat;
  return @[@(v[0]), @(v[1]), @(v[2]), @(v[3]),
           @(v[4]), @(v[5]), @(v[6]), @(v[7]),
           @(v[8]), @(v[9]), @(v[10]), @(v[11]),
           @(v[12]), @(v[13]), @(v[14]), @(v[15])];
}

- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar
{
  if (!_arSession) {
    return nil;
  }

  matrix_float4x4 viewMat = [_arSession.currentFrame.camera viewMatrixForOrientation:UIInterfaceOrientationPortrait];
  matrix_float4x4 projMat = [_arSession.currentFrame.camera projectionMatrixForOrientation:UIInterfaceOrientationPortrait viewportSize:viewportSize zNear:zNear zFar:zFar];
  matrix_float4x4 transform = [_arSession.currentFrame.camera transform];
  return @{
    @"transform": [EXGLView nsArrayForMatrix:transform],
    @"viewMatrix": [EXGLView nsArrayForMatrix:viewMat],
    @"projectionMatrix": [EXGLView nsArrayForMatrix:projMat],
  };
}

- (void)updateARCamTexture
{
  // Save previous GL state
  GLint prevBuffer, prevActiveTexture, prevTextureBinding, prevFramebuffer, prevProgram;
  GLint prevViewport[4];
  glGetIntegerv(GL_ARRAY_BUFFER_BINDING, &prevBuffer);
  glGetIntegerv(GL_FRAMEBUFFER_BINDING, &prevFramebuffer);
  glGetIntegerv(GL_ACTIVE_TEXTURE, &prevActiveTexture);
  glGetIntegerv(GL_TEXTURE_BINDING_2D, &prevTextureBinding);
  glGetIntegerv(GL_CURRENT_PROGRAM, &prevProgram);
  glGetIntegerv(GL_VIEWPORT, prevViewport);

  glBindFramebuffer(GL_FRAMEBUFFER, _arCamOutputFramebuffer);
  glViewport(0, 0, 1280, 720);

  glUseProgram(_arCamProgram);
  glEnableVertexAttribArray(_arCamPositionAttrib);
  glBindBuffer(GL_ARRAY_BUFFER, _arCamBuffer);
  glVertexAttribPointer(_arCamPositionAttrib, 2, GL_FLOAT, GL_FALSE, 0, 0);

  CVPixelBufferRef camPixelBuffer = _arSession.currentFrame.capturedImage;
  if (CVPixelBufferGetPlaneCount(camPixelBuffer) >= 2) {
    CFRetain(camPixelBuffer);
    CVPixelBufferLockBaseAddress(camPixelBuffer, 0);

    CVBufferRelease(_arCamYTex);
    CVBufferRelease(_arCamCbCrTex);

    int width = (int) CVPixelBufferGetWidth(camPixelBuffer);
    int height = (int) CVPixelBufferGetHeight(camPixelBuffer);

    CVOpenGLESTextureCacheCreateTextureFromImage(kCFAllocatorDefault, _arCamCache, camPixelBuffer, NULL,
                                                 GL_TEXTURE_2D, GL_LUMINANCE, width, height,
                                                 GL_LUMINANCE, GL_UNSIGNED_BYTE, 0, &_arCamYTex);
    CVOpenGLESTextureCacheCreateTextureFromImage(kCFAllocatorDefault, _arCamCache, camPixelBuffer, NULL,
                                                 GL_TEXTURE_2D, GL_LUMINANCE_ALPHA, width / 2, height / 2,
                                                 GL_LUMINANCE_ALPHA, GL_UNSIGNED_BYTE, 1, &_arCamCbCrTex);

    glBindTexture(CVOpenGLESTextureGetTarget(_arCamYTex), CVOpenGLESTextureGetName(_arCamYTex));
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER,GL_LINEAR);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER,GL_LINEAR);
    glBindTexture(CVOpenGLESTextureGetTarget(_arCamYTex), 0);
    glBindTexture(CVOpenGLESTextureGetTarget(_arCamCbCrTex), CVOpenGLESTextureGetName(_arCamCbCrTex));
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER,GL_LINEAR);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER,GL_LINEAR);
    glBindTexture(CVOpenGLESTextureGetTarget(_arCamCbCrTex), 0);

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(CVOpenGLESTextureGetTarget(_arCamYTex), CVOpenGLESTextureGetName(_arCamYTex));
    glUniform1i(glGetUniformLocation(_arCamProgram, "yMap"), 0);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(CVOpenGLESTextureGetTarget(_arCamCbCrTex), CVOpenGLESTextureGetName(_arCamCbCrTex));
    glUniform1i(glGetUniformLocation(_arCamProgram, "uvMap"), 1);

    CVPixelBufferUnlockBaseAddress(camPixelBuffer, 0);
    CFRelease(camPixelBuffer);
  }

  glDrawArrays(GL_TRIANGLES, 0, 3);

  CVOpenGLESTextureCacheFlush(_arCamCache, 0);

  // Restore previous GL state
  glBindBuffer(GL_ARRAY_BUFFER, prevBuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, prevFramebuffer);
  glActiveTexture(prevActiveTexture);
  glBindTexture(GL_TEXTURE_2D, prevTextureBinding);
  glUseProgram(prevProgram);
  glViewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
}

@end
