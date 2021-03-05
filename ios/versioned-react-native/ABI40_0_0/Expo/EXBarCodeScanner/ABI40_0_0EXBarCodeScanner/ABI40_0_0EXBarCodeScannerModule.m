// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXBarCodeScanner/ABI40_0_0EXBarCodeScannerModule.h>
#import <ABI40_0_0EXBarCodeScanner/ABI40_0_0EXBarCodeScannerUtils.h>
#import <ABI40_0_0EXBarCodeScanner/ABI40_0_0EXBarCodeCameraRequester.h>
#import <ABI40_0_0UMImageLoaderInterface/ABI40_0_0UMImageLoaderInterface.h>
#import <ABI40_0_0UMPermissionsInterface/ABI40_0_0UMPermissionsInterface.h>
#import <ABI40_0_0UMPermissionsInterface/ABI40_0_0UMPermissionsMethodsDelegate.h>

@interface ABI40_0_0EXBarCodeScannerModule ()

@property (nonatomic, weak) ABI40_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI40_0_0UMImageLoaderInterface> imageLoader;
@property (nonatomic, weak) id<ABI40_0_0UMPermissionsInterface> permissionsManager;

@end

@implementation ABI40_0_0EXBarCodeScannerModule

ABI40_0_0UM_EXPORT_MODULE(ExpoBarCodeScannerModule);

- (void)setModuleRegistry:(ABI40_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _imageLoader = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI40_0_0UMImageLoaderInterface)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI40_0_0UMPermissionsInterface)];
  [ABI40_0_0UMPermissionsMethodsDelegate registerRequesters:@[[ABI40_0_0EXBareCodeCameraRequester new]] withPermissionsManager:_permissionsManager];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type": @{
               @"front": @(ABI40_0_0EXCameraTypeFront),
               @"back" : @(ABI40_0_0EXCameraTypeBack),
               },
           @"BarCodeType": [ABI40_0_0EXBarCodeScannerUtils validBarCodeTypes],
           };
}

ABI40_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  [ABI40_0_0UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI40_0_0EXBareCodeCameraRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI40_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  [ABI40_0_0UMPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI40_0_0EXBareCodeCameraRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI40_0_0UM_EXPORT_METHOD_AS(scanFromURLAsync,
                    scanFromURLAsync:(NSString *)url
                    barCodeTypes:(NSArray *)barCodeTypes
                    resolver:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
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
        [result addObject:[ABI40_0_0EXBarCodeScannerUtils ciQRCodeFeatureToDicitionary:feature barCodeType:AVMetadataObjectTypeQRCode]];
      }
      
      resolve(result);
    } else {
      reject(@"E_SCANNER_INIT_FAILED", @"Could not initialize the barcode scanner", nil);
    }
  }];
}

@end
