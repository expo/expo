// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXEventEmitterService.h>
#import <EXCore/EXUIManager.h>
#import <EXGL/EXGLView.h>
#import <EXFileSystemInterface/EXFileSystemInterface.h>

#import <EXAR/EXARModule.h>
#import <EXAR/EXARSessionManager.h>
#import <EXAR/EXARModule+Serialization.h>

NSString * const EXAREventNameAnchorsDidUpdate          = @"ExpoAR.anchorsDidUpdate";
NSString * const EXAREventNameFrameDidUpdate            = @"ExpoAR.frameDidUpdate";
NSString * const EXAREventNameDidChangeTrackingState    = @"ExpoAR.didChangeTrackingState";
NSString * const EXAREventNameDidFailWithError          = @"ExpoAR.didFailWithError";
NSString * const EXAREventNameSessionInterruptionEnded  = @"ExpoAR.sessionInterruptionEnded";
NSString * const EXAREventNameSessionWasInterrupted     = @"ExpoAR.sessionWasInterrupted";

@interface EXARModule () <EXARSessionManagerDelegate>

@property (nonatomic, strong) id arSessionManager;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<EXUIManager> uiManager;
@property (nonatomic, weak) id<EXFileSystemInterface> fileSystem;

@end

@implementation EXARModule

EX_EXPORT_MODULE(ExpoAR);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXUIManager)];
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("host.exp.exponent.AR", DISPATCH_QUEUE_SERIAL);
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)didUpdateWithEvent:(NSString *)name payload:(NSDictionary *)payload
{
  [_eventEmitter sendEventWithName:name body:payload];
}

- (NSDictionary<NSString *, NSString *> *)constantsToExport
{
  NSDictionary *constants = @{
                              @"isSupported": @(NO),
                              @"frameDidUpdate": EXAREventNameFrameDidUpdate,
                              @"anchorsDidUpdate": EXAREventNameAnchorsDidUpdate,
                              @"cameraDidChangeTrackingState": EXAREventNameDidChangeTrackingState,
                              @"didFailWithError": EXAREventNameDidFailWithError,
                              @"sessionWasInterrupted": EXAREventNameSessionWasInterrupted,
                              @"sessionInterruptionEnded": EXAREventNameSessionInterruptionEnded,
                              };
  
  NSMutableDictionary *output = [NSMutableDictionary dictionaryWithDictionary:constants];
  
  if (@available(iOS 11.0, *)) {
    [output addEntriesFromDictionary:@{
                                       @"isSupported": [ARSession class] ? @(YES) : @(NO),
                                       @"ARKitVersion": @"1.0",
                                       @"ARFaceTrackingConfiguration": @(NO),
                                       //[ARFaceTrackingConfiguration isSupported] ? @(YES) : @(NO),
                                       @"AROrientationTrackingConfiguration": [AROrientationTrackingConfiguration isSupported] ? @(YES) : @(NO),
                                       @"ARWorldTrackingConfiguration": [ARWorldTrackingConfiguration isSupported] ? @(YES) : @(NO),
                                       }];
  }
  
  if (@available(iOS 11.3, *)) {
    [output addEntriesFromDictionary:@{
                                       @"ARKitVersion": @"1.5",
                                       //                                       @"FaceTrackingVideoFormats": [EXAR serializeARVideoFormats:[ARFaceTrackingConfiguration supportedVideoFormats]],
                                       @"WorldTrackingVideoFormats": [[self class] encodeARVideoFormats:[ARWorldTrackingConfiguration supportedVideoFormats]],
                                       @"OrientationTrackingVideoFormats": [[self class] encodeARVideoFormats:[AROrientationTrackingConfiguration supportedVideoFormats]],
                                       }];
  }
  
  return output;
}

# pragma mark - EXEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           EXAREventNameAnchorsDidUpdate,
           EXAREventNameDidChangeTrackingState,
           EXAREventNameDidFailWithError,
           EXAREventNameFrameDidUpdate,
           EXAREventNameSessionInterruptionEnded,
           EXAREventNameSessionWasInterrupted,
           ];
}

- (void)startObserving {}
- (void)stopObserving {}

# pragma mark - Rest

- (BOOL)sessionNotExistOrReject:(EXPromiseRejectBlock)reject
{
  if (_arSessionManager == nil) {
    return true;
  }
  reject(@"E_SESSION", @"AR Session already exists", nil);
  return false;
}

- (BOOL)sessionExistsOrReject:(EXPromiseRejectBlock)reject
{
  if (_arSessionManager) {
    return true;
  }
  reject(@"E_NO_SESSION", @"AR Session is not initialized", nil);
  return false;
}

- (BOOL)V2OrReject:(EXPromiseRejectBlock)reject
{
  if (@available(iOS 11.3, *)) {
    return true;
  }
  reject(@"E_NOT_AVAILABLE", @"This device does not have ARKit V2+ (iOS 11.3+)", nil);
  return false;
}

