#import <ABI43_0_0EXCamera/ABI43_0_0EXCamera.h>
#import <ABI43_0_0EXCamera/ABI43_0_0EXCameraManager.h>
#import <ABI43_0_0EXCamera/ABI43_0_0EXCameraUtils.h>
#import <ABI43_0_0EXCamera/ABI43_0_0EXCameraPermissionRequester.h>
#import <ABI43_0_0EXCamera/ABI43_0_0EXCameraCameraPermissionRequester.h>
#import <ABI43_0_0EXCamera/ABI43_0_0EXCameraMicrophonePermissionRequester.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUIManager.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXFileSystemInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsMethodsDelegate.h>

@interface ABI43_0_0EXCameraManager ()

@property (nonatomic, weak) id<ABI43_0_0EXFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<ABI43_0_0EXUIManager> uiManager;
@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI43_0_0EXPermissionsInterface> permissionsManager;
@end

@implementation ABI43_0_0EXCameraManager

ABI43_0_0EX_EXPORT_MODULE(ExponentCameraManager);

- (NSString *)viewName
{
  return @"ExponentCamera";
}

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXFileSystemInterface)];
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXUIManager)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXPermissionsInterface)];
  [ABI43_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI43_0_0EXCameraPermissionRequester new]] withPermissionsManager:_permissionsManager];
  [ABI43_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI43_0_0EXCameraCameraPermissionRequester new]] withPermissionsManager:_permissionsManager];
  [ABI43_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI43_0_0EXCameraMicrophonePermissionRequester new]] withPermissionsManager:_permissionsManager];
}

