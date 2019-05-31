#import <EXCamera/EXCamera.h>
#import <EXCamera/EXCameraManager.h>
#import <EXCamera/EXCameraUtils.h>

#import <UMCore/UMUIManager.h>
#import <UMFileSystemInterface/UMFileSystemInterface.h>

@interface EXCameraManager ()

@property (nonatomic, weak) id<UMFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<UMUIManager> uiManager;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXCameraManager

UM_EXPORT_MODULE(ExponentCameraManager);

- (NSString *)viewName
{
  return @"ExponentCamera";
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemInterface)];
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(UMUIManager)];
}

- (UIView *)view
{
  return [[EXCamera alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(EXCameraTypeFront), @"back" : @(EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(EXCameraFlashModeOff),
               @"on" : @(EXCameraFlashModeOn),
               @"auto" : @(EXCameraFlashModeAuto),
               @"torch" : @(EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(EXCameraAutoFocusOn), @"off" : @(EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(EXCameraWhiteBalanceAuto),
               @"sunny" : @(EXCameraWhiteBalanceSunny),
               @"cloudy" : @(EXCameraWhiteBalanceCloudy),
               @"shadow" : @(EXCameraWhiteBalanceShadow),
               @"incandescent" : @(EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(EXCameraVideo2160p),
               @"1080p": @(EXCameraVideo1080p),
               @"720p": @(EXCameraVideo720p),
               @"480p": @(EXCameraVideo4x3),
               @"4:3": @(EXCameraVideo4x3),
               },
           @"VideoStabilization": @{
               @"off": @(EXCameraVideoStabilizationModeOff),
               @"standard": @(EXCameraVideoStabilizationModeStandard),
               @"cinematic": @(EXCameraVideoStabilizationModeCinematic),
               @"auto": @(EXCameraAVCaptureVideoStabilizationModeAuto)
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

UM_VIEW_PROPERTY(type, NSNumber *, EXCamera)
{
  long longValue = [value longValue];
  if (view.presetCamera != longValue) {
    [view setPresetCamera:longValue];
    [view updateType];
  }
}

UM_VIEW_PROPERTY(flashMode, NSNumber *, EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.flashMode) {
    [view setFlashMode:longValue];
    [view updateFlashMode];
  }
}

UM_VIEW_PROPERTY(faceDetectorSettings, NSDictionary *, EXCamera)
{
  [view updateFaceDetectorSettings:value];
}

UM_VIEW_PROPERTY(barCodeScannerSettings, NSDictionary *, EXCamera)
{
  [view setBarCodeScannerSettings:value];
}

UM_VIEW_PROPERTY(autoFocus, NSNumber *, EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.autoFocus) {
    [view setAutoFocus:longValue];
    [view updateFocusMode];
  }
}

UM_VIEW_PROPERTY(focusDepth, NSNumber *, EXCamera)
{
  float floatValue = [value floatValue];
  if (fabsf(view.focusDepth - floatValue) > FLT_EPSILON) {
    [view setFocusDepth:floatValue];
    [view updateFocusDepth];
  }
}

UM_VIEW_PROPERTY(zoom, NSNumber *, EXCamera)
{
  double doubleValue = [value doubleValue];
  if (fabs(view.zoom - doubleValue) > DBL_EPSILON) {
    [view setZoom:doubleValue];
    [view updateZoom];
  }
}

UM_VIEW_PROPERTY(whiteBalance, NSNumber *, EXCamera)
{
  long longValue = [value longValue];
  if (longValue != view.whiteBalance) {
    [view setWhiteBalance:longValue];
    [view updateWhiteBalance];
  }
}

UM_VIEW_PROPERTY(pictureSize, NSString *, EXCamera) {
  [view setPictureSize:[[self class] pictureSizes][value]];
  [view updatePictureSize];
}

UM_VIEW_PROPERTY(faceDetectorEnabled, NSNumber *, EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isDetectingFaces] != boolValue) {
    [view setIsDetectingFaces:boolValue];
  }
}

UM_VIEW_PROPERTY(barCodeScannerEnabled, NSNumber *, EXCamera)
{
  bool boolValue = [value boolValue];
  if ([view isScanningBarCodes] != boolValue) {
    [view setIsScanningBarCodes:boolValue];
  }
}

UM_EXPORT_METHOD_AS(takePicture,
                    takePictureWithOptions:(NSDictionary *)options
                    reactTag:(nonnull NSNumber *)reactTag
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  __weak EXCameraManager *weakSelf = self;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
#if TARGET_IPHONE_SIMULATOR
      __strong EXCameraManager *strongSelf = weakSelf;
      if (!strongSelf.fileSystem) {
        reject(@"E_IMAGE_SAVE_FAILED", @"No filesystem module", nil);
        return;
      }
    
      NSString *path = [strongSelf.fileSystem generatePathInDirectory:[strongSelf.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];

      UIImage *generatedPhoto = [EXCameraUtils generatePhotoOfSize:CGSizeMake(200, 200)];
      BOOL useFastMode = options[@"fastMode"] && [options[@"fastMode"] boolValue];
      if (useFastMode) {
        resolve(nil);
      }

      float quality = [options[@"quality"] floatValue];
      NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
    
      NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
      response[@"uri"] = [EXCameraUtils writeImage:photoData toPath:path];
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
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:reactTag ofClass:[EXCamera class]];

}

UM_EXPORT_METHOD_AS(record,
                    recordWithOptions:(NSDictionary *)options
                    reactTag:(nonnull NSNumber *)reactTag
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_RECORDING_FAILED", @"Video recording is not supported on a simulator.", nil);
  return;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view record:options resolve:resolve reject:reject];
    } else {
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:reactTag ofClass:[EXCamera class]];
}

UM_EXPORT_METHOD_AS(stopRecording,
                    stopRecordingOfReactTag:(nonnull NSNumber *)reactTag
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view stopRecording];
      resolve(nil);
    } else {
      UMLogError(@"Invalid view returned from registry, expected EXCamera, got: %@", view);
    }
  } forView:reactTag ofClass:[EXCamera class]];
}

UM_EXPORT_METHOD_AS(resumePreview,
                    resumePreview:(nonnull NSNumber *)tag
                         resolver:(UMPromiseResolveBlock)resolve
                         rejecter:(UMPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_SIM_PREVIEW", @"Resuming preview is not supported on simulator.", nil);
  return;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view resumePreview];
      resolve(nil);
    } else {
      UMLogError(@"Invalid view returned from registry, expected EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[EXCamera class]];
}

UM_EXPORT_METHOD_AS(pausePreview,
                    pausePreview:(nonnull NSNumber *)tag
                        resolver:(UMPromiseResolveBlock)resolve
                         rejecter:(UMPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_SIM_PREVIEW", @"Pausing preview is not supported on simulator.", nil);
  return;
#endif
  [_uiManager executeUIBlock:^(id view) {
    if (view != nil) {
      [view pausePreview];
      resolve(nil);
    } else {
      UMLogError(@"Invalid view returned from registry, expected EXCamera, got: %@", view);
    }
  } forView:tag ofClass:[EXCamera class]];
}

UM_EXPORT_METHOD_AS(getAvailablePictureSizes,
                     getAvailablePictureSizesWithRatio:(NSString *)ratio
                                                   tag:(nonnull NSNumber *)tag
                                              resolver:(UMPromiseResolveBlock)resolve
                                              rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([[[self class] pictureSizes] allKeys]);
}

@end
