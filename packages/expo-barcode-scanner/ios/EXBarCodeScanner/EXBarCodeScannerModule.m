// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBarCodeScanner/EXBarCodeScannerModule.h>
#import <EXBarCodeScanner/EXBarCodeScannerUtils.h>
#import <UMImageLoaderInterface/UMImageLoaderInterface.h>

@interface EXBarCodeScannerModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<UMImageLoaderInterface> imageLoader;

@end

@implementation EXBarCodeScannerModule

UM_EXPORT_MODULE(ExpoBarCodeScannerModule);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _imageLoader = [moduleRegistry getModuleImplementingProtocol:@protocol(UMImageLoaderInterface)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type": @{
               @"front": @(EXCameraTypeFront),
               @"back" : @(EXCameraTypeBack),
               },
           @"BarCodeType": [EXBarCodeScannerUtils validBarCodeTypes],
           };
}

UM_EXPORT_METHOD_AS(scanFromURLAsync,
                    scanFromURLAsync:(NSString *)url
                    barCodeTypes:(NSArray *)barCodeTypes
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
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
