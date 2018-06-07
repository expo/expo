//
//  EXAR.m
//  Exponent
//
//  Created by Evan Bacon on 4/26/18.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import "EXAR.h"
#import "EXUnversioned.h"
#import "EXGLView.h"
#import <React/RCTUIManager.h>
#import "EXGLARSessionManager.h"

@interface EXAR () <EXGLARSessionManagerDelegate>

@property (nonatomic, strong) id arSessionManager;

@end

@implementation EXAR

RCT_EXPORT_MODULE(ExponentAR);

- (dispatch_queue_t)methodQueue
{
  return self.bridge.uiManager.methodQueue;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)didUpdateWithEvent:(NSString *)name payload:(NSDictionary *)payload
{
  if (self.bridge) {
    [self sendEventWithName:name body:payload];
  }
}

+ (NSDictionary *)serializeARVideoFormat:(ARVideoFormat *)videoFormat API_AVAILABLE(ios(11.3))
{
  return @{
           @"type": NSStringFromClass([videoFormat class]),
           @"imageResolution": @{
               @"width": @(videoFormat.imageResolution.width),
               @"height": @(videoFormat.imageResolution.height)
               },
           @"framesPerSecond": @(videoFormat.framesPerSecond)
           };
}

+ (NSMutableArray *)serializeARVideoFormats:(NSArray<ARVideoFormat *>*)videoFormats  API_AVAILABLE(ios(11.3))
{
  NSMutableArray *output = [NSMutableArray array];
  
  if (@available(iOS 11.3, *)) {
    for (ARVideoFormat *videoFormat in videoFormats) {
      [output addObject:[EXAR serializeARVideoFormat: videoFormat]];
    }
  }
  
  return output;
}

- (NSDictionary<NSString *, NSString *> *)constantsToExport
{
  NSDictionary *constants = @{
                              @"isSupported": @(NO),
                              @"frameDidUpdate": @"FRAME_DID_UPDATE",
                              @"anchorsDidUpdate": @"ANCHORS_DID_UPDATE",
                              @"cameraDidChangeTrackingState": @"CAMERA_DID_CHANGE_TRACKING_STATE",
                              @"didFailWithError": @"DID_FAIL_WITH_ERROR",
                              @"sessionWasInterrupted": @"SESSION_WAS_INTERRUPTED",
                              @"sessionInterruptionEnded": @"SESSION_INTERRUPTION_ENDED"
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
                                       @"WorldTrackingVideoFormats": [EXAR serializeARVideoFormats:[ARWorldTrackingConfiguration supportedVideoFormats]],
                                       @"OrientationTrackingVideoFormats": [EXAR serializeARVideoFormats:[AROrientationTrackingConfiguration supportedVideoFormats]],
                                       }];
  }
  
  return output;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"FRAME_DID_UPDATE",
           @"DID_FAIL_WITH_ERROR",
           @"ANCHORS_DID_UPDATE",
           @"CAMERA_DID_CHANGE_TRACKING_STATE",
           @"SESSION_WAS_INTERRUPTED",
           @"SESSION_INTERRUPTION_ENDED"
           ];
}

RCT_REMAP_METHOD(startAsync,
                 startAsyncWithReactTag:(nonnull NSNumber *)tag
                 trackingConfiguration:(NSString *)trackingConfiguration
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[tag];
    if (![view isKindOfClass:[EXGLView class]]) {
      reject(@"E_GLVIEW_MANAGER_BAD_VIEW_TAG", nil, RCTErrorWithMessage(@"EXAR.startARSessionAsync: Expected an EXGLView"));
      return;
    }
    if (self->_arSessionManager) {
      [self->_arSessionManager stop];
      self->_arSessionManager = nil;
    }
    
    EXGLView *exglView = (EXGLView *)view;
    
    Class sessionManagerClass = NSClassFromString(@"EXGLARSessionManager");
    if (sessionManagerClass) {
      
      self->_arSessionManager = [[sessionManagerClass alloc] init];
      [self->_arSessionManager setDelegate:self];
      [exglView setArSessionManager:self->_arSessionManager];
      
      NSDictionary *response = [self->_arSessionManager startWithGLView:exglView trackingConfiguration: trackingConfiguration];
      if (response[@"error"]) {
        reject(@"ERR_ARKIT_FAILED_TO_INIT", response[@"error"], RCTErrorWithMessage(response[@"error"]));
      } else {
        resolve(response);
      }
    } else {
      NSString *response = @"ARKIT capabilities were not included with this build.";
      reject(@"ERR_ARKIT_FAILED_TO_INIT", response, RCTErrorWithMessage(response));
    }
  }];
}

RCT_REMAP_METHOD(stopAsync,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    if (self->_arSessionManager) {
      [self->_arSessionManager stop];
      self->_arSessionManager = nil;
    }
    resolve(nil);
  }];
}

RCT_EXPORT_METHOD(pause)
{
  [_arSessionManager pause];
}

RCT_EXPORT_METHOD(resume)
{
  [_arSessionManager resume];
}

RCT_EXPORT_METHOD(reset)
{
  [_arSessionManager reset];
}

