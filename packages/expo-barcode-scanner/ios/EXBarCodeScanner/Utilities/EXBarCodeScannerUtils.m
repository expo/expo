// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import <ZXingObjC/ZXingObjCCore.h>
#import <EXBarCodeScanner/EXBarCodeScannerUtils.h>

@implementation EXBarCodeScannerUtils

+ (NSDictionary *)validBarCodeTypes
{
    NSMutableDictionary *validTypes = [@{
      @"upc_e" : AVMetadataObjectTypeUPCECode,
      @"code39" : AVMetadataObjectTypeCode39Code,
      @"code39mod43" : AVMetadataObjectTypeCode39Mod43Code,
      @"ean13" : AVMetadataObjectTypeEAN13Code,
      @"ean8" : AVMetadataObjectTypeEAN8Code,
      @"code93" : AVMetadataObjectTypeCode93Code,
      @"code128" : AVMetadataObjectTypeCode128Code,
      @"pdf417" : AVMetadataObjectTypePDF417Code,
      @"qr" : AVMetadataObjectTypeQRCode,
      @"aztec" : AVMetadataObjectTypeAztecCode,
      @"interleaved2of5" : AVMetadataObjectTypeInterleaved2of5Code,
      @"itf14" : AVMetadataObjectTypeITF14Code,
      @"datamatrix" : AVMetadataObjectTypeDataMatrixCode,
    } mutableCopy];
#ifdef __IPHONE_15_4
    if (@available(iOS 15.4, *)) {
      validTypes[@"codabar"] = AVMetadataObjectTypeCodabarCode;
    }
#endif
    return validTypes;
}

+ (AVCaptureVideoOrientation)videoOrientationForInterfaceOrientation:(UIInterfaceOrientation)orientation
{
  switch (orientation) {
    case UIInterfaceOrientationPortrait:
      return AVCaptureVideoOrientationPortrait;
    case UIInterfaceOrientationPortraitUpsideDown:
      return AVCaptureVideoOrientationPortraitUpsideDown;
    case UIInterfaceOrientationLandscapeRight:
      return AVCaptureVideoOrientationLandscapeRight;
    case UIInterfaceOrientationLandscapeLeft:
      return AVCaptureVideoOrientationLandscapeLeft;
    default:
      return 0;
  }
}

+ (AVCaptureDevice *)deviceWithMediaType:(AVMediaType)mediaType
                      preferringPosition:(AVCaptureDevicePosition)position
{
  return [AVCaptureDevice defaultDeviceWithDeviceType:AVCaptureDeviceTypeBuiltInWideAngleCamera mediaType:mediaType position:position];
}

+ (NSDictionary *)ciQRCodeFeatureToDicitionary:(CIQRCodeFeature *)barCodeScannerResult barCodeType:(NSString *)type
{
  NSMutableDictionary *result = [NSMutableDictionary new];
  result[@"type"] = type;
  result[@"data"] = barCodeScannerResult.messageString;
  
  if (!CGRectIsEmpty(barCodeScannerResult.bounds)) {
    NSMutableArray<NSDictionary *> *cornerPointsResult = [NSMutableArray new];
    for (NSValue *nsPoint in @[
      [NSValue valueWithCGPoint:barCodeScannerResult.topLeft],
      [NSValue valueWithCGPoint:barCodeScannerResult.topRight],
      [NSValue valueWithCGPoint:barCodeScannerResult.bottomRight],
      [NSValue valueWithCGPoint:barCodeScannerResult.bottomLeft]
    ]) {
      CGPoint point = [nsPoint CGPointValue];
      [cornerPointsResult addObject:@{
        @"x": @(point.x),
        @"y": @(point.y)
      }];
    }
    
    result[@"cornerPoints"] = cornerPointsResult;
    result[@"bounds"] = @{
      @"origin": @{
        @"x": @(barCodeScannerResult.bounds.origin.x),
        @"y": @(barCodeScannerResult.bounds.origin.y),
      },
      @"size": @{
        @"width": @(barCodeScannerResult.bounds.size.width),
        @"height": @(barCodeScannerResult.bounds.size.height),
      }
    };
  } else {
    [EXBarCodeScannerUtils addEmptyCornerPoints:result];
  }

  return result;
}

+ (NSDictionary *)avMetadataCodeObjectToDicitionary:(AVMetadataMachineReadableCodeObject *)barCodeScannerResult
{
  NSMutableDictionary *result = [NSMutableDictionary new];
  result[@"type"] = barCodeScannerResult.type;
  result[@"data"] = barCodeScannerResult.stringValue;
  
  if (barCodeScannerResult.corners.count) {
    NSMutableArray<NSDictionary *> *cornerPointsResult = [NSMutableArray new];
    for (NSDictionary *point in barCodeScannerResult.corners) {
      [cornerPointsResult addObject:@{
        @"x": point[@"X"],
        @"y": point[@"Y"]
      }];
    }
    result[@"cornerPoints"] = cornerPointsResult;
    result[@"bounds"] = @{
      @"origin": @{
        @"x": @(barCodeScannerResult.bounds.origin.x),
        @"y": @(barCodeScannerResult.bounds.origin.y),
      },
      @"size": @{
        @"width": @(barCodeScannerResult.bounds.size.width),
        @"height": @(barCodeScannerResult.bounds.size.height),
      }
    };
  } else {
    [EXBarCodeScannerUtils addEmptyCornerPoints:result];
  }
  return result;
}

+ (NSDictionary *)zxResultToDicitionary:(ZXResult *)barCodeScannerResult
{
  NSMutableDictionary *result = [NSMutableDictionary new];
  result[@"type"] = [EXBarCodeScannerUtils zxingFormatToString:barCodeScannerResult.barcodeFormat];
  
  // text contains characteres u'\0' (null character) that malforme resulting string, so we get rid of them
  NSMutableString* data = [NSMutableString new];
  for (int i = 0; i < [barCodeScannerResult.text length]; i++) {
    if ([barCodeScannerResult.text characterAtIndex:i] != u'\0') {
      [data appendFormat:@"%c", [barCodeScannerResult.text characterAtIndex:i]];
    }
  }
  result[@"data"] = data;
    
  return result;
}

+ (NSString *)zxingFormatToString:(ZXBarcodeFormat)format
{
  switch (format) {
    case kBarcodeFormatPDF417:
      return AVMetadataObjectTypePDF417Code;
    case kBarcodeFormatCode39:
      return AVMetadataObjectTypeCode39Code;
    case kBarcodeFormatCodabar:
#ifdef __IPHONE_15_4
      if (@available(iOS 15.4, *)) {
        return AVMetadataObjectTypeCodabarCode;
      }
#endif
      return @"unknown";
    default:
      return @"unknown";
  }
}

+ (void)addEmptyCornerPoints:(NSMutableDictionary *)result
{
  result[@"cornerPoints"] = @[];
  result[@"bounds"] = @{
    @"origin": @{
      @"x": @(0),
      @"y": @(0),
    },
    @"size": @{
      @"width": @(0),
      @"height": @(0),
    }
  };
}

@end
