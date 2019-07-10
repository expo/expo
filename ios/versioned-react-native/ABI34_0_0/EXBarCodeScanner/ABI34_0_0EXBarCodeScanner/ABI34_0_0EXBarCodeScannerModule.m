// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXBarCodeScanner/ABI34_0_0EXBarCodeScannerModule.h>
#import <ABI34_0_0EXBarCodeScanner/ABI34_0_0EXBarCodeScannerUtils.h>
#import <ABI34_0_0UMImageLoaderInterface/ABI34_0_0UMImageLoaderInterface.h>

@interface ABI34_0_0EXBarCodeScannerModule ()

@property (nonatomic, weak) ABI34_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI34_0_0UMImageLoaderInterface> imageLoader;

@end

@implementation ABI34_0_0EXBarCodeScannerModule

ABI34_0_0UM_EXPORT_MODULE(ExpoBarCodeScannerModule);

- (void)setModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _imageLoader = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMImageLoaderInterface)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type": @{
               @"front": @(ABI34_0_0EXCameraTypeFront),
               @"back" : @(ABI34_0_0EXCameraTypeBack),
               },
           @"BarCodeType": [ABI34_0_0EXBarCodeScannerUtils validBarCodeTypes],
           };
}

ABI34_0_0UM_EXPORT_METHOD_AS(scanFromURLAsync,
                    scanFromURLAsync:(NSString *)url
                    barCodeTypes:(NSArray *)barCodeTypes
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
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