- (BOOL)V3OrReject:(EXPromiseRejectBlock)reject
{
  if (@available(iOS 12.0, *)) {
    return true;
  }
  reject(@"E_NOT_AVAILABLE", @"This device does not have ARKit V3+ (iOS 12+)", nil);
  return false;
}


#pragma mark - Lifecycle methods

EX_EXPORT_METHOD_AS(startAsync,
                    startAsync:(nonnull NSNumber *)viewTag
                    trackingConfiguration:(NSString *)trackingConfiguration
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionNotExistOrReject:reject]) {
    return;
  }
  [_uiManager addUIBlock:^(id _view) {
    //TODO:Bacon: this prolly don't work
    UIView *view = (UIView *)_view;
    if (![view isKindOfClass:[EXGLView class]]) {
      reject(@"E_GLVIEW_MANAGER_BAD_VIEW_TAG", @"EXAR.startARSessionAsync: Expected an EXGLView", nil);
      return;
    }
    if (self->_arSessionManager) {
      [self->_arSessionManager stop];
      self->_arSessionManager = nil;
    }
    
    EXGLView *exglView = (EXGLView *)view;
    
    Class sessionManagerClass = NSClassFromString(@"EXARSessionManager");
    if (sessionManagerClass) {
      
      self->_arSessionManager = [[sessionManagerClass alloc] init];
      [self->_arSessionManager setDelegate:self];
      [exglView setArSessionManager:self->_arSessionManager];
      
      NSDictionary *response = [self->_arSessionManager startWithGLView:exglView trackingConfiguration:trackingConfiguration];
      if (response[@"error"]) {
        reject(@"ERR_ARKIT_FAILED_TO_INIT", response[@"error"], nil);
      } else {
        resolve(response);
      }
    } else {
      reject(@"ERR_ARKIT_FAILED_TO_INIT", @"ARKIT capabilities were not included with this build.", nil);
    }
    
  } forView:viewTag ofClass:[EXGLView class]];
}

EX_EXPORT_METHOD_AS(stopAsync,
                    stopAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  [_uiManager dispatchOnClientThread:^{
    if (self->_arSessionManager) {
      [self->_arSessionManager stop];
      self->_arSessionManager = nil;
    }
    resolve(nil);
  }];
}