RCT_REMAP_METHOD(setProvidesAudioData,
                 providesAudioData:(BOOL)providesAudioData)
{
  [_arSessionManager setProvidesAudioData:providesAudioData];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getProvidesAudioData, NSNumber *, getProvidesAudioData)
{
  return @([_arSessionManager providesAudioData]);
}

RCT_REMAP_METHOD(setLightEstimationEnabled,
                 lightEstimationEnabled:(BOOL)lightEstimationEnabled)
{
  [_arSessionManager setLightEstimationEnabled:lightEstimationEnabled];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getLightEstimationEnabled, NSNumber *, getLightEstimationEnabled)
{
  return @([_arSessionManager lightEstimationEnabled]);
}

RCT_REMAP_METHOD(setAutoFocusEnabled,
                 isAutoFocusEnabled:(BOOL)isAutoFocusEnabled)
{
  [_arSessionManager setAutoFocusEnabled:isAutoFocusEnabled];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getAutoFocusEnabled, NSNumber *, getAutoFocusEnabled)
{
  return @([_arSessionManager autoFocusEnabled]);
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getPlaneDetection, NSString *, getPlaneDetection)
{
  NSArray *items = @[@"none", @"horizontal", @"vertical"];
  return [items objectAtIndex:[_arSessionManager planeDetection]];
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000

RCT_REMAP_METHOD(setPlaneDetection,
                 planeDetection:(ARPlaneDetection)planeDetection)
{
  [_arSessionManager setPlaneDetection:planeDetection];
}

RCT_REMAP_METHOD(setWorldAlignment,
                 worldAlignment:(ARWorldAlignment)worldAlignment)
{
  if (!_arSessionManager) {
    return;
  }
  [_arSessionManager setWorldAlignment:worldAlignment];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(performHitTest,
                                      nullable NSDictionary *,
                                      performHitTestWithPoint:(CGPoint)point
                                      types:(ARHitTestResultType)types)
{
  if (!_arSessionManager) {
    return nil;
  }
  return [_arSessionManager performHitTest:point types:types];
}

#else

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(performHitTest,
                                      nullable NSDictionary *,
                                      performHitTestWithPoint:(CGPoint)point
                                      types:(NSString *)types)
{
  return nil;
}

RCT_REMAP_METHOD(setPlaneDetection,
                 planeDetection:(NSString *)planeDetection)
{
}

RCT_REMAP_METHOD(setWorldAlignment,
                 worldAlignment:(NSString *)worldAlignment)
{
}
#endif

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getWorldAlignment, NSString *, getWorldAlignment)
{
  NSArray *items = @[@"gravity", @"gravityAndHeading", @"alignmentCamera"];
  return [items objectAtIndex:[_arSessionManager worldAlignment]];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getCurrentFrame,
                                      nullable NSDictionary *,
                                      getCurrentFrameWithAttributes:(NSDictionary *)attributes)
{
  return [_arSessionManager getCurrentFrameWithAttributes:attributes];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getARMatrices,
                                      nullable NSDictionary *,
                                      getARMatricesWithZNear:(nonnull NSNumber *)zNear
                                      zFar:(nonnull NSNumber *)zFar)
{
  if (!_arSessionManager) {
    return nil;
  }
  return [_arSessionManager arMatricesWithZNear:[zNear floatValue] zFar:[zFar floatValue]];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getVideoFormat, nullable NSDictionary *, getVideoFormat)
{
  if (!_arSessionManager) {
    return nil;
  }
  if (@available(iOS 11.3, *)) {
    ARVideoFormat *videoFormat = [_arSessionManager videoFormat];
    return [EXAR serializeARVideoFormat:videoFormat];
  }
  return nil;
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getCameraTexture, NSNumber *, getCameraTexture)
{
  return @([_arSessionManager cameraTexture]);
}

RCT_REMAP_METHOD(setShouldAttemptRelocalization,
                 shouldAttemptRelocalization:(BOOL)shouldAttemptRelocalization)
{
  [_arSessionManager setShouldAttemptRelocalization:shouldAttemptRelocalization];
}

RCT_REMAP_METHOD(setWorldOriginAsync,
                 worldOrigin:(NSArray *)worldOrigin
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
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
   resolve(@{});
}

RCT_REMAP_METHOD(setConfigurationAsync,
                 setConfigurationAsyncWithConfiguration:(NSString *)configuration
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!_arSessionManager) {
    return;
  }
  NSError *error = [_arSessionManager startConfiguration:configuration];
  if (error) {
    reject(@"E_GLVIEW_MANAGER_BAD_AR_CONFIGURATION", @"ARKIT encountered an error: not a valid ARConfiguration.", error);
  } else {
    resolve(@{});
  }
}

RCT_REMAP_METHOD(setDetectionImagesAsync,
                 setDetectionImagesAsyncWithImages:(NSDictionary *)images
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!_arSessionManager) {
    return;
  }
  if (@available(iOS 11.3, *)) {
    
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
    resolve(@{});
  } else {
    reject(@"E_INVALID_VERSION", @"Detection images are only available on iOS 11.3+ devices", nil);
  }
}


@end
