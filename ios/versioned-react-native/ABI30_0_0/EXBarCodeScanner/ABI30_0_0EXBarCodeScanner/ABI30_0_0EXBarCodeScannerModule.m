// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXBarCodeScanner/ABI30_0_0EXBarCodeScannerModule.h>
#import <ABI30_0_0EXBarCodeScanner/ABI30_0_0EXBarCodeScannerUtils.h>
#import <ABI30_0_0EXImageLoaderInterface/ABI30_0_0EXImageLoaderInterface.h>

@interface ABI30_0_0EXBarCodeScannerModule ()

@property (nonatomic, weak) ABI30_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI30_0_0EXImageLoaderInterface> imageLoader;

@end

@implementation ABI30_0_0EXBarCodeScannerModule

ABI30_0_0EX_EXPORT_MODULE(ExpoBarCodeScannerModule);

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _imageLoader = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXImageLoaderInterface)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type": @{
               @"front": @(ABI30_0_0EXCameraTypeFront),
               @"back" : @(ABI30_0_0EXCameraTypeBack),
               },
           @"BarCodeType": [ABI30_0_0EXBarCodeScannerUtils validBarCodeTypes],
           };
}

ABI30_0_0EX_EXPORT_METHOD_AS(scanFromURLAsync,
                    scanFromURLAsync:(NSString *)url
                    barCodeTypes:(NSArray *)barCodeTypes
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
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
