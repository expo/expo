#import <ABI39_0_0EXCamera/ABI39_0_0EXCamera.h>
#import <ABI39_0_0EXCamera/ABI39_0_0EXCameraManager.h>
#import <ABI39_0_0EXCamera/ABI39_0_0EXCameraUtils.h>
#import <ABI39_0_0EXCamera/ABI39_0_0EXCameraPermissionRequester.h>

#import <ABI39_0_0UMCore/ABI39_0_0UMUIManager.h>
#import <ABI39_0_0UMFileSystemInterface/ABI39_0_0UMFileSystemInterface.h>
#import <ABI39_0_0UMPermissionsInterface/ABI39_0_0UMPermissionsInterface.h>
#import <ABI39_0_0UMPermissionsInterface/ABI39_0_0UMPermissionsMethodsDelegate.h>

@interface ABI39_0_0EXCameraManager ()

@property (nonatomic, weak) id<ABI39_0_0UMFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<ABI39_0_0UMUIManager> uiManager;
@property (nonatomic, weak) ABI39_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI39_0_0UMPermissionsInterface> permissionsManager;
@end

@implementation ABI39_0_0EXCameraManager

ABI39_0_0UM_EXPORT_MODULE(ExponentCameraManager);

- (NSString *)viewName
{
  return @"ExponentCamera";
}

