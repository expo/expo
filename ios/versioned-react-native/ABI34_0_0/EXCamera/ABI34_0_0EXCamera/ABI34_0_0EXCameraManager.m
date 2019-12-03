#import <ABI34_0_0EXCamera/ABI34_0_0EXCamera.h>
#import <ABI34_0_0EXCamera/ABI34_0_0EXCameraManager.h>
#import <ABI34_0_0EXCamera/ABI34_0_0EXCameraUtils.h>

#import <ABI34_0_0UMCore/ABI34_0_0UMUIManager.h>
#import <ABI34_0_0UMFileSystemInterface/ABI34_0_0UMFileSystemInterface.h>

@interface ABI34_0_0EXCameraManager ()

@property (nonatomic, weak) id<ABI34_0_0UMFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<ABI34_0_0UMUIManager> uiManager;
@property (nonatomic, weak) ABI34_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI34_0_0EXCameraManager

ABI34_0_0UM_EXPORT_MODULE(ExponentCameraManager);

- (NSString *)viewName
{
  return @"ExponentCamera";
}

- (void)setModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMFileSystemInterface)];
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMUIManager)];
}

- (UIView *)view
{
  return [[ABI34_0_0EXCamera alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(ABI34_0_0EXCameraTypeFront), @"back" : @(ABI34_0_0EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(ABI34_0_0EXCameraFlashModeOff),
               @"on" : @(ABI34_0_0EXCameraFlashModeOn),
               @"auto" : @(ABI34_0_0EXCameraFlashModeAuto),
               @"torch" : @(ABI34_0_0EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(ABI34_0_0EXCameraAutoFocusOn), @"off" : @(ABI34_0_0EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(ABI34_0_0EXCameraWhiteBalanceAuto),
               @"sunny" : @(ABI34_0_0EXCameraWhiteBalanceSunny),
               @"cloudy" : @(ABI34_0_0EXCameraWhiteBalanceCloudy),
               @"shadow" : @(ABI34_0_0EXCameraWhiteBalanceShadow),
               @"incandescent" : @(ABI34_0_0EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(ABI34_0_0EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(ABI34_0_0EXCameraVideo2160p),
               @"1080p": @(ABI34_0_0EXCameraVideo1080p),
               @"720p": @(ABI34_0_0EXCameraVideo720p),
               @"480p": @(ABI34_0_0EXCameraVideo4x3),
               @"4:3": @(ABI34_0_0EXCameraVideo4x3),
               },
           @"VideoStabilization": @{
               @"off": @(ABI34_0_0EXCameraVideoStabilizationModeOff),
               @"standard": @(ABI34_0_0EXCameraVideoStabilizationModeStandard),
               @"cinematic": @(ABI34_0_0EXCameraVideoStabilizationModeCinematic),
               @"auto": @(ABI34_0_0EXCameraAVCaptureVideoStabilizationModeAuto)
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

ABI34_0_0UM_VIEW_PROPERTY(type, NSNumber *, ABI34_0_0EXCamera)
{
  long longValue = [value longValue];
  if (view.presetCamera != longValue) {
    [view setPresetCamera:longValue];
    [view updateType];
  }
}

ABI34_0_0UM_VIEW_PROPERTY(flashMode, NSNumber *, ABI34_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.flashMode) {
    [view setFlashMode:longValue];
    [view updateFlashMode];
  }
}

ABI34_0_0UM_VIEW_PROPERTY(faceDetectorSettings, NSDictionary *, ABI34_0_0EXCamera)
{
  [view updateFaceDetectorSettings:value];
}

ABI34_0_0UM_VIEW_PROPERTY(barCodeScannerSettings, NSDictionary *, ABI34_0_0EXCamera)
{
  [view setBarCodeScannerSettings:value];
}

ABI34_0_0UM_VIEW_PROPERTY(autoFocus, NSNumber *, ABI34_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.autoFocus) {
    [view setAutoFocus:longValue];
    [view updateFocusMode];
  }
}

ABI34_0_0UM_VIEW_PROPERTY(focusDepth, NSNumber *, ABI34_0_0EXCamera)
{
  float floatValue = [value floatValue];
  if (fabsf(view.focusDepth - floatValue) > FLT_EPSILON) {
    [view setFocusDepth:floatValue];
    [view updateFocusDepth];
  }
}

ABI34_0_0UM_VIEW_PROPERTY(zoom, NSNumber *, ABI34_0_0EXCamera)
{
  double doubleValue = [value doubleValue];
  if (fabs(view.zoom - doubleValue) > DBL_EPSILON) {
    [view setZoom:doubleValue];
    [view updateZoom];
  }
}

ABI34_0_0UM_VIEW_PROPERTY(whiteBalance, NSNumber *, ABI34_0_0EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.whiteBalance) {
    [view setWhiteBalance:longValue];
    [view updateWhiteBalance];
  }
}

ABI34_0_0UM_VIEW_PROPERTY(pictureSize, NSString *, ABI34_0_0EXCamera) {
  [view setPictureSize:[[self class] pictureSizes][value]];
  [view updatePictureSize];
}

ABI34_0_0UM_VIEW_PROPERTY(faceDetectorEnabled, NSNumber *, ABI34_0_0EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isDetectingFaces] != boolValue) {
    [view setIsDetectingFaces:boolValue];
  }
}

ABI34_0_0UM_VIEW_PROPERTY(barCodeScannerEnabled, NSNumber *, ABI34_0_0EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isScanningBarCodes] != boolValue) {
    [view setIsScanningBarCodes:boolValue];
  }
}

ABI34_0_0UM_EXPORT_METHOD_AS(takePicture,
                    takePictureWithOptions:(NSDictionary *)options
                    ReactABI34_0_0Tag:(nonnull NSNumber *)ReactABI34_0_0Tag
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  __weak ABI34_0_0EXCameraManager *weakSelf = self;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
#if TARGET_IPHONE_SIMULATOR
      __strong ABI34_0_0EXCameraManager *strongSelf = weakSelf;
      if (!strongSelf.fileSystem) {
        reject(@"E_IMAGE_SAVE_FAILED", @"No filesystem module", nil);
        return;
      }
    
      NSString *path = [strongSelf.fileSystem generatePathInDirectory:[strongSelf.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];

      UIImage *generatedPhoto = [ABI34_0_0EXCameraUtils generatePhotoOfSize:CGSizeMake(200, 200)];
      BOOL useFastMode = options[@"fastMode"] && [options[@"fastMode"] boolValue];
      if (useFastMode) {
        resolve(nil);
      }

      float quality = [options[@"quality"] floatValue];
      NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
    
      NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
      response[@"uri"] = [ABI34_0_0EXCameraUtils writeImage:photoData toPath:path];
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
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI34_0_0EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:ReactABI34_0_0Tag ofClass:[ABI34_0_0EXCamera class]];

}

ABI34_0_0UM_EXPORT_METHOD_AS(record,
                    recordWithOptions:(NSDictionary *)options
                    ReactABI34_0_0Tag:(nonnull NSNumber *)ReactABI34_0_0Tag
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
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
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI34_0_0EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:ReactABI34_0_0Tag ofClass:[ABI34_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI34_0_0UM_EXPORT_METHOD_AS(stopRecording,
                    stopRecordingOfReactABI34_0_0Tag:(nonnull NSNumber *)ReactABI34_0_0Tag
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view stopRecording];
      resolve(nil);
    } else {
      ABI34_0_0UMLogError(@"Invalid view returned from registry, expected ABI34_0_0EXCamera, got: %@", view);
    }
  } forView:ReactABI34_0_0Tag ofClass:[ABI34_0_0EXCamera class]];
}

ABI34_0_0UM_EXPORT_METHOD_AS(resumePreview,
                    resumePreview:(nonnull NSNumber *)tag
                         resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                         rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
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
      ABI34_0_0UMLogError(@"Invalid view returned from registry, expected ABI34_0_0EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[ABI34_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI34_0_0UM_EXPORT_METHOD_AS(pausePreview,
                    pausePreview:(nonnull NSNumber *)tag
                        resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                         rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
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
      ABI34_0_0UMLogError(@"Invalid view returned from registry, expected ABI34_0_0EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[ABI34_0_0EXCamera class]];
#pragma clang diagnostic pop
}

ABI34_0_0UM_EXPORT_METHOD_AS(getAvailablePictureSizes,
                     getAvailablePictureSizesWithRatio:(NSString *)ratio
                                                   tag:(nonnull NSNumber *)tag
                                              resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                                              rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  resolve([[[self class] pictureSizes] allKeys]);
}

@end
