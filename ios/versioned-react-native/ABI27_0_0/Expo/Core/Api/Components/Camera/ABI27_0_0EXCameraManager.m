#import "ABI27_0_0EXCamera.h"
#import "ABI27_0_0EXCameraManager.h"
#import "ABI27_0_0EXFileSystem.h"
#import "ABI27_0_0EXImageUtils.h"
#import "ABI27_0_0EXUnversioned.h"
#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManager.h>
#import <ReactABI27_0_0/ABI27_0_0RCTEventDispatcher.h>
#import <ReactABI27_0_0/ABI27_0_0RCTLog.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUtils.h>
#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>

#if __has_include("ABI27_0_0EXFaceDetectorManager.h")
#import "ABI27_0_0EXFaceDetectorManager.h"
#else
#import "ABI27_0_0EXFaceDetectorManagerStub.h"
#endif

@implementation ABI27_0_0EXCameraManager

ABI27_0_0RCT_EXPORT_MODULE(ExponentCameraManager);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onCameraReady, ABI27_0_0RCTDirectEventBlock);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onMountError, ABI27_0_0RCTDirectEventBlock);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onBarCodeRead, ABI27_0_0RCTDirectEventBlock);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onFacesDetected, ABI27_0_0RCTDirectEventBlock);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIView *)view
{
  return [[ABI27_0_0EXCamera alloc] initWithBridge:self.bridge];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(ABI27_0_0EXCameraTypeFront), @"back" : @(ABI27_0_0EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(ABI27_0_0EXCameraFlashModeOff),
               @"on" : @(ABI27_0_0EXCameraFlashModeOn),
               @"auto" : @(ABI27_0_0EXCameraFlashModeAuto),
               @"torch" : @(ABI27_0_0EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(ABI27_0_0EXCameraAutoFocusOn), @"off" : @(ABI27_0_0EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(ABI27_0_0EXCameraWhiteBalanceAuto),
               @"sunny" : @(ABI27_0_0EXCameraWhiteBalanceSunny),
               @"cloudy" : @(ABI27_0_0EXCameraWhiteBalanceCloudy),
               @"shadow" : @(ABI27_0_0EXCameraWhiteBalanceShadow),
               @"incandescent" : @(ABI27_0_0EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(ABI27_0_0EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(ABI27_0_0EXCameraVideo2160p),
               @"1080p": @(ABI27_0_0EXCameraVideo1080p),
               @"720p": @(ABI27_0_0EXCameraVideo720p),
               @"480p": @(ABI27_0_0EXCameraVideo4x3),
               @"4:3": @(ABI27_0_0EXCameraVideo4x3),
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
#if __has_include("ABI27_0_0EXFaceDetectorManager.h")
  return [ABI27_0_0EXFaceDetectorManager constants];
#elif __has_include("ABI27_0_0EXFaceDetectorManagerStub.h")
  return [ABI27_0_0EXFaceDetectorManagerStub constants];
#endif
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(type, NSInteger, ABI27_0_0EXCamera)
{
  if (view.presetCamera != [ABI27_0_0RCTConvert NSInteger:json]) {
    [view setPresetCamera:[ABI27_0_0RCTConvert NSInteger:json]];
    [view updateType];
  }
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(flashMode, NSInteger, ABI27_0_0EXCamera)
{
  [view setFlashMode:[ABI27_0_0RCTConvert NSInteger:json]];
  [view updateFlashMode];
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(autoFocus, NSInteger, ABI27_0_0EXCamera)
{
  [view setAutoFocus:[ABI27_0_0RCTConvert NSInteger:json]];
  [view updateFocusMode];
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(focusDepth, NSNumber, ABI27_0_0EXCamera)
{
  [view setFocusDepth:[ABI27_0_0RCTConvert float:json]];
  [view updateFocusDepth];
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(zoom, NSNumber, ABI27_0_0EXCamera)
{
  [view setZoom:[ABI27_0_0RCTConvert CGFloat:json]];
  [view updateZoom];
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(whiteBalance, NSInteger, ABI27_0_0EXCamera)
{
  [view setWhiteBalance: [ABI27_0_0RCTConvert NSInteger:json]];
  [view updateWhiteBalance];
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectorEnabled, BOOL, ABI27_0_0EXCamera)
{
  [view updateFaceDetecting:json];
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionMode, NSInteger, ABI27_0_0EXCamera)
{
  [view updateFaceDetectionMode:json];
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionLandmarks, NSString, ABI27_0_0EXCamera)
{
  [view updateFaceDetectionLandmarks:json];
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(faceDetectionClassifications, NSString, ABI27_0_0EXCamera)
{
  [view updateFaceDetectionClassifications:json];
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(barCodeScannerEnabled, BOOL, ABI27_0_0EXCamera)
{

  view.barCodeReading = [ABI27_0_0RCTConvert BOOL:json];
  [view setupOrDisableBarcodeScanner];
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(barCodeTypes, NSArray, ABI27_0_0EXCamera)
{
  [view setBarCodeTypes:[ABI27_0_0RCTConvert NSArray:json]];
}

ABI27_0_0RCT_REMAP_METHOD(takePicture,
                 options:(NSDictionary *)options
                 ReactABI27_0_0Tag:(nonnull NSNumber *)ReactABI27_0_0Tag
                 resolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
  float quality = [options[@"quality"] floatValue];
  NSString *path = [ABI27_0_0EXFileSystem generatePathInDirectory:[self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];
  UIImage *generatedPhoto = [ABI27_0_0EXImageUtils generatePhotoOfSize:CGSizeMake(200, 200)];
  NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
  response[@"uri"] = [ABI27_0_0EXImageUtils writeImage:photoData toPath:path];
  response[@"width"] = @(generatedPhoto.size.width);
  response[@"height"] = @(generatedPhoto.size.height);
  if ([options[@"base64"] boolValue]) {
    response[@"base64"] = [photoData base64EncodedStringWithOptions:0];
  }
  resolve(response);
#else
  [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI27_0_0EXCamera *> *viewRegistry) {
    ABI27_0_0EXCamera *view = viewRegistry[ReactABI27_0_0Tag];
    if (![view isKindOfClass:[ABI27_0_0EXCamera class]]) {
      ABI27_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI27_0_0EXCamera, got: %@", view);
    } else {
      [view takePicture:options resolve:resolve reject:reject];
    }
  }];
#endif
}

ABI27_0_0RCT_REMAP_METHOD(record,
                 withOptions:(NSDictionary *)options
                 ReactABI27_0_0Tag:(nonnull NSNumber *)ReactABI27_0_0Tag
                 resolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_RECORDING_FAILED", @"Video recording is not supported on a simulator.", nil);
  return;
#endif
  [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI27_0_0EXCamera *> *viewRegistry) {
    ABI27_0_0EXCamera *view = viewRegistry[ReactABI27_0_0Tag];
    if (![view isKindOfClass:[ABI27_0_0EXCamera class]]) {
      ABI27_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI27_0_0EXCamera, got: %@", view);
    } else {
      [view record:options resolve:resolve reject:reject];
    }
  }];
}

ABI27_0_0RCT_REMAP_METHOD(stopRecording, ReactABI27_0_0Tag:(nonnull NSNumber *)ReactABI27_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI27_0_0EXCamera *> *viewRegistry) {
    ABI27_0_0EXCamera *view = viewRegistry[ReactABI27_0_0Tag];
    if (![view isKindOfClass:[ABI27_0_0EXCamera class]]) {
      ABI27_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI27_0_0EXCamera, got: %@", view);
    } else {
      [view stopRecording];
    }
  }];
}

@end
