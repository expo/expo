#import "ABI29_0_0EXGLARSessionManager.h"
#include <OpenGLES/ES2/gl.h>
#include <OpenGLES/ES2/glext.h>
#import <EXGL-CPP/UEXGL.h>

#define STRINGIZE(x) #x

@implementation ABI29_0_0RCTConvert (ARPlaneDetection)

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 110300
ABI29_0_0RCT_ENUM_CONVERTER(ARPlaneDetection, (@{
                                        @"none": @(ARPlaneDetectionNone),
                                        @"horizontal": @(ARPlaneDetectionHorizontal),
                                        @"vertical": @(ARPlaneDetectionVertical),
                                        }), ARPlaneDetectionNone, integerValue);
#else
ABI29_0_0RCT_ENUM_CONVERTER(ARPlaneDetection, (@{
                                        @"none": @(ARPlaneDetectionNone),
                                        @"horizontal": @(ARPlaneDetectionHorizontal),
                                        }), ARPlaneDetectionNone, integerValue);
#endif

@end

@implementation ABI29_0_0RCTConvert (ARHitTestResultType)

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 110300
ABI29_0_0RCT_ENUM_CONVERTER(ARHitTestResultType, (@{
                                           @"featurePoint": @(ARHitTestResultTypeFeaturePoint),
                                           @"horizontalPlane": @(ARHitTestResultTypeEstimatedHorizontalPlane),
                                           @"existingPlane": @(ARHitTestResultTypeExistingPlane),
                                           @"existingPlaneUsingExtent": @(ARHitTestResultTypeExistingPlaneUsingExtent),
                                           @"verticalPlane": @(ARHitTestResultTypeEstimatedVerticalPlane),
                                           @"existingPlaneUsingGeometry": @(ARHitTestResultTypeExistingPlaneUsingGeometry),
                                           }), ARHitTestResultTypeFeaturePoint, integerValue);
#else
ABI29_0_0RCT_ENUM_CONVERTER(ARHitTestResultType, (@{
                                           @"featurePoint": @(ARHitTestResultTypeFeaturePoint),
                                           @"horizontalPlane": @(ARHitTestResultTypeEstimatedHorizontalPlane),
                                           @"existingPlane": @(ARHitTestResultTypeExistingPlane),
                                           @"existingPlaneUsingExtent": @(ARHitTestResultTypeExistingPlaneUsingExtent),
                                           }), ARHitTestResultTypeFeaturePoint, integerValue);
#endif
@end

@implementation ABI29_0_0RCTConvert (ARWorldAlignment)

ABI29_0_0RCT_ENUM_CONVERTER(ARWorldAlignment, (@{
                                        @"gravity": @(ARWorldAlignmentGravity),
                                        @"gravityAndHeading": @(ARWorldAlignmentGravityAndHeading),
                                        @"alignmentCamera": @(ARWorldAlignmentCamera),
                                        }), ARWorldAlignmentGravity, integerValue);

@end




@interface ABI29_0_0EXGLARSessionManager () <ARSessionObserver, ARSessionDelegate>
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

@property (nonatomic, weak) ABI29_0_0EXGLView *glView;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"

@property (atomic, strong) ARSession *session;
@property (atomic, strong) ARConfiguration *configuration;
#pragma clang diagnostic pop

@end

@implementation ABI29_0_0EXGLARSessionManager

static GLfloat imagePlaneVerts[6] = { -2.0f, 0.0f, 0.0f, -2.0f, 2.0f, 2.0f };

#pragma mark - Static Methods

+ (NSArray *)nsArrayForMatrix:(matrix_float4x4)mat
{
  const float *v = (const float *)&mat;
  return @[@(v[0]), @(v[1]), @(v[2]), @(v[3]),
           @(v[4]), @(v[5]), @(v[6]), @(v[7]),
           @(v[8]), @(v[9]), @(v[10]), @(v[11]),
           @(v[12]), @(v[13]), @(v[14]), @(v[15])];
}

+ (NSArray *)nsArrayForMatrix3x3:(matrix_float3x3)mat
{
  const float *v = (const float *)&mat;
  return @[@(v[0]), @(v[1]), @(v[2]),
           @(v[3]), @(v[4]), @(v[5]),
           @(v[6]), @(v[7]), @(v[8])];
}

+ (NSArray *)nsArrayForMatrix4x3:(matrix_float4x3)mat
{
  const float *v = (const float *)&mat;
  return @[@(v[0]), @(v[1]), @(v[2]), @(v[3]),
           @(v[4]), @(v[5]), @(v[6]), @(v[7]),
           @(v[8]), @(v[9]), @(v[10]), @(v[11])];
}

