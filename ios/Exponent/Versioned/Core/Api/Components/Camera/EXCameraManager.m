#import "EXCamera.h"
#import "EXCameraManager.h"
#import "EXFileSystem.h"
#import "EXImageUtils.h"
#import "EXUnversioned.h"
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#if __has_include("EXFaceDetectorManager.h")
#import "EXFaceDetectorManager.h"
#else
#import "EXFaceDetectorManagerStub.h"
#endif

@implementation EXCameraManager

RCT_EXPORT_MODULE(ExponentCameraManager);
RCT_EXPORT_VIEW_PROPERTY(onCameraReady, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onMountError, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onBarCodeRead, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onFacesDetected, RCTDirectEventBlock);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIView *)view
{
  return [[EXCamera alloc] initWithBridge:self.bridge];
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
#if __has_include("EXFaceDetectorManager.h")
  return [EXFaceDetectorManager constants];
#elif __has_include("EXFaceDetectorManagerStub.h")
  return [EXFaceDetectorManagerStub constants];
#endif
}

RCT_CUSTOM_VIEW_PROPERTY(type, NSInteger, EXCamera)
{
  if (view.presetCamera != [RCTConvert NSInteger:json]) {
    [view setPresetCamera:[RCTConvert NSInteger:json]];
    [view updateType];
  }
}

RCT_CUSTOM_VIEW_PROPERTY(flashMode, NSInteger, EXCamera)
{
  [view setFlashMode:[RCTConvert NSInteger:json]];
  [view updateFlashMode];
}

RCT_CUSTOM_VIEW_PROPERTY(autoFocus, NSInteger, EXCamera)
{
  [view setAutoFocus:[RCTConvert NSInteger:json]];
  [view updateFocusMode];
}

RCT_CUSTOM_VIEW_PROPERTY(focusDepth, NSNumber, EXCamera)
{
  [view setFocusDepth:[RCTConvert float:json]];
  [view updateFocusDepth];
}

RCT_CUSTOM_VIEW_PROPERTY(zoom, NSNumber, EXCamera)
{
  [view setZoom:[RCTConvert CGFloat:json]];
  [view updateZoom];
}

RCT_CUSTOM_VIEW_PROPERTY(whiteBalance, NSInteger, EXCamera)
{
  [view setWhiteBalance: [RCTConvert NSInteger:json]];
  [view updateWhiteBalance];
}

RCT_CUSTOM_VIEW_PROPERTY(faceDetectorEnabled, BOOL, EXCamera)
{
  [view updateFaceDetecting:json];
}

RCT_CUSTOM_VIEW_PROPERTY(faceDetectionMode, NSInteger, EXCamera)
{
  [view updateFaceDetectionMode:json];
}

RCT_CUSTOM_VIEW_PROPERTY(faceDetectionLandmarks, NSString, EXCamera)
{
  [view updateFaceDetectionLandmarks:json];
}

RCT_CUSTOM_VIEW_PROPERTY(faceDetectionClassifications, NSString, EXCamera)
{
  [view updateFaceDetectionClassifications:json];
}

RCT_CUSTOM_VIEW_PROPERTY(barCodeScannerEnabled, BOOL, EXCamera)
{

  view.barCodeReading = [RCTConvert BOOL:json];
  [view setupOrDisableBarcodeScanner];
}

RCT_CUSTOM_VIEW_PROPERTY(barCodeTypes, NSArray, EXCamera)
{
  [view setBarCodeTypes:[RCTConvert NSArray:json]];
}

RCT_REMAP_METHOD(takePicture,
                 options:(NSDictionary *)options
                 reactTag:(nonnull NSNumber *)reactTag
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
  float quality = [options[@"quality"] floatValue];
  NSString *path = [EXFileSystem generatePathInDirectory:[self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];
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
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, EXCamera *> *viewRegistry) {
    EXCamera *view = viewRegistry[reactTag];
    if (![view isKindOfClass:[EXCamera class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting EXCamera, got: %@", view);
    } else {
      [view takePicture:options resolve:resolve reject:reject];
    }
  }];
#endif
}

RCT_REMAP_METHOD(record,
                 withOptions:(NSDictionary *)options
                 reactTag:(nonnull NSNumber *)reactTag
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_RECORDING_FAILED", @"Video recording is not supported on a simulator.", nil);
  return;
#endif
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, EXCamera *> *viewRegistry) {
    EXCamera *view = viewRegistry[reactTag];
    if (![view isKindOfClass:[EXCamera class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting EXCamera, got: %@", view);
    } else {
      [view record:options resolve:resolve reject:reject];
    }
  }];
}

RCT_REMAP_METHOD(stopRecording, reactTag:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, EXCamera *> *viewRegistry) {
    EXCamera *view = viewRegistry[reactTag];
    if (![view isKindOfClass:[EXCamera class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting EXCamera, got: %@", view);
    } else {
      [view stopRecording];
    }
  }];
}

@end
