#import "ABI25_0_0EXGLARSessionManager.h"

#import <ARKit/ARKit.h>
#include <OpenGLES/ES2/gl.h>
#include <OpenGLES/ES2/glext.h>
#import <EXGL-CPP/UEXGL.h>

#define STRINGIZE(x) #x

@interface ABI25_0_0EXGLARSessionManager ()
{
  GLuint _arCamProgram;
  int _arCamPositionAttrib;
  GLuint _arCamBuffer;
  CVOpenGLESTextureRef _arCamYTex;
  CVOpenGLESTextureRef _arCamCbCrTex;
  CVOpenGLESTextureCacheRef _arCamCache;
  GLuint _arCamOutputTexture;
  GLuint _arCamOutputFramebuffer;
  UEXGLObjectId _arCamOutputEXGLObj;
}

@property (nonatomic, assign) ABI25_0_0EXGLView *glView;
@property (atomic, strong) ARSession *arSession;
@property (atomic, strong) ARWorldTrackingConfiguration *arConfig;
@end

@implementation ABI25_0_0EXGLARSessionManager

static GLfloat arCamVerts[] = { -2.0f, 0.0f, 0.0f, -2.0f, 2.0f, 2.0f };

- (NSDictionary *)startARSessionWithGLView:(ABI25_0_0EXGLView *)glView
{
  self.glView = glView;

  // Save previous GL state
  GLint prevBuffer, prevActiveTexture, prevTextureBinding, prevFramebuffer, prevProgram;
  glGetIntegerv(GL_ARRAY_BUFFER_BINDING, &prevBuffer);
  glGetIntegerv(GL_FRAMEBUFFER_BINDING, &prevFramebuffer);
  glGetIntegerv(GL_ACTIVE_TEXTURE, &prevActiveTexture);
  glGetIntegerv(GL_TEXTURE_BINDING_2D, &prevTextureBinding);
  glGetIntegerv(GL_CURRENT_PROGRAM, &prevProgram);

  self.arSession = [[ARSession alloc] init];
  self.arConfig = [[ARWorldTrackingConfiguration alloc] init];
  if (!self.arConfig) {
    return @{
             @"error": @"ARKit is not available on this device.",
             };
  }
  [self.arSession runWithConfiguration:self.arConfig];
  
  CVReturn err = CVOpenGLESTextureCacheCreate(kCFAllocatorDefault, NULL, _glView.eaglCtx, NULL, &_arCamCache);
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

  // Create camera texture output ABI25_0_0EXGLObject
  _arCamOutputEXGLObj = UEXGLContextCreateObject(_glView.exglCtxId);
  UEXGLContextMapObject(_glView.exglCtxId, _arCamOutputEXGLObj, _arCamOutputTexture);

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
  if (self.arSession) {
    self.arSession = nil;
    glDeleteProgram(_arCamProgram);
    glDeleteBuffers(1, &_arCamBuffer);
    glDeleteTextures(1, &_arCamOutputTexture);
    glDeleteFramebuffers(1, &_arCamOutputFramebuffer);
    UEXGLContextDestroyObject(_glView.exglCtxId, _arCamOutputTexture);
  }
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
  if (!self.arSession) {
    return nil;
  }

  UIInterfaceOrientation orientation = [UIApplication sharedApplication].statusBarOrientation;

  matrix_float4x4 viewMat = [self.arSession.currentFrame.camera viewMatrixForOrientation:orientation];
  matrix_float4x4 projMat = [self.arSession.currentFrame.camera projectionMatrixForOrientation:orientation viewportSize:viewportSize zNear:zNear zFar:zFar];
  matrix_float4x4 transform = [self.arSession.currentFrame.camera transform];
  return @{
    @"transform": [ABI25_0_0EXGLARSessionManager nsArrayForMatrix:transform],
    @"viewMatrix": [ABI25_0_0EXGLARSessionManager nsArrayForMatrix:viewMat],
    @"projectionMatrix": [ABI25_0_0EXGLARSessionManager nsArrayForMatrix:projMat],
  };
}