+ (NSDictionary *)nsDictionaryForPoint:(CGPoint)point
{
  return @{
           @"x": [NSNumber numberWithFloat: point.x],
           @"y": [NSNumber numberWithFloat: point.y]
           };
}

+ (NSDictionary *)nsDictionaryForVecFloat3:(vector_float3)vec
{
  return @{
           @"x": @(vec[0]),
           @"y": @(vec[1]),
           @"z": @(vec[2]),
           };
}

+ (NSDictionary *)nsDictionaryForVecFloat2:(vector_float2)vec
{
  return @{
           @"u": @(vec[0]),
           @"v": @(vec[1]),
           };
}

+ (NSDictionary *)nsDictionaryForSize:(CGSize)size
{
  return @{
           @"width": [NSNumber numberWithFloat: size.width],
           @"height": [NSNumber numberWithFloat: size.height]
           };
}

+ (NSDictionary *)nsDictionaryForAnchor:(id)anchor props:(NSDictionary *)props
{
  if (@available(iOS 11.0, *)) {
    if ([anchor isKindOfClass:[ARAnchor class]]) {
      ARAnchor *_anchor = (ARAnchor *)anchor;
      NSString *type = NSStringFromClass([anchor class]);
      NSDictionary *anchorData = @{
                                   @"type": type,
                                   @"transform": [ABI29_0_0EXGLARSessionManager nsArrayForMatrix:_anchor.transform],
                                   @"id": [NSString stringWithFormat:@"%@", _anchor.identifier],
                                   };
      NSMutableDictionary *output = [NSMutableDictionary dictionaryWithDictionary:anchorData];
      
      NSDictionary *anchorProps = @{};
      if (props) {
        id possibleAnchorProps = [props valueForKey:type];
        if (possibleAnchorProps && [possibleAnchorProps isKindOfClass:[NSDictionary class]]) {
          anchorProps = (NSDictionary *)possibleAnchorProps;
        }
      }
      
      if ([anchor isKindOfClass:[ARPlaneAnchor class]]) {
        ARPlaneAnchor *planeAnchor = (ARPlaneAnchor *)anchor;
        NSDictionary *planeData = [ABI29_0_0EXGLARSessionManager nsDictionaryForPlaneAnchor:planeAnchor];
        [output addEntriesFromDictionary:planeData];
      } else if (@available(iOS 11.3, *)) {
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 110300
        if ([anchor isKindOfClass:[ARImageAnchor class]]) {
          ARImageAnchor *imageAnchor = (ARImageAnchor *)anchor;
          NSDictionary *imageData = [ABI29_0_0EXGLARSessionManager nsDictionaryForImageAnchor:imageAnchor];
          [output addEntriesFromDictionary:imageData];
        } else {
          NSDictionary *data = [ABI29_0_0EXGLARSessionManager
                                nsDictionaryForUnknownAnchor:anchor
                                props: anchorProps];
          [output addEntriesFromDictionary:data];
        }
#endif
      } else {
        NSDictionary *data = [ABI29_0_0EXGLARSessionManager
                              nsDictionaryForUnknownAnchor:anchor
                              props: anchorProps];
        [output addEntriesFromDictionary:data];
      }
      return output;
    }
  }
  return @{};
}

+ (NSDictionary *)nsDictionaryForPlaneAnchor:(ARPlaneAnchor *)anchor
{
  vector_float3 extent = anchor.extent;
  vector_float3 center = anchor.center;
  
  return @{
           @"center": [ABI29_0_0EXGLARSessionManager nsDictionaryForVecFloat3:center],
           @"extent": @{
               @"width": @(extent[0]),
               @"length": @(extent[2])
               },
           };
}

+ (NSDictionary *)nsDictionaryForImageAnchor:(ARImageAnchor *)anchor
{
  return @{
           @"image": @{
               @"name": anchor.referenceImage.name,
               @"size": [ABI29_0_0EXGLARSessionManager nsDictionaryForSize: anchor.referenceImage.physicalSize],
               },
           };
}

