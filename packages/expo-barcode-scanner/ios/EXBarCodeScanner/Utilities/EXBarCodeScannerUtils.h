// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class ZXResult;

@interface EXBarCodeScannerUtils : NSObject

+ (NSDictionary *)validBarCodeTypes;
+ (AVCaptureVideoOrientation)videoOrientationForInterfaceOrientation:(UIInterfaceOrientation)orientation;
+ (AVCaptureDevice *)deviceWithMediaType:(AVMediaType)mediaType
                      preferringPosition:(AVCaptureDevicePosition)position;

+ (NSDictionary *)ciQRCodeFeatureToDicitionary:(CIQRCodeFeature *)barCodeScannerResult barCodeType:(NSString *)type;
+ (NSDictionary *)avMetadataCodeObjectToDicitionary:(AVMetadataMachineReadableCodeObject *)result;
+ (NSDictionary *)zxResultToDicitionary:(ZXResult *)result;

@end
