#import <ABI41_0_0EXCamera/ABI41_0_0EXCamera.h>
#import <ABI41_0_0EXCamera/ABI41_0_0EXCameraManager.h>
#import <ABI41_0_0EXCamera/ABI41_0_0EXCameraUtils.h>
#import <ABI41_0_0EXCamera/ABI41_0_0EXCameraPermissionRequester.h>

#import <ABI41_0_0UMCore/ABI41_0_0UMUIManager.h>
#import <ABI41_0_0UMFileSystemInterface/ABI41_0_0UMFileSystemInterface.h>
#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>
#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsMethodsDelegate.h>

@interface ABI41_0_0EXCameraManager ()

@property (nonatomic, weak) id<ABI41_0_0UMFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<ABI41_0_0UMUIManager> uiManager;
@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI41_0_0UMPermissionsInterface> permissionsManager;
@end

@implementation ABI41_0_0EXCameraManager

ABI41_0_0UM_EXPORT_MODULE(ExponentCameraManager);

- (NSString *)viewName
{
  return @"ExponentCamera";
}

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMFileSystemInterface)];
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMUIManager)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMPermissionsInterface)];
  [ABI41_0_0UMPermissionsMethodsDelegate registerRequesters:@[[ABI41_0_0EXCameraPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

- (UIView *)view
{
  return [[ABI41_0_0EXCamera alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(ABI41_0_0EXCameraTypeFront), @"back" : @(ABI41_0_0EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(ABI41_0_0EXCameraFlashModeOff),
               @"on" : @(ABI41_0_0EXCameraFlashModeOn),
               @"auto" : @(ABI41_0_0EXCameraFlashModeAuto),
               @"torch" : @(ABI41_0_0EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(ABI41_0_0EXCameraAutoFocusOn), @"off" : @(ABI41_0_0EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(ABI41_0_0EXCameraWhiteBalanceAuto),
               @"sunny" : @(ABI41_0_0EXCameraWhiteBalanceSunny),
               @"cloudy" : @(ABI41_0_0EXCameraWhiteBalanceCloudy),
               @"shadow" : @(ABI41_0_0EXCameraWhiteBalanceShadow),
               @"incandescent" : @(ABI41_0_0EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(ABI41_0_0EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(ABI41_0_0EXCameraVideo2160p),
               @"1080p": @(ABI41_0_0EXCameraVideo1080p),
               @"720p": @(ABI41_0_0EXCameraVideo720p),
               @"480p": @(ABI41_0_0EXCameraVideo4x3),
               @"4:3": @(ABI41_0_0EXCameraVideo4x3),
               },
           @"VideoStabilization": @{
               @"off": @(ABI41_0_0EXCameraVideoStabilizationModeOff),
               @"standard": @(ABI41_0_0EXCameraVideoStabilizationModeStandard),
               @"cinematic": @(ABI41_0_0EXCameraVideoStabilizationModeCinematic),
               @"auto": @(ABI41_0_0EXCameraAVCaptureVideoStabilizationModeAuto)
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

ABI41_0_0UM_VIEW_PROPERTY(type, NSNumber *, ABI41_0_0EXCamera)
{
  long longValue = [value longValue];
  if (view.presetCamera != longValue) {
    [view setPresetCamera:longValue];
    [view updateType];
  }
}

ABI41_0_0UM_VIEW_PROPERTY(flashMode, NSNumber *, ABI41_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.flashMode) {
    [view setFlashMode:longValue];
    [view updateFlashMode];
  }
}

ABI41_0_0UM_VIEW_PROPERTY(faceDetectorSettings, NSDictionary *, ABI41_0_0EXCamera)
{
  [view updateFaceDetectorSettings:value];
}

ABI41_0_0UM_VIEW_PROPERTY(barCodeScannerSettings, NSDictionary *, ABI41_0_0EXCamera)
{
  [view setBarCodeScannerSettings:value];
}

ABI41_0_0UM_VIEW_PROPERTY(autoFocus, NSNumber *, ABI41_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.autoFocus) {
    [view setAutoFocus:longValue];
    [view updateFocusMode];
  }
}

ABI41_0_0UM_VIEW_PROPERTY(focusDepth, NSNumber *, ABI41_0_0EXCamera)
{
  float floatValue = [value floatValue];
  if (fabsf(view.focusDepth - floatValue) > FLT_EPSILON) {
    [view setFocusDepth:floatValue];
    [view updateFocusDepth];
  }
}

ABI41_0_0UM_VIEW_PROPERTY(zoom, NSNumber *, ABI41_0_0EXCamera)
{
  double doubleValue = [value doubleValue];
  if (fabs(view.zoom - doubleValue) > DBL_EPSILON) {
    [view setZoom:doubleValue];
    [view updateZoom];
  }
}

ABI41_0_0UM_VIEW_PROPERTY(whiteBalance, NSNumber *, ABI41_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.whiteBalance) {
    [view setWhiteBalance:longValue];
    [view updateWhiteBalance];
  }
}

ABI41_0_0UM_VIEW_PROPERTY(pictureSize, NSString *, ABI41_0_0EXCamera) {
  [view setPictureSize:[[self class] pictureSizes][value]];
  [view updatePictureSize];
}

ABI41_0_0UM_VIEW_PROPERTY(faceDetectorEnabled, NSNumber *, ABI41_0_0EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isDetectingFaces] != boolValue) {
    [view setIsDetectingFaces:boolValue];
  }
}

ABI41_0_0UM_VIEW_PROPERTY(barCodeScannerEnabled, NSNumber *, ABI41_0_0EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isScanningBarCodes] != boolValue) {
    [view setIsScanningBarCodes:boolValue];
  }
}

ABI41_0_0UM_EXPORT_METHOD_AS(takePicture,
                    takePictureWithOptions:(NSDictionary *)options
                    ABI41_0_0ReactTag:(nonnull NSNumber *)ABI41_0_0ReactTag
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  __weak ABI41_0_0EXCameraManager *weakSelf = self;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
#if TARGET_IPHONE_SIMULATOR
      __strong ABI41_0_0EXCameraManager *strongSelf = weakSelf;
      if (!strongSelf.fileSystem) {
        reject(@"E_IMAGE_SAVE_FAILED", @"No filesystem module", nil);
        return;
      }
    
      NSString *path = [strongSelf.fileSystem generatePathInDirectory:[strongSelf.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];

      UIImage *generatedPhoto = [ABI41_0_0EXCameraUtils generatePhotoOfSize:CGSizeMake(200, 200)];
      BOOL useFastMode = options[@"fastMode"] && [options[@"fastMode"] boolValue];
      if (useFastMode) {
        resolve(nil);
      }

      float quality = [options[@"quality"] floatValue];
      NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
    
      NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
      response[@"uri"] = [ABI41_0_0EXCameraUtils writeImage:photoData toPath:path];
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
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI41_0_0EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:ABI41_0_0ReactTag ofClass:[ABI41_0_0EXCamera class]];

}

ABI41_0_0UM_EXPORT_METHOD_AS(record,
                    recordWithOptions:(NSDictionary *)options
                    ABI41_0_0ReactTag:(nonnull NSNumber *)ABI41_0_0ReactTag
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
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
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI41_0_0EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:ABI41_0_0ReactTag ofClass:[ABI41_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI41_0_0UM_EXPORT_METHOD_AS(stopRecording,
                    stopRecordingOfABI41_0_0ReactTag:(nonnull NSNumber *)ABI41_0_0ReactTag
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view stopRecording];
      resolve(nil);
    } else {
      ABI41_0_0UMLogError(@"Invalid view returned from registry, expected ABI41_0_0EXCamera, got: %@", view);
    }
  } forView:ABI41_0_0ReactTag ofClass:[ABI41_0_0EXCamera class]];
}

ABI41_0_0UM_EXPORT_METHOD_AS(resumePreview,
                    resumePreview:(nonnull NSNumber *)tag
                         resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                         rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
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
      ABI41_0_0UMLogError(@"Invalid view returned from registry, expected ABI41_0_0EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[ABI41_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI41_0_0UM_EXPORT_METHOD_AS(pausePreview,
                    pausePreview:(nonnull NSNumber *)tag
                        resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                         rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
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
      ABI41_0_0UMLogError(@"Invalid view returned from registry, expected ABI41_0_0EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[ABI41_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI41_0_0UM_EXPORT_METHOD_AS(getAvailablePictureSizes,
                     getAvailablePictureSizesWithRatio:(NSString *)ratio
                                                   tag:(nonnull NSNumber *)tag
                                              resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                                              rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  resolve([[[self class] pictureSizes] allKeys]);
}

ABI41_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  [ABI41_0_0UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI41_0_0EXCameraPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI41_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  [ABI41_0_0UMPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI41_0_0EXCameraPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end