- (UIView *)view
{
  return [[ABI43_0_0EXCamera alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(ABI43_0_0EXCameraTypeFront), @"back" : @(ABI43_0_0EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(ABI43_0_0EXCameraFlashModeOff),
               @"on" : @(ABI43_0_0EXCameraFlashModeOn),
               @"auto" : @(ABI43_0_0EXCameraFlashModeAuto),
               @"torch" : @(ABI43_0_0EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(ABI43_0_0EXCameraAutoFocusOn), @"off" : @(ABI43_0_0EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(ABI43_0_0EXCameraWhiteBalanceAuto),
               @"sunny" : @(ABI43_0_0EXCameraWhiteBalanceSunny),
               @"cloudy" : @(ABI43_0_0EXCameraWhiteBalanceCloudy),
               @"shadow" : @(ABI43_0_0EXCameraWhiteBalanceShadow),
               @"incandescent" : @(ABI43_0_0EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(ABI43_0_0EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(ABI43_0_0EXCameraVideo2160p),
               @"1080p": @(ABI43_0_0EXCameraVideo1080p),
               @"720p": @(ABI43_0_0EXCameraVideo720p),
               @"480p": @(ABI43_0_0EXCameraVideo4x3),
               @"4:3": @(ABI43_0_0EXCameraVideo4x3),
               },
           @"VideoStabilization": @{
               @"off": @(ABI43_0_0EXCameraVideoStabilizationModeOff),
               @"standard": @(ABI43_0_0EXCameraVideoStabilizationModeStandard),
               @"cinematic": @(ABI43_0_0EXCameraVideoStabilizationModeCinematic),
               @"auto": @(ABI43_0_0EXCameraAVCaptureVideoStabilizationModeAuto)
               },
           @"VideoCodec": @{
               @"H264": @(ABI43_0_0EXCameraVideoCodecH264),
               @"HEVC": @(ABI43_0_0EXCameraVideoCodecHEVC),
               @"JPEG": @(ABI43_0_0EXCameraVideoCodecJPEG),
               @"AppleProRes422": @(ABI43_0_0EXCameraVideoCodecAppleProRes422),
               @"AppleProRes4444": @(ABI43_0_0EXCameraVideoCodecAppleProRes4444),
              },
           };
         
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onCameraReady",
           @"onMountError",
           @"onPictureSaved",
           @"onBarCodeScanned",
           @"onFacesDetected",
           ];
}

+ (NSDictionary *)pictureSizes
{
  return @{
           @"3840x2160" : AVCaptureSessionPreset3840x2160,
           @"1920x1080" : AVCaptureSessionPreset1920x1080,
           @"1280x720" : AVCaptureSessionPreset1280x720,
           @"640x480" : AVCaptureSessionPreset640x480,
           @"352x288" : AVCaptureSessionPreset352x288,
           @"Photo" : AVCaptureSessionPresetPhoto,
           @"High" : AVCaptureSessionPresetHigh,
           @"Medium" : AVCaptureSessionPresetMedium,
           @"Low" : AVCaptureSessionPresetLow
           };
}

ABI43_0_0EX_VIEW_PROPERTY(type, NSNumber *, ABI43_0_0EXCamera)
{
  long longValue = [value longValue];
  if (view.presetCamera != longValue) {
    [view setPresetCamera:longValue];
    [view updateType];
  }
}

ABI43_0_0EX_VIEW_PROPERTY(flashMode, NSNumber *, ABI43_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.flashMode) {
    [view setFlashMode:longValue];
    [view updateFlashMode];
  }
}

ABI43_0_0EX_VIEW_PROPERTY(faceDetectorSettings, NSDictionary *, ABI43_0_0EXCamera)
{
  [view updateFaceDetectorSettings:value];
}

ABI43_0_0EX_VIEW_PROPERTY(barCodeScannerSettings, NSDictionary *, ABI43_0_0EXCamera)
{
  [view setBarCodeScannerSettings:value];
}

ABI43_0_0EX_VIEW_PROPERTY(autoFocus, NSNumber *, ABI43_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.autoFocus) {
    [view setAutoFocus:longValue];
    [view updateFocusMode];
  }
}

ABI43_0_0EX_VIEW_PROPERTY(focusDepth, NSNumber *, ABI43_0_0EXCamera)
{
  float floatValue = [value floatValue];
  if (fabsf(view.focusDepth - floatValue) > FLT_EPSILON) {
    [view setFocusDepth:floatValue];
    [view updateFocusDepth];
  }
}

ABI43_0_0EX_VIEW_PROPERTY(zoom, NSNumber *, ABI43_0_0EXCamera)
{
  double doubleValue = [value doubleValue];
  if (fabs(view.zoom - doubleValue) > DBL_EPSILON) {
    [view setZoom:doubleValue];
    [view updateZoom];
  }
}

ABI43_0_0EX_VIEW_PROPERTY(whiteBalance, NSNumber *, ABI43_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.whiteBalance) {
    [view setWhiteBalance:longValue];
    [view updateWhiteBalance];
  }
}

ABI43_0_0EX_VIEW_PROPERTY(pictureSize, NSString *, ABI43_0_0EXCamera) {
  [view setPictureSize:[[self class] pictureSizes][value]];
  [view updatePictureSize];
}

ABI43_0_0EX_VIEW_PROPERTY(faceDetectorEnabled, NSNumber *, ABI43_0_0EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isDetectingFaces] != boolValue) {
    [view setIsDetectingFaces:boolValue];
  }
}

ABI43_0_0EX_VIEW_PROPERTY(barCodeScannerEnabled, NSNumber *, ABI43_0_0EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isScanningBarCodes] != boolValue) {
    [view setIsScanningBarCodes:boolValue];
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(takePicture,
                    takePictureWithOptions:(NSDictionary *)options
                    reactTag:(nonnull NSNumber *)reactTag
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  __weak ABI43_0_0EXCameraManager *weakSelf = self;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
#if TARGET_IPHONE_SIMULATOR
      __strong ABI43_0_0EXCameraManager *strongSelf = weakSelf;
      if (!strongSelf.fileSystem) {
        reject(@"E_IMAGE_SAVE_FAILED", @"No filesystem module", nil);
        return;
      }
    
      NSString *path = [strongSelf.fileSystem generatePathInDirectory:[strongSelf.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];

      UIImage *generatedPhoto = [ABI43_0_0EXCameraUtils generatePhotoOfSize:CGSizeMake(200, 200)];
      BOOL useFastMode = options[@"fastMode"] && [options[@"fastMode"] boolValue];
      if (useFastMode) {
        resolve(nil);
      }

      float quality = [options[@"quality"] floatValue];
      NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
    
      NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
      response[@"uri"] = [ABI43_0_0EXCameraUtils writeImage:photoData toPath:path];
      response[@"width"] = @(generatedPhoto.size.width);
      response[@"height"] = @(generatedPhoto.size.height);
      if ([options[@"base64"] boolValue]) {
        response[@"base64"] = [photoData base64EncodedStringWithOptions:0];
      }
      if (useFastMode) {
        [view onPictureSaved:@{@"data": response, @"id": options[@"id"]}];
      } else {
        resolve(response);
      }
#else
      [view takePicture:options resolve:resolve reject:reject];
#endif
    } else {
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI43_0_0EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:reactTag ofClass:[ABI43_0_0EXCamera class]];

}

ABI43_0_0EX_EXPORT_METHOD_AS(record,
                    recordWithOptions:(NSDictionary *)options
                    reactTag:(nonnull NSNumber *)reactTag
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunreachable-code"
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_RECORDING_FAILED", @"Video recording is not supported on a simulator.", nil);
  return;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view record:options resolve:resolve reject:reject];
    } else {
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI43_0_0EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:reactTag ofClass:[ABI43_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI43_0_0EX_EXPORT_METHOD_AS(stopRecording,
                    stopRecordingOfReactTag:(nonnull NSNumber *)reactTag
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view stopRecording];
      resolve(nil);
    } else {
      ABI43_0_0EXLogError(@"Invalid view returned from registry, expected ABI43_0_0EXCamera, got: %@", view);
    }
  } forView:reactTag ofClass:[ABI43_0_0EXCamera class]];
}

