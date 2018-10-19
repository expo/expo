// Copyright 2015-present 650 Industries. All rights reserved.

#include <OpenGLES/ES2/gl.h>
#include <OpenGLES/ES2/glext.h>
#import <EXAR/EXARSessionManager.h>
#import <EXGL-CPP/UEXGL.h>
#import <EXAR/EXARSessionManager.h>
#import <EXAR/EXARModule+Serialization.h>

#define STRINGIZE(x) #x

@interface EXARSessionManager () <ARSessionObserver, ARSessionDelegate>
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
  UIInterfaceOrientation _interfaceOrientation;
  CGAffineTransform _viewportTransform;
  CGSize _viewportSize;
}

@property (nonatomic, weak) EXGLView *glView;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"

@property (atomic, strong) ARSession *session;
@property (atomic, strong) ARConfiguration *configuration;
#pragma clang diagnostic pop

@end

@implementation EXARSessionManager

static GLfloat imagePlaneVerts[6] = { -2.0f, 0.0f, 0.0f, -2.0f, 2.0f, 2.0f };

#pragma mark - Static Methods


#pragma mark - Public Methods

- (NSDictionary *)startWithGLView:(EXGLView *)glView trackingConfiguration:(NSString *) trackingConfiguration
{
  
  if (@available(iOS 11.0, *)) {
    self.session = [[ARSession alloc] init];
    self.configuration = [self _configurationFromString:trackingConfiguration];
  } else {
    return @{
             @"error": @"ARKit can only run on ios 11+ devices",
             };
  }
  if (!self.configuration) {
    return @{
             @"error": @"Invalid ARTrackingConfiguration, ARKit may not be available on this device.",
             };
  }
  
  self.glView = glView;
  
  self.session.delegate = self;
  [self.session runWithConfiguration:self.configuration];
  
  _arCamOutputEXGLObj = UEXGLContextCreateObject(_glView.exglCtxId);
  
  [glView.glContext runAsync:^{
    CGSize resolution = [self _getInitialResolution];
    [self _maybeSetupCameraTextureWithWidth:resolution.width height:resolution.height];
  }];
  
  return @{
           @"capturedImageTexture": @(_arCamOutputEXGLObj),
           };
}

- (CGSize)_getInitialResolution
{
  // Default in ARKit 1.0
  CGSize resolution = CGSizeMake(1280, 720);
  
  if (@available(iOS 11.0, *)) {
    if (_configuration && [_configuration isKindOfClass:ARConfiguration.class]) {
      if (@available(iOS 11.3, *)) {
        NSString *configurationClassName = NSStringFromClass([_configuration class]);
        if ([configurationClassName isEqualToString:@"ARWorldTrackingConfiguration"]) {
          ARVideoFormat *videoFormat = ARWorldTrackingConfiguration.supportedVideoFormats[0];
          return videoFormat.imageResolution;
        } else if ([configurationClassName isEqualToString:@"AROrientationTrackingConfiguration"]) {
          ARVideoFormat *videoFormat = AROrientationTrackingConfiguration.supportedVideoFormats[0];
          return videoFormat.imageResolution;
        }
        //        else if ([configurationClassName isEqualToString:@"ARFaceTrackingConfiguration"]) {
        //          ARVideoFormat *videoFormat = ARFaceTrackingConfiguration.supportedVideoFormats[0];
        //          return videoFormat.imageResolution;
        //        }
      } else {
        //TODO: Evan: Test if this is correct somehow
        if([[UIDevice currentDevice]userInterfaceIdiom]==UIUserInterfaceIdiomPhone) {
          int screenHeight = [[UIScreen mainScreen] nativeBounds].size.height;
          //          if (screenHeight >= 2436 && ![self.configuration isKindOfClass:ARFaceTrackingConfiguration.class] ) {
          if (screenHeight >= 2436) {
            resolution = CGSizeMake(1920, 1080);
          }
        }
      }
    }
  }
  
  return resolution;
}