EX_EXPORT_METHOD_AS(pauseAsync,
                    pauseAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  [_arSessionManager pause];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(resumeAsync,
                    resumeAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  [_arSessionManager resume];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(resetAsync,
                    resetAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  [_arSessionManager reset];
  resolve(nil);
}


#pragma mark - Configuration methods

EX_EXPORT_METHOD_AS(enableAudioDataAsync,
                    enableAudioDataAsync:(NSNumber *)providesAudioData
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  [_arSessionManager setProvidesAudioData:[providesAudioData boolValue]];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(isAudioDataEnabledAsync,
                    isAudioDataEnabledAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  resolve(@([_arSessionManager providesAudioData]));
}

EX_EXPORT_METHOD_AS(setLightEstimationEnabledAsync,
                    setLightEstimationEnabledAsync:(NSNumber *)lightEstimationEnabled
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  [_arSessionManager setLightEstimationEnabled:[lightEstimationEnabled boolValue]];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(isLightEstimationEnabledAsync,
                    isLightEstimationEnabledAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  resolve(@([_arSessionManager lightEstimationEnabled]));
}

EX_EXPORT_METHOD_AS(setAutoFocusEnabledAsync,
                    setAutoFocusEnabledAsync:(NSNumber *)isAutoFocusEnabled
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  [_arSessionManager setAutoFocusEnabled:[isAutoFocusEnabled boolValue]];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(isAutoFocusEnabledAsync,
                    isAutoFocusEnabledAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  if (![self V2OrReject:reject]) return;
  resolve(@([_arSessionManager autoFocusEnabled]));
}

EX_EXPORT_METHOD_AS(getPlaneDetectionAsync,
                    getPlaneDetectionAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  NSArray *items = @[@"none", @"horizontal", @"vertical"];
  resolve([items objectAtIndex:[_arSessionManager planeDetection]]);
}

EX_EXPORT_METHOD_AS(setPlaneDetectionAsync,
                    setPlaneDetectionAsync:(NSString *)planeDetection
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject] || ![self V2OrReject:reject]) {
    return;
  }
  [_arSessionManager setPlaneDetection:[[self class] decodeARPlaneDetection:planeDetection]];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setWorldAlignmentAsync,
                    setWorldAlignmentAsync:(NSString *)worldAlignment
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  if (![self V2OrReject:reject]) return;
  [_arSessionManager setWorldAlignment:[[self class] decodeARWorldAlignment:worldAlignment]];
  resolve(nil);
}


#pragma mark - Features methods

EX_EXPORT_METHOD_AS(getCurrentFrameAsync,
                    getCurrentFrameAsync:(NSDictionary *)attributes
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) {
    return;
  }
  resolve([_arSessionManager getCurrentFrameWithAttributes:attributes]);
}

EX_EXPORT_METHOD_AS(performHitTestAsync,
                    performHitTestAsync:(NSDictionary *)point
                    types:(NSArray<NSString *> *)types
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
API_AVAILABLE(ios(11.0))
{
  if (![self sessionExistsOrReject:reject] || ![self V2OrReject:reject]) {
    return;
  }
  CGPoint requestedPoint = CGPointMake([point[@"x"] doubleValue], [point[@"y"] doubleValue]);
  // TODO: bbarthec handle multiple types
  ARHitTestResultType requestedTypes = [[self class] decodeARHitTestResultType:types[0]];
  NSDictionary *result = [_arSessionManager performHitTest:requestedPoint types:requestedTypes];
  resolve(result);
}

EX_EXPORT_METHOD_AS(getWorldAlignmentAsync,
                    getWorldAlignmentAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  NSArray *items = @[@"gravity", @"gravityAndHeading", @"alignmentCamera"];
  resolve([items objectAtIndex:[_arSessionManager worldAlignment]]);
}

EX_EXPORT_METHOD_AS(getMatricesAsync,
                    getMatricesAsync:(nonnull NSNumber *)zNear
                    zFar:(nonnull NSNumber *)zFar
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  resolve([_arSessionManager arMatricesWithZNear:[zNear floatValue] zFar:[zFar floatValue]]);
}

EX_EXPORT_METHOD_AS(getVideoFormatAsync,
                    getVideoFormatAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  if (![self V2OrReject:reject]) return;
  ARVideoFormat *videoFormat = [_arSessionManager videoFormat];
  resolve([[self class] encodeARVideoFormat:videoFormat]);
}

EX_EXPORT_METHOD_AS(getCameraTextureAsync,
                    getCameraTextureAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  resolve(@([_arSessionManager cameraTexture]));
}

EX_EXPORT_METHOD_AS(setShouldAttemptRelocalizationAsync,
                    setShouldAttemptRelocalizationAsync:(NSNumber *)shouldAttemptRelocalization
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  [_arSessionManager setShouldAttemptRelocalization:[shouldAttemptRelocalization boolValue]];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setWorldOriginAsync,
                    setWorldOriginAsync:(NSArray *)worldOrigin
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  if (worldOrigin.count != 16) {
    reject(@"E_AR_WORLD_ORIGIN", @"setWorldOriginAsync requires an array of 16 numbers.", nil);
    return;
  }
  matrix_float4x4 origin = {
    [worldOrigin[0] floatValue],[worldOrigin[1] floatValue],[worldOrigin[2] floatValue],[worldOrigin[3] floatValue],
    [worldOrigin[4] floatValue],[worldOrigin[5] floatValue],[worldOrigin[6] floatValue],[worldOrigin[7] floatValue],
    [worldOrigin[8] floatValue],[worldOrigin[9] floatValue],[worldOrigin[10] floatValue],[worldOrigin[11] floatValue],
    [worldOrigin[12] floatValue],[worldOrigin[13] floatValue],[worldOrigin[14] floatValue],[worldOrigin[15] floatValue],
  };
  [_arSessionManager setWorldOrigin:origin];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setConfigurationAsync,
                    setConfigurationAsync:(NSString *)configuration
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  NSError *error = [_arSessionManager startConfiguration:configuration];
  if (error) {
    reject(@"E_GLVIEW_MANAGER_BAD_AR_CONFIGURATION", @"ARKIT encountered an error: not a valid ARConfiguration.", error);
  } else {
    resolve(nil);
  }
}

EX_EXPORT_METHOD_AS(setDetectionImagesAsync,
                    setDetectionImagesAsync:(NSDictionary *)images
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self sessionExistsOrReject:reject]) return;
  if (![self V2OrReject:reject]) return;
  //TODO:Bacon: Add FS
  NSMutableArray *parsedImages = [NSMutableArray new];
  
  for (NSDictionary *staticAsset in [images allValues]) {
    NSMutableDictionary *asset = [staticAsset mutableCopy];
    
    NSURL *url = [NSURL URLWithString:asset[@"uri"]];
    NSString *path = [url.path stringByStandardizingPath];
    
    UIImage *image = [[UIImage alloc] initWithContentsOfFile:path];
    if (image == nil) {
      reject(@"E_CANNOT_OPEN", @"Could not open provided image", nil);
      return;
    }
    [asset setValue:image forKey:@"image"];
    [parsedImages addObject: asset];
  }
  [_arSessionManager setDetectionImages:parsedImages];
  
  resolve(nil);
}

@end
