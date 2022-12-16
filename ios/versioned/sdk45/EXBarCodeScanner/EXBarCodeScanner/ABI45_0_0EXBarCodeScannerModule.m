// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXBarCodeScanner/ABI45_0_0EXBarCodeScannerModule.h>
#import <ABI45_0_0EXBarCodeScanner/ABI45_0_0EXBarCodeScannerUtils.h>
#import <ABI45_0_0EXBarCodeScanner/ABI45_0_0EXBarCodeCameraRequester.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXImageLoaderInterface.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXPermissionsInterface.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXPermissionsMethodsDelegate.h>

@interface ABI45_0_0EXBarCodeScannerModule ()

@property (nonatomic, weak) ABI45_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI45_0_0EXImageLoaderInterface> imageLoader;
@property (nonatomic, weak) id<ABI45_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI45_0_0EXBarCodeScannerModule

ABI45_0_0EX_EXPORT_MODULE(ExpoBarCodeScannerModule);

- (void)setModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _imageLoader = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI45_0_0EXImageLoaderInterface)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI45_0_0EXPermissionsInterface)];
  [ABI45_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI45_0_0EXBareCodeCameraRequester new]] withPermissionsManager:_permissionsManager];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type": @{
               @"front": @(ABI45_0_0EXCameraTypeFront),
               @"back" : @(ABI45_0_0EXCameraTypeBack),
               },
           @"BarCodeType": [ABI45_0_0EXBarCodeScannerUtils validBarCodeTypes],
           };
}

ABI45_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  [ABI45_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI45_0_0EXBareCodeCameraRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI45_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  [ABI45_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI45_0_0EXBareCodeCameraRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI45_0_0EX_EXPORT_METHOD_AS(scanFromURLAsync,
                    scanFromURLAsync:(NSString *)url
                    barCodeTypes:(NSArray *)barCodeTypes
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
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
        [result addObject:[ABI45_0_0EXBarCodeScannerUtils ciQRCodeFeatureToDicitionary:feature barCodeType:AVMetadataObjectTypeQRCode]];
      }
      
      resolve(result);
    } else {
      reject(@"E_SCANNER_INIT_FAILED", @"Could not initialize the barcode scanner", nil);
    }
  }];
}

@end