- (void)setIsPlaneDetectionEnabled:(BOOL)isPlaneDetectionEnabled
{
  _isPlaneDetectionEnabled = isPlaneDetectionEnabled;
  if (isPlaneDetectionEnabled) {
    self.arConfig.planeDetection = ARPlaneDetectionHorizontal;
  } else {
    self.arConfig.planeDetection = ARPlaneDetectionNone;
  }
  [self _reload];
}

- (void)setIsLightEstimationEnabled:(BOOL)isLightEstimationEnabled
{
  _isLightEstimationEnabled = isLightEstimationEnabled;
  self.arConfig.lightEstimationEnabled = isLightEstimationEnabled;
  [self _reload];
}

- (void)setWorldAlignment:(NSInteger)worldAlignment
{
  _worldAlignment = worldAlignment;
  self.arConfig.worldAlignment = worldAlignment;
  [self _reload];
}

- (void)_reload
{
  [self.arSession runWithConfiguration:self.arConfig];
}

- (NSDictionary *)arLightEstimation
{
  if (!self.arSession) {
    return nil;
  }

  ARLightEstimate *arLightEstimation = self.arSession.currentFrame.lightEstimate;

  return @{
    @"ambientIntensity": [NSNumber numberWithFloat:arLightEstimation.ambientIntensity],
    @"ambientColorTemperature": [NSNumber numberWithFloat:arLightEstimation.ambientColorTemperature]
  };
}

- (NSDictionary *)rawFeaturePoints
{
  if (!self.arSession) {
    return nil;
  }

  ARPointCloud *rawFeaturePoints = self.arSession.currentFrame.rawFeaturePoints;

  NSMutableArray *featurePoints = [NSMutableArray array];
  for (int i = 0; i < rawFeaturePoints.count; i++) {
    vector_float3 point = rawFeaturePoints.points[i];

    NSString *pointId = [NSString stringWithFormat:@"featurepoint_%lld", rawFeaturePoints.identifiers[i]];

    [featurePoints addObject:@{
                               @"x": @(point[0]),
                               @"y": @(point[1]),
                               @"z": @(point[2]),
                               @"id": pointId,
                               }];
  }

  return @{
           @"featurePoints": featurePoints
           };
}

- (NSDictionary *)planes
{
  if (!self.arSession) {
    return nil;
  }
  
  NSArray<ARAnchor *> *anchors = self.arSession.currentFrame.anchors;
  NSMutableArray *planes = [NSMutableArray array];
  
  for (int i = 0; i < anchors.count; i++) {
    if ([anchors[i] isKindOfClass:[ARPlaneAnchor class]]){
      ARPlaneAnchor *planeAnchor = (ARPlaneAnchor *)anchors[i];
      vector_float3 extent = planeAnchor.extent;
      vector_float3 center = planeAnchor.center;

      [planes addObject:@{
                          @"center": @{
                              @"x": @(center[0]),
                              @"y": @(center[1]),
                              @"z": @(center[2])
                              },
                          @"extent": @{
                              @"width": @(extent[0]),
                              @"length": @(extent[2])
                              },
                          @"id": [NSString stringWithFormat:@"%@", planeAnchor.identifier],
                          @"transform": [ABI25_0_0EXGLARSessionManager nsArrayForMatrix: planeAnchor.transform]
                          }];
    }
  }
  
  return @{
           @"planes": planes
           };
}

- (void)updateARCamTexture
{
  if (!self.arSession) {
    return;
  }

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

  CVPixelBufferRef camPixelBuffer = self.arSession.currentFrame.capturedImage;
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
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glBindTexture(CVOpenGLESTextureGetTarget(_arCamYTex), 0);
    glBindTexture(CVOpenGLESTextureGetTarget(_arCamCbCrTex), CVOpenGLESTextureGetName(_arCamCbCrTex));
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
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

