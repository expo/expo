#import <EXCamera/EXCamera.h>
#import <EXCamera/EXCameraManager.h>
#import <EXCamera/EXFileSystem.h>
#import <EXCamera/EXPlatformAdapter.h>
#import <EXCamera/EXImageUtils.h>

@interface EXCameraManager ()

@property (nonatomic, weak) id<EXFileSystem> fileSystem;
@property (nonatomic, weak) id<EXPlatformAdapter> platformManager;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXCameraManager

EX_REGISTER_MODULE(ExponentCameraManager,);

- (NSString *)viewName
{
  return @"ExponentCamera";
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleForName:@"ExponentFileSystem" downcastedTo:@protocol(EXFileSystem) exception:nil];
  _platformManager = [moduleRegistry getModuleForName:@"PlatformAdapter" downcastedTo:@protocol(EXPlatformAdapter) exception:nil];
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
           @"BarCodeType" : [[self class] validBarCodeTypes]
           };
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onCameraReady", @"onMountError", @"onBarCodeRead", @"onFacesDetected"];
}


+ (NSDictionary *)validBarCodeTypes
{
  return @{
           @"upc_e" : AVMetadataObjectTypeUPCECode,
           @"code39" : AVMetadataObjectTypeCode39Code,
           @"code39mod43" : AVMetadataObjectTypeCode39Mod43Code,
           @"ean13" : AVMetadataObjectTypeEAN13Code,
           @"ean8" : AVMetadataObjectTypeEAN8Code,
           @"code93" : AVMetadataObjectTypeCode93Code,
           @"code138" : AVMetadataObjectTypeCode128Code,
           @"pdf417" : AVMetadataObjectTypePDF417Code,
           @"qr" : AVMetadataObjectTypeQRCode,
           @"aztec" : AVMetadataObjectTypeAztecCode,
           @"interleaved2of5" : AVMetadataObjectTypeInterleaved2of5Code,
           @"itf14" : AVMetadataObjectTypeITF14Code,
           @"datamatrix" : AVMetadataObjectTypeDataMatrixCode
           };
}

EX_VIEW_PROPERTY(type, NSNumber *, EXCamera)
{
  long longValue = [value longValue];
  if (view.presetCamera != longValue) {
    [view setPresetCamera:longValue];
    [view updateType];
  }
}

EX_VIEW_PROPERTY(flashMode, NSNumber *, EXCamera)
{
  [view setFlashMode:[value longValue]];
  [view updateFlashMode];
}

EX_VIEW_PROPERTY(faceDetectorSettings, NSDictionary *, EXCamera)
{
  [view updateFaceDetectorSettings:value];
}


EX_VIEW_PROPERTY(autoFocus, NSNumber *, EXCamera)
{
  [view setAutoFocus:[value longValue]];
  [view updateFocusMode];
}

EX_VIEW_PROPERTY(focusDepth, NSNumber *, EXCamera)
{
  [view setFocusDepth:[value floatValue]];
  [view updateFocusDepth];
}

EX_VIEW_PROPERTY(zoom, NSNumber *, EXCamera)
{
  [view setZoom:[value doubleValue]];
  [view updateZoom];
}

EX_VIEW_PROPERTY(whiteBalance, NSNumber *, EXCamera)
{
  [view setWhiteBalance:[value longValue]];
  [view updateWhiteBalance];
}

EX_VIEW_PROPERTY(faceDetectorEnabled, NSNumber *, EXCamera)
{
  [view setFaceDetecting:[value boolValue]];
}


EX_VIEW_PROPERTY(barCodeScannerEnabled, NSNumber *, EXCamera)
{
  view.barCodeReading = [value boolValue];
  [view setupOrDisableBarcodeScanner];
}

EX_VIEW_PROPERTY(barCodeTypes, NSArray *, EXCamera)
{
  [view setBarCodeTypes:value];
}

EX_EXPORT_METHOD_AS(takePicture,
                    takePictureWithOptions:(NSDictionary *)options
                    reactTag:(nonnull NSNumber *)reactTag
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
  float quality = [options[@"quality"] floatValue];
  if (!_fileSystem) {
    reject(@"E_IMAGE_SAVE_FAILED", @"No filesystem module", nil);
    return;
  }
  NSString *path = [_fileSystem generatePathInDirectory:[_fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];
  UIImage *generatedPhoto = [EXImageUtils generatePhotoOfSize:CGSizeMake(200, 200)];
  NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
  response[@"uri"] = [EXImageUtils writeImage:photoData toPath:path];
  response[@"width"] = @(generatedPhoto.size.width);
  response[@"height"] = @(generatedPhoto.size.height);
  if ([options[@"base64"] boolValue]) {
    response[@"base64"] = [photoData base64EncodedStringWithOptions:0];
  }
  resolve(response);
#else
  [_platformManager addUIBlock:^(id view) {
    if (view != nil) {
      [view takePicture:options resolve:resolve reject:reject];
    } else {
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expecting EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:reactTag ofClass:[EXCamera class]];
#endif
}

EX_EXPORT_METHOD_AS(record,
                    recordWithOptions:(NSDictionary *)options
                    reactTag:(nonnull NSNumber *)reactTag
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_RECORDING_FAILED", @"Video recording is not supported on a simulator.", nil);
  return;
#endif
  [_platformManager addUIBlock:^(id view) {
    if (view != nil) {
      [view record:options resolve:resolve reject:reject];
    } else {
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expecting EXCamera, got: %@", view];
      reject(@"E_INVALID_VIEW", reason, nil);
    }
  } forView:reactTag ofClass:[EXCamera class]];
}

EX_EXPORT_METHOD_AS(stopRecording,
                    stopRecordingOfReactTag:(nonnull NSNumber *)reactTag
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [_platformManager addUIBlock:^(id view) {
    if (view != nil) {
      [view stopRecording];
      resolve(nil);
    } else {
      EXLogError(@"Invalid view returned from registry, expecting EXCamera, got: %@", view);
    }
  } forView:reactTag ofClass:[EXCamera class]];
}


@end

