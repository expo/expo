// Copyright 2016-present 650 Industries. All rights reserved.

#import <EDEXBarCodeScannerModule.h>
#import <EDEXBarCodeScannerUtils.h>
#import <EDEXBarCodeCameraRequester.h>
//#import <EDUMImageLoaderInterface.h>
#import <EDUMPermissionsInterface.h>
#import <EDUMPermissionsMethodsDelegate.h>

@interface EDEXBarCodeScannerModule ()

@property (nonatomic, weak) EDUMModuleRegistry *moduleRegistry;
//@property (nonatomic, weak) id<EDUMImageLoaderInterface> imageLoader;
@property (nonatomic, weak) id<EDUMPermissionsInterface> permissionsManager;

@end

@implementation EDEXBarCodeScannerModule

EDUM_EXPORT_MODULE(ExpoDevelopmentClientExpoBarCodeScannerModule);

- (void)setModuleRegistry:(EDUMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
//  _imageLoader = [moduleRegistry getModuleImplementingProtocol:@protocol(EDUMImageLoaderInterface)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EDUMPermissionsInterface)];
  [EDUMPermissionsMethodsDelegate registerRequesters:@[[EDEXBareCodeCameraRequester new]] withPermissionsManager:_permissionsManager];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type": @{
               @"front": @(EDEXCameraTypeFront),
               @"back" : @(EDEXCameraTypeBack),
               },
           @"BarCodeType": [EDEXBarCodeScannerUtils validBarCodeTypes],
           };
}

EDUM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(EDUMPromiseResolveBlock)resolve
                    rejecter:(EDUMPromiseRejectBlock)reject)
{
  [EDUMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[EDEXBareCodeCameraRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

EDUM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(EDUMPromiseResolveBlock)resolve
                    rejecter:(EDUMPromiseRejectBlock)reject)
{
  [EDUMPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[EDEXBareCodeCameraRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

//EDUM_EXPORT_METHOD_AS(scanFromURLAsync,
//                    scanFromURLAsync:(NSString *)url
//                    barCodeTypes:(NSArray *)barCodeTypes
//                    resolver:(EDUMPromiseResolveBlock)resolve
//                    rejecter:(EDUMPromiseRejectBlock)reject)
//{
//  // We only support QR codes, so barCodeTypes is ignored
//  NSURL *imageURL = [NSURL URLWithString:url];
//  [_imageLoader loadImageForURL:imageURL completionHandler:^(NSError *error, UIImage *loadedImage) {
//    if (error != nil) {
//      reject(@"E_IMAGE_RETRIEVAL_ERROR", @"Could not get the image", error);
//      return;
//    }
//
//    CIDetector *detector = [CIDetector detectorOfType:CIDetectorTypeQRCode
//                                              context:nil
//                                              options:@{CIDetectorAccuracy:CIDetectorAccuracyHigh}];
//    if (detector)  {
//      NSArray *features = [detector featuresInImage:[[CIImage alloc] initWithCGImage:loadedImage.CGImage]];
//
//      NSMutableArray *result = [NSMutableArray arrayWithCapacity:1];
//      for (CIQRCodeFeature *feature in features)  {
//        [result addObject:@{
//                            @"type" : AVMetadataObjectTypeQRCode,
//                            @"data" : feature.messageString
//                            }];
//      }
//
//      resolve(result);
//    } else {
//      reject(@"E_SCANNER_INIT_FAILED", @"Could not initialize the barcode scanner", nil);
//    }
//  }];
//}

@end