- (void)setModuleRegistry:(ABI39_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI39_0_0UMFileSystemInterface)];
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI39_0_0UMUIManager)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI39_0_0UMPermissionsInterface)];
  [ABI39_0_0UMPermissionsMethodsDelegate registerRequesters:@[[ABI39_0_0EXCameraPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

- (UIView *)view
{
  return [[ABI39_0_0EXCamera alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(ABI39_0_0EXCameraTypeFront), @"back" : @(ABI39_0_0EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(ABI39_0_0EXCameraFlashModeOff),
               @"on" : @(ABI39_0_0EXCameraFlashModeOn),
               @"auto" : @(ABI39_0_0EXCameraFlashModeAuto),
               @"torch" : @(ABI39_0_0EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(ABI39_0_0EXCameraAutoFocusOn), @"off" : @(ABI39_0_0EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(ABI39_0_0EXCameraWhiteBalanceAuto),
               @"sunny" : @(ABI39_0_0EXCameraWhiteBalanceSunny),
               @"cloudy" : @(ABI39_0_0EXCameraWhiteBalanceCloudy),
               @"shadow" : @(ABI39_0_0EXCameraWhiteBalanceShadow),
               @"incandescent" : @(ABI39_0_0EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(ABI39_0_0EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(ABI39_0_0EXCameraVideo2160p),
               @"1080p": @(ABI39_0_0EXCameraVideo1080p),
               @"720p": @(ABI39_0_0EXCameraVideo720p),
               @"480p": @(ABI39_0_0EXCameraVideo4x3),
               @"4:3": @(ABI39_0_0EXCameraVideo4x3),
               },
           @"VideoStabilization": @{
               @"off": @(ABI39_0_0EXCameraVideoStabilizationModeOff),
               @"standard": @(ABI39_0_0EXCameraVideoStabilizationModeStandard),
               @"cinematic": @(ABI39_0_0EXCameraVideoStabilizationModeCinematic),
               @"auto": @(ABI39_0_0EXCameraAVCaptureVideoStabilizationModeAuto)
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

ABI39_0_0UM_VIEW_PROPERTY(type, NSNumber *, ABI39_0_0EXCamera)
{
  long longValue = [value longValue];
  if (view.presetCamera != longValue) {
    [view setPresetCamera:longValue];
    [view updateType];
  }
}

ABI39_0_0UM_VIEW_PROPERTY(flashMode, NSNumber *, ABI39_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.flashMode) {
    [view setFlashMode:longValue];
    [view updateFlashMode];
  }
}

ABI39_0_0UM_VIEW_PROPERTY(faceDetectorSettings, NSDictionary *, ABI39_0_0EXCamera)
{
  [view updateFaceDetectorSettings:value];
}

ABI39_0_0UM_VIEW_PROPERTY(barCodeScannerSettings, NSDictionary *, ABI39_0_0EXCamera)
{
  [view setBarCodeScannerSettings:value];
}

ABI39_0_0UM_VIEW_PROPERTY(autoFocus, NSNumber *, ABI39_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.autoFocus) {
    [view setAutoFocus:longValue];
    [view updateFocusMode];
  }
}

ABI39_0_0UM_VIEW_PROPERTY(focusDepth, NSNumber *, ABI39_0_0EXCamera)
{
  float floatValue = [value floatValue];
  if (fabsf(view.focusDepth - floatValue) > FLT_EPSILON) {
    [view setFocusDepth:floatValue];
    [view updateFocusDepth];
  }
}

ABI39_0_0UM_VIEW_PROPERTY(zoom, NSNumber *, ABI39_0_0EXCamera)
{
  double doubleValue = [value doubleValue];
  if (fabs(view.zoom - doubleValue) > DBL_EPSILON) {
    [view setZoom:doubleValue];
    [view updateZoom];
  }
}

ABI39_0_0UM_VIEW_PROPERTY(whiteBalance, NSNumber *, ABI39_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.whiteBalance) {
    [view setWhiteBalance:longValue];
    [view updateWhiteBalance];
  }
}

ABI39_0_0UM_VIEW_PROPERTY(pictureSize, NSString *, ABI39_0_0EXCamera) {
  [view setPictureSize:[[self class] pictureSizes][value]];
  [view updatePictureSize];
}

ABI39_0_0UM_VIEW_PROPERTY(faceDetectorEnabled, NSNumber *, ABI39_0_0EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isDetectingFaces] != boolValue) {
    [view setIsDetectingFaces:boolValue];
  }
}

ABI39_0_0UM_VIEW_PROPERTY(barCodeScannerEnabled, NSNumber *, ABI39_0_0EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isScanningBarCodes] != boolValue) {
    [view setIsScanningBarCodes:boolValue];
  }
}

ABI39_0_0UM_EXPORT_METHOD_AS(takePicture,
                    takePictureWithOptions:(NSDictionary *)options
                    ABI39_0_0ReactTag:(nonnull NSNumber *)ABI39_0_0ReactTag
                    resolver:(ABI39_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  __weak ABI39_0_0EXCameraManager *weakSelf = self;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
#if TARGET_IPHONE_SIMULATOR
      __strong ABI39_0_0EXCameraManager *strongSelf = weakSelf;
      if (!strongSelf.fileSystem) {
        reject(@"E_IMAGE_SAVE_FAILED", @"No filesystem module", nil);
        return;
      }
    
      NSString *path = [strongSelf.fileSystem generatePathInDirectory:[strongSelf.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];

      UIImage *generatedPhoto = [ABI39_0_0EXCameraUtils generatePhotoOfSize:CGSizeMake(200, 200)];
      BOOL useFastMode = options[@"fastMode"] && [options[@"fastMode"] boolValue];
      if (useFastMode) {
        resolve(nil);
      }

      float quality = [options[@"quality"] floatValue];
      NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
    
      NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
      response[@"uri"] = [ABI39_0_0EXCameraUtils writeImage:photoData toPath:path];
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
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI39_0_0EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:ABI39_0_0ReactTag ofClass:[ABI39_0_0EXCamera class]];

}

ABI39_0_0UM_EXPORT_METHOD_AS(record,
                    recordWithOptions:(NSDictionary *)options
                    ABI39_0_0ReactTag:(nonnull NSNumber *)ABI39_0_0ReactTag
                    resolver:(ABI39_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
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
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI39_0_0EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:ABI39_0_0ReactTag ofClass:[ABI39_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI39_0_0UM_EXPORT_METHOD_AS(stopRecording,
                    stopRecordingOfABI39_0_0ReactTag:(nonnull NSNumber *)ABI39_0_0ReactTag
                    resolver:(ABI39_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
{
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view stopRecording];
      resolve(nil);
    } else {
      ABI39_0_0UMLogError(@"Invalid view returned from registry, expected ABI39_0_0EXCamera, got: %@", view);
    }
  } forView:ABI39_0_0ReactTag ofClass:[ABI39_0_0EXCamera class]];
}

ABI39_0_0UM_EXPORT_METHOD_AS(resumePreview,
                    resumePreview:(nonnull NSNumber *)tag
                         resolver:(ABI39_0_0UMPromiseResolveBlock)resolve
                         rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
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
      ABI39_0_0UMLogError(@"Invalid view returned from registry, expected ABI39_0_0EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[ABI39_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI39_0_0UM_EXPORT_METHOD_AS(pausePreview,
                    pausePreview:(nonnull NSNumber *)tag
                        resolver:(ABI39_0_0UMPromiseResolveBlock)resolve
                         rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
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
      ABI39_0_0UMLogError(@"Invalid view returned from registry, expected ABI39_0_0EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[ABI39_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI39_0_0UM_EXPORT_METHOD_AS(getAvailablePictureSizes,
                     getAvailablePictureSizesWithRatio:(NSString *)ratio
                                                   tag:(nonnull NSNumber *)tag
                                              resolver:(ABI39_0_0UMPromiseResolveBlock)resolve
                                              rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
{
  resolve([[[self class] pictureSizes] allKeys]);
}

ABI39_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI39_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
{
  [ABI39_0_0UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI39_0_0EXCameraPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI39_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI39_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
{
  [ABI39_0_0UMPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI39_0_0EXCameraPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end