ABI43_0_0EX_EXPORT_METHOD_AS(resumePreview,
                    resumePreview:(nonnull NSNumber *)tag
                         resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                         rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunreachable-code"
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_SIM_PREVIEW", @"Resuming preview is not supported on simulator.", nil);
  return;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view resumePreview];
      resolve(nil);
    } else {
      ABI43_0_0EXLogError(@"Invalid view returned from registry, expected ABI43_0_0EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[ABI43_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI43_0_0EX_EXPORT_METHOD_AS(pausePreview,
                    pausePreview:(nonnull NSNumber *)tag
                        resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                         rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunreachable-code"
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_SIM_PREVIEW", @"Pausing preview is not supported on simulator.", nil);
  return;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view pausePreview];
      resolve(nil);
    } else {
      ABI43_0_0EXLogError(@"Invalid view returned from registry, expected ABI43_0_0EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[ABI43_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI43_0_0EX_EXPORT_METHOD_AS(getAvailablePictureSizes,
                     getAvailablePictureSizesWithRatio:(NSString *)ratio
                                                   tag:(nonnull NSNumber *)tag
                                              resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                                              rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve([[[self class] pictureSizes] allKeys]);
}

ABI43_0_0EX_EXPORT_METHOD_AS(getAvailableVideoCodecsAsync,
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  AVCaptureSession *session = [AVCaptureSession new];   
  [session beginConfiguration];

  NSError *error = nil;
  AVCaptureDevice *captureDevice = [ABI43_0_0EXCameraUtils deviceWithMediaType:AVMediaTypeVideo preferringPosition: AVCaptureDevicePositionFront];
  AVCaptureDeviceInput *captureDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:captureDevice error:&error];   
 
  if ([session canAddInput:captureDeviceInput]) {
     [session addInput:captureDeviceInput];
  }

  [session commitConfiguration];

  AVCaptureMovieFileOutput *movieFileOutput = [AVCaptureMovieFileOutput new];
  if ([session canAddOutput:movieFileOutput]) {
    [session addOutput:movieFileOutput];
  }
  
  resolve([movieFileOutput availableVideoCodecTypes]);
}

ABI43_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI43_0_0EXCameraPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI43_0_0EXCameraPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}


ABI43_0_0EX_EXPORT_METHOD_AS(getCameraPermissionsAsync,
                    getCameraPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI43_0_0EXCameraCameraPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}


ABI43_0_0EX_EXPORT_METHOD_AS(requestCameraPermissionsAsync,
                    requestCameraPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI43_0_0EXCameraCameraPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}



ABI43_0_0EX_EXPORT_METHOD_AS(getMicrophonePermissionsAsync,
                    getMicrophonePermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI43_0_0EXCameraMicrophonePermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}


ABI43_0_0EX_EXPORT_METHOD_AS(requestMicrophonePermissionsAsync,
                    requestMicrophonePermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI43_0_0EXCameraMicrophonePermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end
