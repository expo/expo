#import "ABI25_0_0EXCamera.h"
#import "ABI25_0_0EXCameraManager.h"
#import "ABI25_0_0EXFileSystem.h"
#import "ABI25_0_0EXImageUtils.h"
#import "ABI25_0_0EXUnversioned.h"
#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManager.h>
#import <ReactABI25_0_0/ABI25_0_0RCTEventDispatcher.h>
#import <ReactABI25_0_0/ABI25_0_0RCTLog.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUtils.h>
#import <ReactABI25_0_0/UIView+ReactABI25_0_0.h>

#if __has_include("ABI25_0_0EXFaceDetectorManager.h")
#import "ABI25_0_0EXFaceDetectorManager.h"
#else
#import "ABI25_0_0EXFaceDetectorManagerStub.h"
#endif

@implementation ABI25_0_0EXCameraManager

ABI25_0_0RCT_EXPORT_MODULE(ExponentCameraManager);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onCameraReady, ABI25_0_0RCTDirectEventBlock);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onMountError, ABI25_0_0RCTDirectEventBlock);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onBarCodeRead, ABI25_0_0RCTDirectEventBlock);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onFacesDetected, ABI25_0_0RCTDirectEventBlock);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIView *)view
{
  return [[ABI25_0_0EXCamera alloc] initWithBridge:self.bridge];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(ABI25_0_0EXCameraTypeFront), @"back" : @(ABI25_0_0EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(ABI25_0_0EXCameraFlashModeOff),
               @"on" : @(ABI25_0_0EXCameraFlashModeOn),
               @"auto" : @(ABI25_0_0EXCameraFlashModeAuto),
               @"torch" : @(ABI25_0_0EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(ABI25_0_0EXCameraAutoFocusOn), @"off" : @(ABI25_0_0EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(ABI25_0_0EXCameraWhiteBalanceAuto),
               @"sunny" : @(ABI25_0_0EXCameraWhiteBalanceSunny),
               @"cloudy" : @(ABI25_0_0EXCameraWhiteBalanceCloudy),
               @"shadow" : @(ABI25_0_0EXCameraWhiteBalanceShadow),
               @"incandescent" : @(ABI25_0_0EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(ABI25_0_0EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(ABI25_0_0EXCameraVideo2160p),
               @"1080p": @(ABI25_0_0EXCameraVideo1080p),
               @"720p": @(ABI25_0_0EXCameraVideo720p),
               @"480p": @(ABI25_0_0EXCameraVideo4x3),
               @"4:3": @(ABI25_0_0EXCameraVideo4x3),
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
#if __has_include("ABI25_0_0EXFaceDetectorManager.h")
  return [ABI25_0_0EXFaceDetectorManager constants];
#elif __has_include("ABI25_0_0EXFaceDetectorManagerStub.h")
  return [ABI25_0_0EXFaceDetectorManagerStub constants];
#endif
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(type, NSInteger, ABI25_0_0EXCamera)
{
  if (view.presetCamera != [ABI25_0_0RCTConvert NSInteger:json]) {
    [view setPresetCamera:[ABI25_0_0RCTConvert NSInteger:json]];
    [view updateType];
  }
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(flashMode, NSInteger, ABI25_0_0EXCamera)
{
  [view setFlashMode:[ABI25_0_0RCTConvert NSInteger:json]];
  [view updateFlashMode];
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(autoFocus, NSInteger, ABI25_0_0EXCamera)
{
  [view setAutoFocus:[ABI25_0_0RCTConvert NSInteger:json]];
  [view updateFocusMode];
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(focusDepth, NSNumber, ABI25_0_0EXCamera)
{
  [view setFocusDepth:[ABI25_0_0RCTConvert float:json]];
  [view updateFocusDepth];
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(zoom, NSNumber, ABI25_0_0EXCamera)
{
  [view setZoom:[ABI25_0_0RCTConvert CGFloat:json]];
  [view updateZoom];
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(whiteBalance, NSInteger, ABI25_0_0EXCamera)
{
  [view setWhiteBalance: [ABI25_0_0RCTConvert NSInteger:json]];
  [view updateWhiteBalance];
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectorEnabled, BOOL, ABI25_0_0EXCamera)
{
  [view updateFaceDetecting:json];
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionMode, NSInteger, ABI25_0_0EXCamera)
{
  [view updateFaceDetectionMode:json];
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionLandmarks, NSString, ABI25_0_0EXCamera)
{
  [view updateFaceDetectionLandmarks:json];
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionClassifications, NSString, ABI25_0_0EXCamera)
{
  [view updateFaceDetectionClassifications:json];
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(barCodeScannerEnabled, BOOL, ABI25_0_0EXCamera)
{

  view.barCodeReading = [ABI25_0_0RCTConvert BOOL:json];
  [view setupOrDisableBarcodeScanner];
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(barCodeTypes, NSArray, ABI25_0_0EXCamera)
{
  [view setBarCodeTypes:[ABI25_0_0RCTConvert NSArray:json]];
}

ABI25_0_0RCT_REMAP_METHOD(takePicture,
                 options:(NSDictionary *)options
                 ReactABI25_0_0Tag:(nonnull NSNumber *)ReactABI25_0_0Tag
                 resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
  float quality = [options[@"quality"] floatValue];
  NSString *path = [ABI25_0_0EXFileSystem generatePathInDirectory:[self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];
  UIImage *generatedPhoto = [ABI25_0_0EXImageUtils generatePhotoOfSize:CGSizeMake(200, 200)];
  NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
  response[@"uri"] = [ABI25_0_0EXImageUtils writeImage:photoData toPath:path];
  response[@"width"] = @(generatedPhoto.size.width);
  response[@"height"] = @(generatedPhoto.size.height);
  if ([options[@"base64"] boolValue]) {
    response[@"base64"] = [photoData base64EncodedStringWithOptions:0];
  }
  resolve(response);
#else
  [self.bridge.uiManager addUIBlock:^(__unused ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI25_0_0EXCamera *> *viewRegistry) {
    ABI25_0_0EXCamera *view = viewRegistry[ReactABI25_0_0Tag];
    if (![view isKindOfClass:[ABI25_0_0EXCamera class]]) {
      ABI25_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI25_0_0EXCamera, got: %@", view);
    } else {
      [view takePicture:options resolve:resolve reject:reject];
    }
  }];
#endif
}

ABI25_0_0RCT_REMAP_METHOD(record,
                 withOptions:(NSDictionary *)options
                 ReactABI25_0_0Tag:(nonnull NSNumber *)ReactABI25_0_0Tag
                 resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_RECORDING_FAILED", @"Video recording is not supported on a simulator.", nil);
  return;
#endif
  [self.bridge.uiManager addUIBlock:^(__unused ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI25_0_0EXCamera *> *viewRegistry) {
    ABI25_0_0EXCamera *view = viewRegistry[ReactABI25_0_0Tag];
    if (![view isKindOfClass:[ABI25_0_0EXCamera class]]) {
      ABI25_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI25_0_0EXCamera, got: %@", view);
    } else {
      [view record:options resolve:resolve reject:reject];
    }
  }];
}

ABI25_0_0RCT_REMAP_METHOD(stopRecording, ReactABI25_0_0Tag:(nonnull NSNumber *)ReactABI25_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI25_0_0EXCamera *> *viewRegistry) {
    ABI25_0_0EXCamera *view = viewRegistry[ReactABI25_0_0Tag];
    if (![view isKindOfClass:[ABI25_0_0EXCamera class]]) {
      ABI25_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI25_0_0EXCamera, got: %@", view);
    } else {
      [view stopRecording];
    }
  }];
}

@end
