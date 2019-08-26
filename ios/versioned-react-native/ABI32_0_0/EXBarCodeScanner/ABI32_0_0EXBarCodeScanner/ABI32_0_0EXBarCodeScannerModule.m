// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXBarCodeScanner/ABI32_0_0EXBarCodeScannerModule.h>
#import <ABI32_0_0EXBarCodeScanner/ABI32_0_0EXBarCodeScannerUtils.h>
#import <ABI32_0_0EXImageLoaderInterface/ABI32_0_0EXImageLoaderInterface.h>

@interface ABI32_0_0EXBarCodeScannerModule ()

@property (nonatomic, weak) ABI32_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI32_0_0EXImageLoaderInterface> imageLoader;

@end

@implementation ABI32_0_0EXBarCodeScannerModule

ABI32_0_0EX_EXPORT_MODULE(ExpoBarCodeScannerModule);

- (void)setModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _imageLoader = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI32_0_0EXImageLoaderInterface)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type": @{
               @"front": @(ABI32_0_0EXCameraTypeFront),
               @"back" : @(ABI32_0_0EXCameraTypeBack),
               },
           @"BarCodeType": [ABI32_0_0EXBarCodeScannerUtils validBarCodeTypes],
           };
}

ABI32_0_0EX_EXPORT_METHOD_AS(scanFromURLAsync,
                    scanFromURLAsync:(NSString *)url
                    barCodeTypes:(NSArray *)barCodeTypes
                    resolver:(ABI32_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI32_0_0EXPromiseRejectBlock)reject)
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
