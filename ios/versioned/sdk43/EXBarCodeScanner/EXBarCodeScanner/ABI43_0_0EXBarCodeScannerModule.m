// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXBarCodeScanner/ABI43_0_0EXBarCodeScannerModule.h>
#import <ABI43_0_0EXBarCodeScanner/ABI43_0_0EXBarCodeScannerUtils.h>
#import <ABI43_0_0EXBarCodeScanner/ABI43_0_0EXBarCodeCameraRequester.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXImageLoaderInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsMethodsDelegate.h>

@interface ABI43_0_0EXBarCodeScannerModule ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI43_0_0EXImageLoaderInterface> imageLoader;
@property (nonatomic, weak) id<ABI43_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI43_0_0EXBarCodeScannerModule

ABI43_0_0EX_EXPORT_MODULE(ExpoBarCodeScannerModule);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _imageLoader = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXImageLoaderInterface)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXPermissionsInterface)];
  [ABI43_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI43_0_0EXBareCodeCameraRequester new]] withPermissionsManager:_permissionsManager];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type": @{
               @"front": @(ABI43_0_0EXCameraTypeFront),
               @"back" : @(ABI43_0_0EXCameraTypeBack),
               },
           @"BarCodeType": [ABI43_0_0EXBarCodeScannerUtils validBarCodeTypes],
           };
}

ABI43_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI43_0_0EXBareCodeCameraRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI43_0_0EXBareCodeCameraRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(scanFromURLAsync,
                    scanFromURLAsync:(NSString *)url
                    barCodeTypes:(NSArray *)barCodeTypes
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  // We only support QR codes, so barCodeTypes is ignored
  NSURL *imageURL = [NSURL URLWithString:url];
  [_imageLoader loadImageForURL:imageURL completionHandler:^(NSError *error, UIImage *loadedImage) {
    if (error != nil) {
      reject(@"E_IMAGE_RETRIEVAL_ERROR", @"Could not get the image", error);
      return;
    }
    
    CIDetector *detector = [CIDetector detectorOfType:CIDetectorTypeQRCode
                                              context:nil
                                              options:@{CIDetectorAccuracy:CIDetectorAccuracyHigh}];
    if (detector)  {
      NSArray *features = [detector featuresInImage:[[CIImage alloc] initWithCGImage:loadedImage.CGImage]];
      
      NSMutableArray *result = [NSMutableArray arrayWithCapacity:1];
      for (CIQRCodeFeature *feature in features)  {
        [result addObject:[ABI43_0_0EXBarCodeScannerUtils ciQRCodeFeatureToDicitionary:feature barCodeType:AVMetadataObjectTypeQRCode]];
      }
      
      resolve(result);
    } else {
      reject(@"E_SCANNER_INIT_FAILED", @"Could not initialize the barcode scanner", nil);
    }
  }];
}

@end