- (void)_maybeSetupCameraTextureWithWidth:(int)width height:(int)height
{
  if (_arCamProgram) {
    return;
  }
  //    CGSize resolution = ((ARConfiguration *)[self.configuration class]).videoFormat.imageResolution;
  
  // Save previous GL state
  GLint prevBuffer, prevActiveTexture, prevTextureBinding, prevFramebuffer, prevProgram;
  glGetIntegerv(GL_ARRAY_BUFFER_BINDING, &prevBuffer);
  glGetIntegerv(GL_FRAMEBUFFER_BINDING, &prevFramebuffer);
  glGetIntegerv(GL_ACTIVE_TEXTURE, &prevActiveTexture);
  glGetIntegerv(GL_TEXTURE_BINDING_2D, &prevTextureBinding);
  glGetIntegerv(GL_CURRENT_PROGRAM, &prevProgram);
  
  CVReturn err = CVOpenGLESTextureCacheCreate(kCFAllocatorDefault, NULL, _glView.glContext.eaglCtx, NULL, &_arCamCache);
  if (err) {
    NSLog(@"EXARSessionManager: Error from CVOpenGLESTextureCacheCreate(...): %d", err);
  }
  _arCamYTex = NULL;
  _arCamCbCrTex = NULL;
  
  // Compile camera texture vertex and fragment shader
  GLuint camVert = glCreateShader(GL_VERTEX_SHADER);
  const char *camVertSrc = STRINGIZE
  (
   precision highp float;
   
   attribute vec2 position;
   varying vec2 vUv;
   uniform mat4 transformMatrix;
   uniform float zoomRatio;
   uniform bool needsCorrection;
   
   const vec2 scale = vec2(0.5,0.5);
   void main() {
     vUv = position;
     gl_Position = transformMatrix * vec4(1.0 - 2.0 * position, 0.0, 1.0);
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
   uniform bool isPortrait;
   uniform float aspectRatio;
   varying vec2 vUv;
   
   void main() {
     vec2 textureCoordinate;
     
     if(isPortrait){
       textureCoordinate = vec2(vUv.s, 1.0 - vUv.t);
     }else{
       textureCoordinate = vec2(1.0 - vUv.s,vUv.t);
     }
     
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
  glBufferData(GL_ARRAY_BUFFER, sizeof(imagePlaneVerts), imagePlaneVerts, GL_DYNAMIC_DRAW);
  
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
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, NULL);
  glGenFramebuffers(1, &_arCamOutputFramebuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, _arCamOutputFramebuffer);
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, _arCamOutputTexture, 0);
  
  // Create camera texture output EXGLObject
  UEXGLContextMapObject(_glView.exglCtxId, _arCamOutputEXGLObj, _arCamOutputTexture);
  
  // Restore previous GL state
  glBindBuffer(GL_ARRAY_BUFFER, prevBuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, prevFramebuffer);
  glActiveTexture(prevActiveTexture);
  glBindTexture(GL_TEXTURE_2D, prevTextureBinding);
  glUseProgram(prevProgram);
}

- (void)stop
{
  if (self.session) {
    self.session = nil;
    glDeleteProgram(_arCamProgram);
    glDeleteBuffers(1, &_arCamBuffer);
    glDeleteTextures(1, &_arCamOutputTexture);
    glDeleteFramebuffers(1, &_arCamOutputFramebuffer);
    UEXGLContextDestroyObject(_glView.exglCtxId, _arCamOutputTexture);
  }
}

- (void)pause
{
  [self.session pause];
}

- (void)resume
{
  [self.session runWithConfiguration:self.configuration];
}

- (void)reset
{
  if (@available(iOS 11.0, *)) {
    if (ARWorldTrackingConfiguration.isSupported) {
      [self.session runWithConfiguration:self.configuration options:ARSessionRunOptionResetTracking | ARSessionRunOptionRemoveExistingAnchors];
    }
  }
}

- (ARPlaneDetection)planeDetection {
  if (self.configuration && [self.configuration isKindOfClass:ARWorldTrackingConfiguration.class]) {
    ARWorldTrackingConfiguration *configuration = (ARWorldTrackingConfiguration *) self.configuration;
    return configuration.planeDetection;
  }
  return ARPlaneDetectionNone;
}

- (void)setPlaneDetection:(ARPlaneDetection)planeDetection {
  if (self.configuration && [self.configuration isKindOfClass:ARWorldTrackingConfiguration.class]) {
    ARWorldTrackingConfiguration *configuration = (ARWorldTrackingConfiguration *) self.configuration;
    [configuration setPlaneDetection:planeDetection];
    [self _reload];
  }
}

- (ARWorldAlignment)worldAlignment
{
  return self.configuration.worldAlignment;
}

- (void)setWorldAlignment:(ARWorldAlignment)worldAlignment
{
  [self.configuration setWorldAlignment:worldAlignment];
  [self _reload];
}

- (BOOL)lightEstimationEnabled
{
  return self.configuration.lightEstimationEnabled;
}

- (void)setLightEstimationEnabled:(BOOL)lightEstimationEnabled {
  [self.configuration setLightEstimationEnabled:lightEstimationEnabled];
  [self _reload];
}

- (BOOL)providesAudioData
{
  return self.configuration.providesAudioData;
}

- (void)setProvidesAudioData:(BOOL)providesAudioData
{
  [self.configuration setProvidesAudioData:providesAudioData];
  [self _reload];
}

- (BOOL)autoFocusEnabled
{
  if (@available(iOS 11.3, *)) {
    if ([self.configuration isKindOfClass:ARWorldTrackingConfiguration.class]) {
      BOOL vl = ((ARWorldTrackingConfiguration *)self.configuration).isAutoFocusEnabled;
      return vl;
    }
  }
  return false;
}

- (void)setAutoFocusEnabled:(BOOL)autoFocusEnabled
{
  if (@available(iOS 11.3, *)) {
    if ([self.configuration isKindOfClass:ARWorldTrackingConfiguration.class]) {
      [((ARWorldTrackingConfiguration *)self.configuration) setAutoFocusEnabled:autoFocusEnabled];
      [self _reload];
    }
  }
}

- (void)setVideoFormat:(ARVideoFormat *)videoFormat
{
  if (@available(iOS 11.3, *)) {
    [self.configuration setVideoFormat:videoFormat];
    //TODO: Evan: resize texture to match resolution.
    [self _reload];
  }
}

//TODO: Evan: Will this crash on older OS'?
- (ARVideoFormat *)videoFormat
{
  return self.configuration.videoFormat;
}

// This API is wack
- (void)setWorldOrigin:(matrix_float4x4)worldOrigin
{
  if (@available(iOS 11.3, *)) {
    [self.session setWorldOrigin:worldOrigin];
  }
}

- (int)cameraTexture
{
  return _arCamOutputEXGLObj;
}

- (void)setDetectionImages:(NSMutableArray *)images
{
  if (!self.session) {
    return;
  }
  if (@available(iOS 11.3, *)) {
    NSMutableSet<ARReferenceImage *> *referenceImages = [NSMutableSet new];
    for (NSDictionary *imageInfo in images) {
      UIImage *image = imageInfo[@"image"];
      CGFloat width = [imageInfo[@"width"] doubleValue];
      struct CGImage *cgImage = image.CGImage;
      CGImagePropertyOrientation orientation;
      switch (image.imageOrientation) {
        case UIImageOrientationUp:
          orientation = kCGImagePropertyOrientationUp;
          break;
        case UIImageOrientationDown:
          orientation = kCGImagePropertyOrientationDown;
          break;
        case UIImageOrientationLeft:
          orientation = kCGImagePropertyOrientationLeft;
          break;
        case UIImageOrientationRight:
          orientation = kCGImagePropertyOrientationRight;
          break;
        case UIImageOrientationUpMirrored:
          orientation = kCGImagePropertyOrientationUpMirrored;
          break;
        case UIImageOrientationDownMirrored:
          orientation = kCGImagePropertyOrientationDownMirrored;
          break;
        case UIImageOrientationLeftMirrored:
          orientation = kCGImagePropertyOrientationLeftMirrored;
          break;
        case UIImageOrientationRightMirrored:
          orientation = kCGImagePropertyOrientationRightMirrored;
          break;
        default:
          break;
      }
      //TODO: Evan: Add FileSystem permission guards.
      ARReferenceImage *referenceImage = [[ARReferenceImage alloc]
                                          initWithCGImage:cgImage
                                          orientation:orientation
                                          physicalWidth: width
                                          ];
      referenceImage.name = imageInfo[@"name"];
      [referenceImages addObject:referenceImage];
    }
    
    if ([self.configuration isKindOfClass:ARWorldTrackingConfiguration.class]) {
      ((ARWorldTrackingConfiguration *)self.configuration).detectionImages = referenceImages;
    }
  }
}

- (NSDictionary *)arMatricesWithZNear:(CGFloat)zNear zFar:(CGFloat)zFar
{
  if (!self.session) {
    return nil;
  }
  
  matrix_float4x4 viewMat = [self.session.currentFrame.camera viewMatrixForOrientation:_interfaceOrientation];
  matrix_float4x4 projMat = [self.session.currentFrame.camera projectionMatrixForOrientation:_interfaceOrientation viewportSize:_viewportSize zNear:zNear zFar:zFar];
  return @{
           @"viewMatrix": [[EXARModule class] encodeMatrixFloat4x4:viewMat],
           @"projectionMatrix": [[EXARModule class] encodeMatrixFloat4x4:projMat],
           };
}

- (nullable NSError *)startConfiguration:(NSString *)configuration
{
  if (!self.session) {
    return nil;
  }
  self.configuration = [self _configurationFromString: configuration];
  if (!self.configuration) {
    
    NSLog(@"Error: %@ is not a valid configuration or is not enabled on this device.", configuration);
    
    NSDictionary *userInfo = @{
                               NSLocalizedDescriptionKey: NSLocalizedString(@"Couldn't set ARConfiguration to: %@", configuration),
                               NSLocalizedFailureReasonErrorKey: NSLocalizedString(@"The supplied configuration is not a valid ARConfiguration class: %@", configuration),
                               NSLocalizedRecoverySuggestionErrorKey: NSLocalizedString(@"Please supply one of the following: ARWorldTrackingConfiguration, AROrientationTrackingConfiguration", nil)
                               };
    
    return [NSError errorWithDomain:@"EXARConfiguration" code:0 userInfo: userInfo];
  }
  [self.session runWithConfiguration:self.configuration];
  return nil;
}

- (NSArray *)performHitTest:(CGPoint)point types:(ARHitTestResultType)types
{
  if (!self.session) {
    return nil;
  }
  
  if (@available(iOS 11.0, *)) {
    CGPoint adjustedPoint = CGPointApplyAffineTransform(point, CGAffineTransformInvert(_viewportTransform));
    NSArray<ARHitTestResult *> *results = [self.session.currentFrame hitTest:adjustedPoint types:types];
    
    return [self serializeHitResults:results];
  } else {
    return @[];
  }
}

- (NSArray<NSDictionary *> *)serializeHitResults:(NSArray<ARHitTestResult *> *)hitResults
{
  NSMutableArray *results = [NSMutableArray array];
  for (ARHitTestResult *result in hitResults) {
    [results addObject:@{
                         // common with Android
                         @"anchor": [[EXARModule class] encodeARAnchor:result.anchor props:@{}],
                         @"distance": [NSNumber numberWithFloat:result.distance],
                         @"transform": [[EXARModule class] encodeMatrixFloat4x4:result.worldTransform],
                         
                         // iOS-specific
                         @"type": [NSNumber numberWithInt:result.type],
                         @"localTransform": [[EXARModule class] encodeMatrixFloat4x4:result.localTransform],
                         @"worldTransform": [[EXARModule class] encodeMatrixFloat4x4:result.worldTransform],
                         }];
  }
  return results;
}

#pragma mark - Private Methods

- (void)_reload
{
  [self.session runWithConfiguration:self.configuration];
}

- (ARConfiguration *)_configurationFromString:(NSString *)configuration
{
  Class trackingConfigurationClass = NSClassFromString(configuration);
  return [trackingConfigurationClass new];
}

#pragma mark - Serialize Data

- (NSDictionary *)_arLightEstimation
{
  if (!self.session) {
    return nil;
  }
  
  if (@available(iOS 11.0, *)) {
    ARLightEstimate *arLightEstimation = self.session.currentFrame.lightEstimate;
    NSDictionary *lightOutput = @{
                                  @"ambientIntensity": [NSNumber numberWithFloat:arLightEstimation.ambientIntensity],
                                  @"ambientColorTemperature": [NSNumber numberWithFloat:arLightEstimation.ambientColorTemperature]
                                  };
    
    NSMutableDictionary *output = [NSMutableDictionary dictionaryWithDictionary:lightOutput];
    
    //    if ([arLightEstimation isKindOfClass:[ARDirectionalLightEstimate class]]) {
    //      ARDirectionalLightEstimate *arDirectionalLightEstimate = (ARDirectionalLightEstimate *)arLightEstimation;
    //      NSDictionary *directionalOutput = @{
    //                                          @"primaryLightDirection": @{
    //                                              @"x": @(arDirectionalLightEstimate.primaryLightDirection[0]),
    //                                              @"y": @(arDirectionalLightEstimate.primaryLightDirection[1]),
    //                                              @"z": @(arDirectionalLightEstimate.primaryLightDirection[2]),
    //                                              },
    //                                          @"primaryLightIntensity": [NSNumber numberWithFloat:arDirectionalLightEstimate.primaryLightIntensity],
    //                                          };
    //      [output addEntriesFromDictionary:directionalOutput];
    //    }
    return output;
  } else {
    return nil;
  }
}

- (NSArray *)_rawFeaturePoints
{
  if (!self.session) {
    return nil;
  }
  
  if (@available(iOS 11.0, *)) {
    ARPointCloud *rawFeaturePoints = self.session.currentFrame.rawFeaturePoints;
    
    NSMutableArray *featurePoints = [NSMutableArray array];
    for (int i = 0; i < rawFeaturePoints.count; i++) {
      vector_float3 point = rawFeaturePoints.points[i];
      
      [featurePoints addObject:@{
                                 @"x": @(point[0]),
                                 @"y": @(point[1]),
                                 @"z": @(point[2]),
                                 @"id": @(rawFeaturePoints.identifiers[i]),
                                 }];
    }
    
    return featurePoints;
  } else {
    return nil;
  }
}

//- (NSString *)_depthDataQuality
//{
//  switch (self.session.currentFrame.capturedDepthData.depthDataQuality) {
//    case AVDepthDataQualityLow:
//      return @"AVDepthDataQualityLow";
//    case AVDepthDataQualityHigh:
//      return @"AVDepthDataQualityHigh";
//    default:
//      return @"";
//  }
//}

//- (NSString *)_depthDataAccuracy
//{
//  switch (self.session.currentFrame.capturedDepthData.depthDataAccuracy) {
//    case AVDepthDataAccuracyAbsolute:
//      return @"AVDepthDataAccuracyAbsolute";
//    case AVDepthDataAccuracyRelative:
//      return @"AVDepthDataAccuracyRelative";
//    default:
//      return @"";
//  }
//}

//- (NSDictionary *)_cameraCalibrationData
//{
//  if (@available(iOS 11.0, *)) {
//    AVCameraCalibrationData *cameraCalibrationData = self.session.currentFrame.capturedDepthData.cameraCalibrationData;
//
//    if (cameraCalibrationData) {
//      return @{
//               @"intrinsicMatrix": [[EXAR class] encodeMatrixFloat3x3:cameraCalibrationData.intrinsicMatrix],
//               @"intrinsicMatrixReferenceDimensions": [EXARSessionManager nsDictionaryForSize:cameraCalibrationData.intrinsicMatrixReferenceDimensions],
//               @"extrinsicMatrix": [[EXAR class] encodeMatrixFloat4x3:cameraCalibrationData.extrinsicMatrix],
//               @"pixelSize": [NSNumber numberWithFloat:cameraCalibrationData.pixelSize],
//               @"lensDistortionLookupTable": cameraCalibrationData.lensDistortionLookupTable,
//               @"inverseLensDistortionLookupTable": cameraCalibrationData.inverseLensDistortionLookupTable,
//               @"lensDistortionCenter": [EXARSessionManager nsDictionaryForPoint:cameraCalibrationData.lensDistortionCenter]
//               };
//    }
//  }
//
//  return @{};
//}

- (NSDictionary *)_capturedDepthData
{
  if (@available(iOS 11.0, *)) {
    return @{};
    //    AVDepthData *capturedDepthData = self.session.currentFrame.capturedDepthData;
    //    return @{
    //             @"timestamp": [NSNumber numberWithDouble: self.session.currentFrame.capturedDepthDataTimestamp],
    //             @"depthDataQuality": [self _depthDataQuality],
    //             @"depthDataAccuracy": [self _depthDataAccuracy],
    //             @"depthDataFiltered": @(capturedDepthData.depthDataFiltered),
    //             @"cameraCalibrationData": [self _cameraCalibrationData]
    //             };
  } else {
    return @{};
  }
}

- (NSDictionary *)getCurrentFrameWithAttributes:(NSDictionary *)attributes
{
  if (!self.session) {
    return nil;
  }
  NSMutableDictionary *output = [NSMutableDictionary new];
  
  if (@available(iOS 11.0, *)) {
    
    ARFrame *frame = self.session.currentFrame;
    
    [output setValue: [NSNumber numberWithDouble: frame.timestamp] forKey:@"timestamp"];
    
    if (attributes[@"anchors"] != nil) {
      id props = attributes[@"anchors"];
      NSArray *anchors = [[EXARModule class] encodeARAnchors:self.session.currentFrame.anchors props:props];
      [output setValue:anchors forKey:@"anchors"];
    }
    if (attributes[@"rawFeaturePoints"] != nil) {
      [output setValue:[self _rawFeaturePoints] forKey:@"rawFeaturePoints"];
    }
    if (attributes[@"lightEstimation"] != nil) {
      [output setValue:[self _arLightEstimation] forKey:@"lightEstimation"];
    }
    if (attributes[@"capturedDepthData"] != nil) {
      [output setValue:[self _capturedDepthData] forKey:@"capturedDepthData"];
    }
  }
  return output;
}

#pragma mark - Rendering

- (void)_updateWithFrame:(ARFrame *)frame
{
  if (!self.session) {
    return;
  }
  
  _interfaceOrientation = [UIApplication sharedApplication].statusBarOrientation;
  
  _viewportSize = _glView.frame.size;
  
  [_glView.glContext runAsync:^{
    
    CVPixelBufferRef camPixelBuffer = frame.capturedImage;
    if(!camPixelBuffer){
      return;
    }
    int width = (int)CVPixelBufferGetWidth(camPixelBuffer);
    int height = (int)CVPixelBufferGetHeight(camPixelBuffer);
    
    // Save previous GL state
    GLint prevBuffer, prevActiveTexture, prevTextureBinding, prevFramebuffer, prevProgram;
    GLint prevViewport[4];
    glGetIntegerv(GL_ARRAY_BUFFER_BINDING, &prevBuffer);
    glGetIntegerv(GL_FRAMEBUFFER_BINDING, &prevFramebuffer);
    glGetIntegerv(GL_ACTIVE_TEXTURE, &prevActiveTexture);
    glGetIntegerv(GL_TEXTURE_BINDING_2D, &prevTextureBinding);
    glGetIntegerv(GL_CURRENT_PROGRAM, &prevProgram);
    glGetIntegerv(GL_VIEWPORT, prevViewport);
    
    glBindFramebuffer(GL_FRAMEBUFFER, self->_arCamOutputFramebuffer);
    
    
    glViewport(0, 0, width, height);
    
    glUseProgram(self->_arCamProgram);
    glEnableVertexAttribArray(self->_arCamPositionAttrib);
    glBindBuffer(GL_ARRAY_BUFFER, self->_arCamBuffer);
    glVertexAttribPointer(self->_arCamPositionAttrib, 2, GL_FLOAT, GL_FALSE, 0, 0);
    
    if (CVPixelBufferGetPlaneCount(camPixelBuffer) >= 2 && CVPixelBufferGetPixelFormatType(camPixelBuffer) == kCVPixelFormatType_420YpCbCr8BiPlanarFullRange) {
      [self _renderCameraImage:camPixelBuffer width:width height:height];
    }
    
    glDrawArrays(GL_TRIANGLES, 0, 3);
    
    // Flush texture cache on frame end
    CVOpenGLESTextureCacheFlush(self->_arCamCache, 0);
    
    // Restore previous GL state
    glBindBuffer(GL_ARRAY_BUFFER, prevBuffer);
    glBindFramebuffer(GL_FRAMEBUFFER, prevFramebuffer);
    glActiveTexture(prevActiveTexture);
    glBindTexture(GL_TEXTURE_2D, prevTextureBinding);
    glUseProgram(prevProgram);
    glViewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
  }];
}

- (void)_renderCameraImage:(CVPixelBufferRef)camPixelBuffer width:(int)width height:(int)height
{
  CFRetain(camPixelBuffer);
  CVPixelBufferLockBaseAddress(camPixelBuffer, 0);
  
  // Release old texture data
  CVBufferRelease(_arCamYTex);
  CVBufferRelease(_arCamCbCrTex);
  
  // Rotate the texture with the interface orientation
  _viewportTransform = [self.session.currentFrame
                        displayTransformForOrientation:_interfaceOrientation
                        viewportSize:_viewportSize];
  
  // TODO: Evan: Probably a better way to remove the translation and convert to matrix4x4
  
  CGFloat scaleX = sqrt(_viewportTransform.a * _viewportTransform.a + _viewportTransform.c * _viewportTransform.c);
  CGFloat scaleY = sqrt(_viewportTransform.b * _viewportTransform.b + _viewportTransform.d * _viewportTransform.d);
  CGFloat rotation = atan2(_viewportTransform.b, _viewportTransform.a);
  GLKMatrix4 scaled = GLKMatrix4MakeScale(scaleX, scaleY, 1);
  GLKMatrix4 rotate = GLKMatrix4Rotate(scaled, rotation, 0, 0, 1);
  
  glUniformMatrix4fv(glGetUniformLocation(_arCamProgram, "transformMatrix"), 1, GL_FALSE, rotate.m);
  
  BOOL isPortrait = UIInterfaceOrientationIsPortrait(_interfaceOrientation);
  glUniform1i(glGetUniformLocation(_arCamProgram, "isPortrait"), isPortrait);
  
  _arCamYTex = [self _createTextureWithPixelBuffer:camPixelBuffer
                                        planeIndex:0
                                            format:GL_LUMINANCE
                                             width:width
                                            height:height];
  
  _arCamCbCrTex = [self _createTextureWithPixelBuffer:camPixelBuffer
                                           planeIndex:1
                                               format:GL_LUMINANCE_ALPHA
                                                width:width / 2
                                               height:height / 2];
  
  // Setup texture wrap + filtering for YTex
  glBindTexture(CVOpenGLESTextureGetTarget(_arCamYTex), CVOpenGLESTextureGetName(_arCamYTex));
  glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
  glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glBindTexture(CVOpenGLESTextureGetTarget(_arCamYTex), 0);
  
  // Setup texture wrap + filtering for CbCr
  glBindTexture(CVOpenGLESTextureGetTarget(_arCamCbCrTex), CVOpenGLESTextureGetName(_arCamCbCrTex));
  glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
  glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glBindTexture(CVOpenGLESTextureGetTarget(_arCamCbCrTex), 0);
  
  // Bind Textures
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(CVOpenGLESTextureGetTarget(_arCamYTex), CVOpenGLESTextureGetName(_arCamYTex));
  glUniform1i(glGetUniformLocation(_arCamProgram, "yMap"), 0);
  
  glActiveTexture(GL_TEXTURE1);
  glBindTexture(CVOpenGLESTextureGetTarget(_arCamCbCrTex), CVOpenGLESTextureGetName(_arCamCbCrTex));
  glUniform1i(glGetUniformLocation(_arCamProgram, "uvMap"), 1);
  
  // Release the pixel buffer from memory
  CVPixelBufferUnlockBaseAddress(camPixelBuffer, 0);
  CFRelease(camPixelBuffer);
}

- (CVOpenGLESTextureRef)_createTextureWithPixelBuffer:(CVPixelBufferRef)pixelBuffer
                                           planeIndex:(int)planeIndex
                                               format:(GLenum)format
                                                width:(int)width
                                               height:(int)height
{
  CVOpenGLESTextureRef texture = NULL;
  
  CVReturn error = noErr;
  error = CVOpenGLESTextureCacheCreateTextureFromImage(kCFAllocatorDefault,
                                                       _arCamCache,
                                                       pixelBuffer,
                                                       NULL,
                                                       GL_TEXTURE_2D,
                                                       format,
                                                       width,
                                                       height,
                                                       format,
                                                       GL_UNSIGNED_BYTE,
                                                       planeIndex,
                                                       &texture);
  
  if (error != kCVReturnSuccess) {
    CVBufferRelease(texture);
    texture = nil;
    NSLog(@"EXARSessionManager: Error creating texture from pixel buffer. CVOpenGLESTextureCacheCreateTextureFromImage %d", error);
  }
  
  return texture;
}

#pragma mark - ARSessionDelegate

- (void)_updateAnchors:(NSArray<ARAnchor *> *)anchors eventType:(NSString *)eventType
{
  NSDictionary *event = @{
                          @"eventType": eventType,
                          @"anchors": [[EXARModule class] encodeARAnchors:anchors props:@{}]
                          };
  
  [_delegate didUpdateWithEvent:EXAREventNameAnchorsDidUpdate payload:event];
}

- (void)session:(ARSession *)session didAddAnchors:(NSArray<ARAnchor *> *)anchors
{
  [self _updateAnchors:anchors eventType:@"add"];
}

- (void)session:(ARSession *)session didUpdateAnchors:(NSArray<ARAnchor *> *)anchors
{
  [self _updateAnchors:anchors eventType:@"update"];
}

- (void)session:(ARSession *)session didRemoveAnchors:(NSArray<ARAnchor *> *)anchors
{
  [self _updateAnchors:anchors eventType:@"remove"];
}

- (void)session:(ARSession *)session didFailWithError:(NSError *)error
{
  [_delegate didUpdateWithEvent:EXAREventNameDidFailWithError payload:error];
}

- (void)session:(ARSession *)session didUpdateFrame:(ARFrame *)frame
{
  //  [_delegate didUpdateWithEvent:@"FRAME_DID_UPDATE" payload:@{}];
  
  [self _updateWithFrame: frame];
}

- (void)session:(ARSession *)session cameraDidChangeTrackingState:(ARCamera *)camera
{
  NSArray *trackingStates = @[
                              @"ARTrackingStateNotAvailable",
                              @"ARTrackingStateLimited",
                              @"ARTrackingStateNormal"
                              ];
  NSArray *trackingStateReasons = @[
                                    @"ARTrackingStateReasonNone",
                                    @"ARTrackingStateReasonInitializing",
                                    @"ARTrackingStateReasonExcessiveMotion",
                                    @"ARTrackingStateReasonInsufficientFeatures",
                                    @"ARTrackingStateReasonRelocalizing"
                                    ];
  [_delegate didUpdateWithEvent:EXAREventNameDidChangeTrackingState payload:@{
                                                                              @"trackingState": trackingStates[camera.trackingState],
                                                                              @"trackingStateReason": trackingStateReasons[camera.trackingStateReason]
                                                                              }];
}

- (void)sessionWasInterrupted:(ARSession *)session
{
  [_delegate didUpdateWithEvent:EXAREventNameSessionWasInterrupted payload:@{}];
}

- (void)sessionInterruptionEnded:(ARSession *)session
{
  [_delegate didUpdateWithEvent:EXAREventNameSessionInterruptionEnded payload:@{}];
}

- (BOOL)sessionShouldAttemptRelocalization:(ARSession *)session
API_AVAILABLE(ios(11.0)){
  return _shouldAttemptRelocalization;
}

//- (void)session:(ARSession *)session didOutputAudioSampleBuffer:(CMSampleBufferRef)audioSampleBuffer

@end