+ (NSDictionary *)nsDictionaryForUnknownAnchor:(id)anchor props:(NSDictionary *) props
{
  
  NSMutableDictionary *output = [NSMutableDictionary new];
  
  if (@available(iOS 11.0, *)) {
    
    output[@"isTracked"] = @([anchor isTracked]);
    
    if (props == nil) {
      return output;
    }
    
    BOOL hasGeometry = [[props valueForKey:@"geometry"] boolValue];
    if (hasGeometry) {
      NSMutableArray *vertices = [NSMutableArray new];
      id geometry = [anchor geometry];
      for (int i = 0; i < [geometry vertexCount]; i++) {
        [vertices addObject:[ABI29_0_0EXGLARSessionManager nsDictionaryForVecFloat3:[geometry vertices][i]]];
      }
      
      NSMutableArray *textureCoordinates = [NSMutableArray new];
      for (int i = 0; i < [geometry triangleCount]; i++) {
        [textureCoordinates addObject:[ABI29_0_0EXGLARSessionManager nsDictionaryForVecFloat2:[geometry textureCoordinates][i]]];
      }
      
      NSMutableArray *triangleIndices = [NSMutableArray new];
      for (int i = 0; i < [geometry triangleCount] * 3; i++) {
        int16_t triangle = [geometry triangleIndices][i];
        [triangleIndices addObject: [NSNumber numberWithInt:triangle]];
      }
      
      [output setObject:@{
                        @"vertexCount": [NSNumber numberWithInteger:[geometry vertexCount]],
                        @"textureCoordinateCount": [NSNumber numberWithInteger:[geometry textureCoordinateCount]],
                        @"triangleCount": [NSNumber numberWithInteger:[geometry triangleCount]],
                        @"vertices": vertices,
                        @"textureCoordinates": textureCoordinates,
                        @"triangleIndices": triangleIndices,
                        } forKey:@"geometry"];
    }
    
    id blendShapes = [props valueForKey:@"blendShapes"];
    if (blendShapes) {
      NSDictionary *blendShapeValues;
      if ([blendShapes isKindOfClass:[NSArray class]]) {
        NSArray *attributes = (NSArray *)blendShapes;
        if (attributes.count > 0) {
          NSMutableDictionary *selectiveBlendShapeValues = [NSMutableDictionary new];
          for (NSString *blendShapeLocation in attributes) {
            [selectiveBlendShapeValues setObject:[anchor blendShapes][blendShapeLocation] forKey:blendShapeLocation];
          }
          blendShapeValues = [NSDictionary dictionaryWithDictionary:selectiveBlendShapeValues];
        } else {
          blendShapeValues = [anchor blendShapes];
        }
      } else {
        blendShapeValues = [anchor blendShapes];
      }
      [output setObject:blendShapeValues forKey:@"blendShapes"];
    }
  }
  
  return output;
}

+ (NSArray *)nsArrayForAnchors:(NSArray *)anchors props:(NSDictionary *)props
{
  NSMutableArray *output = [NSMutableArray new];
  
  if (@available(iOS 11.0, *)) {
    for (ARAnchor *anchor in anchors) {
      NSDictionary *anchorData = [ABI29_0_0EXGLARSessionManager nsDictionaryForAnchor:anchor props:props];
      [output addObject:anchorData];
    }
  }
  return output;
}

#pragma mark - Public Methods

- (NSDictionary *)startWithGLView:(ABI29_0_0EXGLView *)glView trackingConfiguration:(NSString *) trackingConfiguration
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
             @"error": @"Invalid ABI29_0_0ARTrackingConfiguration, ARKit may not be available on this device.",
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
    NSLog(@"ABI29_0_0EXGLARSessionManager: Error from CVOpenGLESTextureCacheCreate(...): %d", err);
  }
  _arCamYTex = NULL;
  _arCamCbCrTex = NULL;
  
  // Compile camera texture vertex and fragment shader
  GLuint camVert = glCreateShader(GL_VERTEX_SHADER);
  const char *camVertSrc = STRINGIZE
  (
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
  
  // Create camera texture output ABI29_0_0EXGLObject
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
  matrix_float4x4 transform = [self.session.currentFrame.camera transform];
  
  return @{
           @"transform": [ABI29_0_0EXGLARSessionManager nsArrayForMatrix:transform],
           @"viewMatrix": [ABI29_0_0EXGLARSessionManager nsArrayForMatrix:viewMat],
           @"projectionMatrix": [ABI29_0_0EXGLARSessionManager nsArrayForMatrix:projMat],
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
    
    return [NSError errorWithDomain:@"ABI29_0_0EXGLARConfiguration" code:0 userInfo: userInfo];
  }
  [self.session runWithConfiguration:self.configuration];
  return nil;
}

