#import <ABI42_0_0EXCamera/ABI42_0_0EXCamera.h>
#import <ABI42_0_0EXCamera/ABI42_0_0EXCameraManager.h>
#import <ABI42_0_0EXCamera/ABI42_0_0EXCameraUtils.h>
#import <ABI42_0_0EXCamera/ABI42_0_0EXCameraPermissionRequester.h>
#import <ABI42_0_0EXCamera/ABI42_0_0EXCameraCameraPermissionRequester.h>
#import <ABI42_0_0EXCamera/ABI42_0_0EXCameraMicrophonePermissionRequester.h>

#import <ABI42_0_0UMCore/ABI42_0_0UMUIManager.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFileSystemInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsMethodsDelegate.h>

@interface ABI42_0_0EXCameraManager ()

@property (nonatomic, weak) id<ABI42_0_0EXFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<ABI42_0_0UMUIManager> uiManager;
@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI42_0_0EXPermissionsInterface> permissionsManager;
@end

@implementation ABI42_0_0EXCameraManager

ABI42_0_0UM_EXPORT_MODULE(ExponentCameraManager);

- (NSString *)viewName
{
  return @"ExponentCamera";
}

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXFileSystemInterface)];
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMUIManager)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXPermissionsInterface)];
  [ABI42_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI42_0_0EXCameraPermissionRequester new]] withPermissionsManager:_permissionsManager];
  [ABI42_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI42_0_0EXCameraCameraPermissionRequester new]] withPermissionsManager:_permissionsManager];
  [ABI42_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI42_0_0EXCameraMicrophonePermissionRequester new]] withPermissionsManager:_permissionsManager];
}

- (UIView *)view
{
  return [[ABI42_0_0EXCamera alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(ABI42_0_0EXCameraTypeFront), @"back" : @(ABI42_0_0EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(ABI42_0_0EXCameraFlashModeOff),
               @"on" : @(ABI42_0_0EXCameraFlashModeOn),
               @"auto" : @(ABI42_0_0EXCameraFlashModeAuto),
               @"torch" : @(ABI42_0_0EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(ABI42_0_0EXCameraAutoFocusOn), @"off" : @(ABI42_0_0EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(ABI42_0_0EXCameraWhiteBalanceAuto),
               @"sunny" : @(ABI42_0_0EXCameraWhiteBalanceSunny),
               @"cloudy" : @(ABI42_0_0EXCameraWhiteBalanceCloudy),
               @"shadow" : @(ABI42_0_0EXCameraWhiteBalanceShadow),
               @"incandescent" : @(ABI42_0_0EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(ABI42_0_0EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(ABI42_0_0EXCameraVideo2160p),
               @"1080p": @(ABI42_0_0EXCameraVideo1080p),
               @"720p": @(ABI42_0_0EXCameraVideo720p),
               @"480p": @(ABI42_0_0EXCameraVideo4x3),
               @"4:3": @(ABI42_0_0EXCameraVideo4x3),
               },
           @"VideoStabilization": @{
               @"off": @(ABI42_0_0EXCameraVideoStabilizationModeOff),
               @"standard": @(ABI42_0_0EXCameraVideoStabilizationModeStandard),
               @"cinematic": @(ABI42_0_0EXCameraVideoStabilizationModeCinematic),
               @"auto": @(ABI42_0_0EXCameraAVCaptureVideoStabilizationModeAuto)
               },
           @"VideoCodec": @{
               @"H264": @(ABI42_0_0EXCameraVideoCodecH264),
               @"HEVC": @(ABI42_0_0EXCameraVideoCodecHEVC),
               @"JPEG": @(ABI42_0_0EXCameraVideoCodecJPEG),
               @"AppleProRes422": @(ABI42_0_0EXCameraVideoCodecAppleProRes422),
               @"AppleProRes4444": @(ABI42_0_0EXCameraVideoCodecAppleProRes4444),
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

ABI42_0_0UM_VIEW_PROPERTY(type, NSNumber *, ABI42_0_0EXCamera)
{
  long longValue = [value longValue];
  if (view.presetCamera != longValue) {
    [view setPresetCamera:longValue];
    [view updateType];
  }
}

ABI42_0_0UM_VIEW_PROPERTY(flashMode, NSNumber *, ABI42_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.flashMode) {
    [view setFlashMode:longValue];
    [view updateFlashMode];
  }
}

ABI42_0_0UM_VIEW_PROPERTY(faceDetectorSettings, NSDictionary *, ABI42_0_0EXCamera)
{
  [view updateFaceDetectorSettings:value];
}

ABI42_0_0UM_VIEW_PROPERTY(barCodeScannerSettings, NSDictionary *, ABI42_0_0EXCamera)
{
  [view setBarCodeScannerSettings:value];
}

ABI42_0_0UM_VIEW_PROPERTY(autoFocus, NSNumber *, ABI42_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.autoFocus) {
    [view setAutoFocus:longValue];
    [view updateFocusMode];
  }
}

ABI42_0_0UM_VIEW_PROPERTY(focusDepth, NSNumber *, ABI42_0_0EXCamera)
{
  float floatValue = [value floatValue];
  if (fabsf(view.focusDepth - floatValue) > FLT_EPSILON) {
    [view setFocusDepth:floatValue];
    [view updateFocusDepth];
  }
}

ABI42_0_0UM_VIEW_PROPERTY(zoom, NSNumber *, ABI42_0_0EXCamera)
{
  double doubleValue = [value doubleValue];
  if (fabs(view.zoom - doubleValue) > DBL_EPSILON) {
    [view setZoom:doubleValue];
    [view updateZoom];
  }
}

ABI42_0_0UM_VIEW_PROPERTY(whiteBalance, NSNumber *, ABI42_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.whiteBalance) {
    [view setWhiteBalance:longValue];
    [view updateWhiteBalance];
  }
}

ABI42_0_0UM_VIEW_PROPERTY(pictureSize, NSString *, ABI42_0_0EXCamera) {
  [view setPictureSize:[[self class] pictureSizes][value]];
  [view updatePictureSize];
}

ABI42_0_0UM_VIEW_PROPERTY(faceDetectorEnabled, NSNumber *, ABI42_0_0EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isDetectingFaces] != boolValue) {
    [view setIsDetectingFaces:boolValue];
  }
}

ABI42_0_0UM_VIEW_PROPERTY(barCodeScannerEnabled, NSNumber *, ABI42_0_0EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isScanningBarCodes] != boolValue) {
    [view setIsScanningBarCodes:boolValue];
  }
}

ABI42_0_0UM_EXPORT_METHOD_AS(takePicture,
                    takePictureWithOptions:(NSDictionary *)options
                    ABI42_0_0ReactTag:(nonnull NSNumber *)ABI42_0_0ReactTag
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  __weak ABI42_0_0EXCameraManager *weakSelf = self;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
#if TARGET_IPHONE_SIMULATOR
      __strong ABI42_0_0EXCameraManager *strongSelf = weakSelf;
      if (!strongSelf.fileSystem) {
        reject(@"E_IMAGE_SAVE_FAILED", @"No filesystem module", nil);
        return;
      }
    
      NSString *path = [strongSelf.fileSystem generatePathInDirectory:[strongSelf.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];

      UIImage *generatedPhoto = [ABI42_0_0EXCameraUtils generatePhotoOfSize:CGSizeMake(200, 200)];
      BOOL useFastMode = options[@"fastMode"] && [options[@"fastMode"] boolValue];
      if (useFastMode) {
        resolve(nil);
      }

      float quality = [options[@"quality"] floatValue];
      NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
    
      NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
      response[@"uri"] = [ABI42_0_0EXCameraUtils writeImage:photoData toPath:path];
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
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI42_0_0EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:ABI42_0_0ReactTag ofClass:[ABI42_0_0EXCamera class]];

}

ABI42_0_0UM_EXPORT_METHOD_AS(record,
                    recordWithOptions:(NSDictionary *)options
                    ABI42_0_0ReactTag:(nonnull NSNumber *)ABI42_0_0ReactTag
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
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
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI42_0_0EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:ABI42_0_0ReactTag ofClass:[ABI42_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI42_0_0UM_EXPORT_METHOD_AS(stopRecording,
                    stopRecordingOfABI42_0_0ReactTag:(nonnull NSNumber *)ABI42_0_0ReactTag
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view stopRecording];
      resolve(nil);
    } else {
      ABI42_0_0UMLogError(@"Invalid view returned from registry, expected ABI42_0_0EXCamera, got: %@", view);
    }
  } forView:ABI42_0_0ReactTag ofClass:[ABI42_0_0EXCamera class]];
}

