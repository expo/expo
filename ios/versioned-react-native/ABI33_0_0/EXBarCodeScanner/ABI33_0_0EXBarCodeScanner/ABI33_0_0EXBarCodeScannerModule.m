// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXBarCodeScanner/ABI33_0_0EXBarCodeScannerModule.h>
#import <ABI33_0_0EXBarCodeScanner/ABI33_0_0EXBarCodeScannerUtils.h>
#import <ABI33_0_0UMImageLoaderInterface/ABI33_0_0UMImageLoaderInterface.h>

@interface ABI33_0_0EXBarCodeScannerModule ()

@property (nonatomic, weak) ABI33_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI33_0_0UMImageLoaderInterface> imageLoader;

@end

@implementation ABI33_0_0EXBarCodeScannerModule

ABI33_0_0UM_EXPORT_MODULE(ExpoBarCodeScannerModule);

- (void)setModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _imageLoader = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI33_0_0UMImageLoaderInterface)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type": @{
               @"front": @(ABI33_0_0EXCameraTypeFront),
               @"back" : @(ABI33_0_0EXCameraTypeBack),
               },
           @"BarCodeType": [ABI33_0_0EXBarCodeScannerUtils validBarCodeTypes],
           };
}

ABI33_0_0UM_EXPORT_METHOD_AS(scanFromURLAsync,
                    scanFromURLAsync:(NSString *)url
                    barCodeTypes:(NSArray *)barCodeTypes
                    resolver:(ABI33_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI33_0_0UMPromiseRejectBlock)reject)
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
        [result addObject:@{
                            @"type" : AVMetadataObjectTypeQRCode,
                            @"data" : feature.messageString
                            }];
      }
      
      resolve(result);
    } else {
      reject(@"E_SCANNER_INIT_FAILED", @"Could not initialize the barcode scanner", nil);
    }
  }];
}

@end
