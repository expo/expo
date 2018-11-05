#import "ABI28_0_0EXCamera.h"
#import "ABI28_0_0EXCameraManager.h"
#import "ABI28_0_0EXFileSystem.h"
#import "ABI28_0_0EXImageUtils.h"
#import "ABI28_0_0EXCameraUtils.h"
#import "ABI28_0_0EXUnversioned.h"
#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>
#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>
#import <ReactABI28_0_0/ABI28_0_0RCTLog.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>

#if __has_include("ABI28_0_0EXFaceDetectorManager.h")
#import "ABI28_0_0EXFaceDetectorManager.h"
#else
#import "ABI28_0_0EXFaceDetectorManagerStub.h"
#endif

@implementation ABI28_0_0EXCameraManager

ABI28_0_0RCT_EXPORT_MODULE(ExponentCameraManager);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onCameraReady, ABI28_0_0RCTDirectEventBlock);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onMountError, ABI28_0_0RCTDirectEventBlock);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onBarCodeRead, ABI28_0_0RCTDirectEventBlock);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onFacesDetected, ABI28_0_0RCTDirectEventBlock);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onPictureSaved, ABI28_0_0RCTDirectEventBlock);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIView *)view
{
  return [[ABI28_0_0EXCamera alloc] initWithBridge:self.bridge];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(ABI28_0_0EXCameraTypeFront), @"back" : @(ABI28_0_0EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(ABI28_0_0EXCameraFlashModeOff),
               @"on" : @(ABI28_0_0EXCameraFlashModeOn),
               @"auto" : @(ABI28_0_0EXCameraFlashModeAuto),
               @"torch" : @(ABI28_0_0EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(ABI28_0_0EXCameraAutoFocusOn), @"off" : @(ABI28_0_0EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(ABI28_0_0EXCameraWhiteBalanceAuto),
               @"sunny" : @(ABI28_0_0EXCameraWhiteBalanceSunny),
               @"cloudy" : @(ABI28_0_0EXCameraWhiteBalanceCloudy),
               @"shadow" : @(ABI28_0_0EXCameraWhiteBalanceShadow),
               @"incandescent" : @(ABI28_0_0EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(ABI28_0_0EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(ABI28_0_0EXCameraVideo2160p),
               @"1080p": @(ABI28_0_0EXCameraVideo1080p),
               @"720p": @(ABI28_0_0EXCameraVideo720p),
               @"480p": @(ABI28_0_0EXCameraVideo4x3),
               @"4:3": @(ABI28_0_0EXCameraVideo4x3),
               },
           @"BarCodeType" : [[self class] validBarCodeTypes],
           @"FaceDetection" : [[self class] faceDetectorConstants]
           };
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onCameraReady", @"onMountError", @"onBarCodeRead", @"onFacesDetected", @"onPictureSaved"];
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

+ (NSDictionary *)faceDetectorConstants
{
#if __has_include("ABI28_0_0EXFaceDetectorManager.h")
  return [ABI28_0_0EXFaceDetectorManager constants];
#elif __has_include("ABI28_0_0EXFaceDetectorManagerStub.h")
  return [ABI28_0_0EXFaceDetectorManagerStub constants];
#endif
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(type, NSInteger, ABI28_0_0EXCamera)
{
  if (view.presetCamera != [ABI28_0_0RCTConvert NSInteger:json]) {
    [view setPresetCamera:[ABI28_0_0RCTConvert NSInteger:json]];
    [view updateType];
  }
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(flashMode, NSInteger, ABI28_0_0EXCamera)
{
  [view setFlashMode:[ABI28_0_0RCTConvert NSInteger:json]];
  [view updateFlashMode];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(autoFocus, NSInteger, ABI28_0_0EXCamera)
{
  [view setAutoFocus:[ABI28_0_0RCTConvert NSInteger:json]];
  [view updateFocusMode];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(focusDepth, NSNumber, ABI28_0_0EXCamera)
{
  [view setFocusDepth:[ABI28_0_0RCTConvert float:json]];
  [view updateFocusDepth];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(zoom, NSNumber, ABI28_0_0EXCamera)
{
  [view setZoom:[ABI28_0_0RCTConvert CGFloat:json]];
  [view updateZoom];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(whiteBalance, NSInteger, ABI28_0_0EXCamera)
{
  [view setWhiteBalance:[ABI28_0_0RCTConvert NSInteger:json]];
  [view updateWhiteBalance];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(pictureSize, NSString *, ABI28_0_0EXCamera)
{
  [view setPictureSize:[[self class] pictureSizes][[ABI28_0_0RCTConvert NSString:json]]];
  [view updatePictureSize];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectorEnabled, BOOL, ABI28_0_0EXCamera)
{
  view.isDetectingFaces = [ABI28_0_0RCTConvert BOOL:json];
  [view updateFaceDetecting:json];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionMode, NSInteger, ABI28_0_0EXCamera)
{
  [view updateFaceDetectionMode:json];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionLandmarks, NSString, ABI28_0_0EXCamera)
{
  [view updateFaceDetectionLandmarks:json];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionClassifications, NSString, ABI28_0_0EXCamera)
{
  [view updateFaceDetectionClassifications:json];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(barCodeScannerEnabled, BOOL, ABI28_0_0EXCamera)
{

  view.isReadingBarCodes = [ABI28_0_0RCTConvert BOOL:json];
  [view setupOrDisableBarcodeScanner];
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(barCodeTypes, NSArray, ABI28_0_0EXCamera)
{
  [view setBarCodeTypes:[ABI28_0_0RCTConvert NSArray:json]];
}

ABI28_0_0RCT_REMAP_METHOD(takePicture,
                 options:(NSDictionary *)options
                 ReactABI28_0_0Tag:(nonnull NSNumber *)ReactABI28_0_0Tag
                 resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI28_0_0EXCamera *> *viewRegistry) {
    ABI28_0_0EXCamera *view = viewRegistry[ReactABI28_0_0Tag];
    if (![view isKindOfClass:[ABI28_0_0EXCamera class]]) {
      ABI28_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI28_0_0EXCamera, got: %@", view);
    } else {
#if TARGET_IPHONE_SIMULATOR
      NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
      float quality = [options[@"quality"] floatValue];
      NSString *path = [ABI28_0_0EXFileSystem generatePathInDirectory:[self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];
      UIImage *generatedPhoto = [ABI28_0_0EXImageUtils generatePhotoOfSize:CGSizeMake(200, 200)];
      BOOL useFastMode = options[@"fastMode"] && [options[@"fastMode"] boolValue];
      if (useFastMode) {
        resolve(nil);
      }
      NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
      response[@"uri"] = [ABI28_0_0EXImageUtils writeImage:photoData toPath:path];
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
    }
  }];
}

ABI28_0_0RCT_REMAP_METHOD(record,
                 withOptions:(NSDictionary *)options
                 ReactABI28_0_0Tag:(nonnull NSNumber *)ReactABI28_0_0Tag
                 resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_RECORDING_FAILED", @"Video recording is not supported on a simulator.", nil);
  return;
#endif
  [self.bridge.uiManager addUIBlock:^(__unused ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI28_0_0EXCamera *> *viewRegistry) {
    ABI28_0_0EXCamera *view = viewRegistry[ReactABI28_0_0Tag];
    if (![view isKindOfClass:[ABI28_0_0EXCamera class]]) {
      ABI28_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI28_0_0EXCamera, got: %@", view);
    } else {
      [view record:options resolve:resolve reject:reject];
    }
  }];
}

ABI28_0_0RCT_REMAP_METHOD(stopRecording, ReactABI28_0_0Tag:(nonnull NSNumber *)ReactABI28_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI28_0_0EXCamera *> *viewRegistry) {
    ABI28_0_0EXCamera *view = viewRegistry[ReactABI28_0_0Tag];
    if (![view isKindOfClass:[ABI28_0_0EXCamera class]]) {
      ABI28_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI28_0_0EXCamera, got: %@", view);
    } else {
      [view stopRecording];
    }
  }];
}

ABI28_0_0RCT_EXPORT_METHOD(resumePreview:(nonnull NSNumber *)ReactABI28_0_0Tag)
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  [self.bridge.uiManager addUIBlock:^(__unused ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI28_0_0EXCamera *> *viewRegistry) {
    ABI28_0_0EXCamera *view = viewRegistry[ReactABI28_0_0Tag];
    if (![view isKindOfClass:[ABI28_0_0EXCamera class]]) {
      ABI28_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI28_0_0EXCamera, got: %@", view);
    } else {
      [view resumePreview];
    }
  }];
}

ABI28_0_0RCT_EXPORT_METHOD(pausePreview:(nonnull NSNumber *)ReactABI28_0_0Tag)
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  [self.bridge.uiManager addUIBlock:^(__unused ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI28_0_0EXCamera *> *viewRegistry) {
    ABI28_0_0EXCamera *view = viewRegistry[ReactABI28_0_0Tag];
    if (![view isKindOfClass:[ABI28_0_0EXCamera class]]) {
      ABI28_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI28_0_0EXCamera, got: %@", view);
    } else {
      [view pausePreview];
    }
  }];
}

ABI28_0_0RCT_REMAP_METHOD(getAvailablePictureSizes,
                 ratio:(NSString *)ratio
                 ReactABI28_0_0Tag:(nonnull NSNumber *)ReactABI28_0_0Tag
                 resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
  resolve([[[self class] pictureSizes] allKeys]);
}

@end