ABI42_0_0UM_EXPORT_METHOD_AS(resumePreview,
                    resumePreview:(nonnull NSNumber *)tag
                         resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                         rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
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
      ABI42_0_0UMLogError(@"Invalid view returned from registry, expected ABI42_0_0EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[ABI42_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI42_0_0UM_EXPORT_METHOD_AS(pausePreview,
                    pausePreview:(nonnull NSNumber *)tag
                        resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                         rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
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
      ABI42_0_0UMLogError(@"Invalid view returned from registry, expected ABI42_0_0EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[ABI42_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI42_0_0UM_EXPORT_METHOD_AS(getAvailablePictureSizes,
                     getAvailablePictureSizesWithRatio:(NSString *)ratio
                                                   tag:(nonnull NSNumber *)tag
                                              resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                                              rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  resolve([[[self class] pictureSizes] allKeys]);
}

ABI42_0_0UM_EXPORT_METHOD_AS(getAvailableVideoCodecsAsync,
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  AVCaptureSession *session = [AVCaptureSession new];   
  [session beginConfiguration];

  NSError *error = nil;
  AVCaptureDevice *captureDevice = [ABI42_0_0EXCameraUtils deviceWithMediaType:AVMediaTypeVideo preferringPosition: AVCaptureDevicePositionFront];
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

ABI42_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI42_0_0EXCameraPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI42_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI42_0_0EXCameraPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}


ABI42_0_0UM_EXPORT_METHOD_AS(getCameraPermissionsAsync,
                    getCameraPermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI42_0_0EXCameraCameraPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}


ABI42_0_0UM_EXPORT_METHOD_AS(requestCameraPermissionsAsync,
                    requestCameraPermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI42_0_0EXCameraCameraPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}



ABI42_0_0UM_EXPORT_METHOD_AS(getMicrophonePermissionsAsync,
                    getMicrophonePermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI42_0_0EXCameraMicrophonePermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}


ABI42_0_0UM_EXPORT_METHOD_AS(requestMicrophonePermissionsAsync,
                    requestMicrophonePermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI42_0_0EXCameraMicrophonePermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end