- (NSDictionary *)performHitTest:(CGPoint)point types:(ARHitTestResultType)types
{
  if (!self.session) {
    return nil;
  }
  NSMutableArray *hitTest = [NSMutableArray array];
  
  if (@available(iOS 11.0, *)) {
    CGPoint adjustedPoint = CGPointApplyAffineTransform(point, CGAffineTransformInvert(_viewportTransform));
    
    NSArray<ARHitTestResult *> *results = [self.session.currentFrame hitTest:adjustedPoint types:types];
    
    for (ARHitTestResult *result in results) {
      [hitTest addObject:@{
                           @"type": [NSNumber numberWithInt: result.type],
                           @"distance": [NSNumber numberWithFloat:result.distance],
                           @"localTransform": [ABI29_0_0EXGLARSessionManager nsArrayForMatrix:result.localTransform],
                           @"worldTransform": [ABI29_0_0EXGLARSessionManager nsArrayForMatrix:result.worldTransform],
                           @"anchor": [ABI29_0_0EXGLARSessionManager nsDictionaryForAnchor:result.anchor props:@{}]
                           }];
    }
  }
  return @{
           @"hitTest": hitTest
           };
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
//               @"intrinsicMatrix": [ABI29_0_0EXGLARSessionManager nsArrayForMatrix3x3:cameraCalibrationData.intrinsicMatrix],
//               @"intrinsicMatrixReferenceDimensions": [ABI29_0_0EXGLARSessionManager nsDictionaryForSize:cameraCalibrationData.intrinsicMatrixReferenceDimensions],
//               @"extrinsicMatrix": [ABI29_0_0EXGLARSessionManager nsArrayForMatrix4x3:cameraCalibrationData.extrinsicMatrix],
//               @"pixelSize": [NSNumber numberWithFloat:cameraCalibrationData.pixelSize],
//               @"lensDistortionLookupTable": cameraCalibrationData.lensDistortionLookupTable,
//               @"inverseLensDistortionLookupTable": cameraCalibrationData.inverseLensDistortionLookupTable,
//               @"lensDistortionCenter": [ABI29_0_0EXGLARSessionManager nsDictionaryForPoint:cameraCalibrationData.lensDistortionCenter]
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
      NSArray *anchors = [ABI29_0_0EXGLARSessionManager nsArrayForAnchors:self.session.currentFrame.anchors props:props];
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
    NSLog(@"ABI29_0_0EXGLARSessionManager: Error creating texture from pixel buffer. CVOpenGLESTextureCacheCreateTextureFromImage %d", error);
  }
  
  return texture;
}

#pragma mark - ARSessionDelegate

- (void)_updateAnchors:(NSArray<ARAnchor *> *)anchors eventType:(NSString *)eventType
{
  NSDictionary *event = @{
                          @"eventType": eventType,
                          @"anchors": [ABI29_0_0EXGLARSessionManager nsArrayForAnchors:anchors props:@{}]
                          };
  
  [_delegate didUpdateWithEvent:@"ANCHORS_DID_UPDATE" payload:event];
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
  [_delegate didUpdateWithEvent:@"DID_FAIL_WITH_ERROR" payload:ABI29_0_0RCTJSErrorFromNSError(error)];
}

- (void)session:(ARSession *)session didUpdateFrame:(ARFrame *)frame
{
  [_delegate didUpdateWithEvent:@"FRAME_DID_UPDATE" payload:@{}];
  
  [self _updateWithFrame: frame];
}

- (void)session:(ARSession *)session cameraDidChangeTrackingState:(ARCamera *)camera
{
  NSArray *trackingStates = @[
                              @"ABI29_0_0ARTrackingStateNotAvailable",
                              @"ABI29_0_0ARTrackingStateLimited",
                              @"ABI29_0_0ARTrackingStateNormal"
                              ];
  NSArray *trackingStateReasons = @[
                                    @"ABI29_0_0ARTrackingStateReasonNone",
                                    @"ABI29_0_0ARTrackingStateReasonInitializing",
                                    @"ABI29_0_0ARTrackingStateReasonExcessiveMotion",
                                    @"ABI29_0_0ARTrackingStateReasonInsufficientFeatures",
                                    @"ABI29_0_0ARTrackingStateReasonRelocalizing"
                                    ];
  [_delegate didUpdateWithEvent:@"CAMERA_DID_CHANGE_TRACKING_STATE" payload:@{
                                                                              @"trackingState": trackingStates[camera.trackingState],
                                                                              @"trackingStateReason": trackingStateReasons[camera.trackingStateReason]
                                                                              }];
}

- (void)sessionWasInterrupted:(ARSession *)session
{
  [_delegate didUpdateWithEvent:@"SESSION_WAS_INTERRUPTED" payload:@{}];
}

- (void)sessionInterruptionEnded:(ARSession *)session
{
  [_delegate didUpdateWithEvent:@"SESSION_INTERRUPTION_ENDED" payload:@{}];
}

- (BOOL)sessionShouldAttemptRelocalization:(ARSession *)session
{
  return _shouldAttemptRelocalization;
}

//- (void)session:(ARSession *)session didOutputAudioSampleBuffer:(CMSampleBufferRef)audioSampleBuffer

@end

