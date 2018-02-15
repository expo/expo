#import "ABI26_0_0EXCamera.h"
#import "ABI26_0_0EXCameraManager.h"
#import "ABI26_0_0EXFileSystem.h"
#import "ABI26_0_0EXImageUtils.h"
#import "ABI26_0_0EXUnversioned.h"
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTEventDispatcher.h>
#import <ReactABI26_0_0/ABI26_0_0RCTLog.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUtils.h>
#import <ReactABI26_0_0/UIView+ReactABI26_0_0.h>

#if __has_include("ABI26_0_0EXFaceDetectorManager.h")
#import "ABI26_0_0EXFaceDetectorManager.h"
#else
#import "ABI26_0_0EXFaceDetectorManagerStub.h"
#endif

@implementation ABI26_0_0EXCameraManager

ABI26_0_0RCT_EXPORT_MODULE(ExponentCameraManager);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onCameraReady, ABI26_0_0RCTDirectEventBlock);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onMountError, ABI26_0_0RCTDirectEventBlock);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onBarCodeRead, ABI26_0_0RCTDirectEventBlock);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onFacesDetected, ABI26_0_0RCTDirectEventBlock);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIView *)view
{
  return [[ABI26_0_0EXCamera alloc] initWithBridge:self.bridge];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(ABI26_0_0EXCameraTypeFront), @"back" : @(ABI26_0_0EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(ABI26_0_0EXCameraFlashModeOff),
               @"on" : @(ABI26_0_0EXCameraFlashModeOn),
               @"auto" : @(ABI26_0_0EXCameraFlashModeAuto),
               @"torch" : @(ABI26_0_0EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(ABI26_0_0EXCameraAutoFocusOn), @"off" : @(ABI26_0_0EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(ABI26_0_0EXCameraWhiteBalanceAuto),
               @"sunny" : @(ABI26_0_0EXCameraWhiteBalanceSunny),
               @"cloudy" : @(ABI26_0_0EXCameraWhiteBalanceCloudy),
               @"shadow" : @(ABI26_0_0EXCameraWhiteBalanceShadow),
               @"incandescent" : @(ABI26_0_0EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(ABI26_0_0EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(ABI26_0_0EXCameraVideo2160p),
               @"1080p": @(ABI26_0_0EXCameraVideo1080p),
               @"720p": @(ABI26_0_0EXCameraVideo720p),
               @"480p": @(ABI26_0_0EXCameraVideo4x3),
               @"4:3": @(ABI26_0_0EXCameraVideo4x3),
               },
           @"BarCodeType" : [[self class] validBarCodeTypes],
           @"FaceDetection" : [[self  class] faceDetectorConstants]
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

+ (NSDictionary *)faceDetectorConstants
{
#if __has_include("ABI26_0_0EXFaceDetectorManager.h")
  return [ABI26_0_0EXFaceDetectorManager constants];
#elif __has_include("ABI26_0_0EXFaceDetectorManagerStub.h")
  return [ABI26_0_0EXFaceDetectorManagerStub constants];
#endif
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(type, NSInteger, ABI26_0_0EXCamera)
{
  if (view.presetCamera != [ABI26_0_0RCTConvert NSInteger:json]) {
    [view setPresetCamera:[ABI26_0_0RCTConvert NSInteger:json]];
    [view updateType];
  }
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(flashMode, NSInteger, ABI26_0_0EXCamera)
{
  [view setFlashMode:[ABI26_0_0RCTConvert NSInteger:json]];
  [view updateFlashMode];
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(autoFocus, NSInteger, ABI26_0_0EXCamera)
{
  [view setAutoFocus:[ABI26_0_0RCTConvert NSInteger:json]];
  [view updateFocusMode];
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(focusDepth, NSNumber, ABI26_0_0EXCamera)
{
  [view setFocusDepth:[ABI26_0_0RCTConvert float:json]];
  [view updateFocusDepth];
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(zoom, NSNumber, ABI26_0_0EXCamera)
{
  [view setZoom:[ABI26_0_0RCTConvert CGFloat:json]];
  [view updateZoom];
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(whiteBalance, NSInteger, ABI26_0_0EXCamera)
{
  [view setWhiteBalance: [ABI26_0_0RCTConvert NSInteger:json]];
  [view updateWhiteBalance];
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectorEnabled, BOOL, ABI26_0_0EXCamera)
{
  [view updateFaceDetecting:json];
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionMode, NSInteger, ABI26_0_0EXCamera)
{
  [view updateFaceDetectionMode:json];
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionLandmarks, NSString, ABI26_0_0EXCamera)
{
  [view updateFaceDetectionLandmarks:json];
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionClassifications, NSString, ABI26_0_0EXCamera)
{
  [view updateFaceDetectionClassifications:json];
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(barCodeScannerEnabled, BOOL, ABI26_0_0EXCamera)
{

  view.barCodeReading = [ABI26_0_0RCTConvert BOOL:json];
  [view setupOrDisableBarcodeScanner];
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(barCodeTypes, NSArray, ABI26_0_0EXCamera)
{
  [view setBarCodeTypes:[ABI26_0_0RCTConvert NSArray:json]];
}

ABI26_0_0RCT_REMAP_METHOD(takePicture,
                 options:(NSDictionary *)options
                 ReactABI26_0_0Tag:(nonnull NSNumber *)ReactABI26_0_0Tag
                 resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
  float quality = [options[@"quality"] floatValue];
  NSString *path = [ABI26_0_0EXFileSystem generatePathInDirectory:[self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];
  UIImage *generatedPhoto = [ABI26_0_0EXImageUtils generatePhotoOfSize:CGSizeMake(200, 200)];
  NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
  response[@"uri"] = [ABI26_0_0EXImageUtils writeImage:photoData toPath:path];
  response[@"width"] = @(generatedPhoto.size.width);
  response[@"height"] = @(generatedPhoto.size.height);
  if ([options[@"base64"] boolValue]) {
    response[@"base64"] = [photoData base64EncodedStringWithOptions:0];
  }
  resolve(response);
#else
  [self.bridge.uiManager addUIBlock:^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI26_0_0EXCamera *> *viewRegistry) {
    ABI26_0_0EXCamera *view = viewRegistry[ReactABI26_0_0Tag];
    if (![view isKindOfClass:[ABI26_0_0EXCamera class]]) {
      ABI26_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI26_0_0EXCamera, got: %@", view);
    } else {
      [view takePicture:options resolve:resolve reject:reject];
    }
  }];
#endif
}

ABI26_0_0RCT_REMAP_METHOD(record,
                 withOptions:(NSDictionary *)options
                 ReactABI26_0_0Tag:(nonnull NSNumber *)ReactABI26_0_0Tag
                 resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_RECORDING_FAILED", @"Video recording is not supported on a simulator.", nil);
  return;
#endif
  [self.bridge.uiManager addUIBlock:^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI26_0_0EXCamera *> *viewRegistry) {
    ABI26_0_0EXCamera *view = viewRegistry[ReactABI26_0_0Tag];
    if (![view isKindOfClass:[ABI26_0_0EXCamera class]]) {
      ABI26_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI26_0_0EXCamera, got: %@", view);
    } else {
      [view record:options resolve:resolve reject:reject];
    }
  }];
}

ABI26_0_0RCT_REMAP_METHOD(stopRecording, ReactABI26_0_0Tag:(nonnull NSNumber *)ReactABI26_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI26_0_0EXCamera *> *viewRegistry) {
    ABI26_0_0EXCamera *view = viewRegistry[ReactABI26_0_0Tag];
    if (![view isKindOfClass:[ABI26_0_0EXCamera class]]) {
      ABI26_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI26_0_0EXCamera, got: %@", view);
    } else {
      [view stopRecording];
    }
  }];
}

@end
