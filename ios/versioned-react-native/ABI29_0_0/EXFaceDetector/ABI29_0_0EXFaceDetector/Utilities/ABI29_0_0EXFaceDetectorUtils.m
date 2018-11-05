//
//  ABI29_0_0EXFaceDetectorUtils.m
//  Exponent
//
//  Created by Stanisław Chmiela on 22.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <ABI29_0_0EXFaceDetector/ABI29_0_0EXFaceDetectorUtils.h>
#import <ABI29_0_0EXFaceDetector/ABI29_0_0EXFaceDetectorPointTransformCalculator.h>

NSString *const ABI29_0_0EXGMVDataOutputWidthKey = @"Width";
NSString *const ABI29_0_0EXGMVDataOutputHeightKey = @"Height";

@implementation ABI29_0_0EXFaceDetectorUtils

+ (NSDictionary *)constantsToExport
{
  return @{
           @"Mode" : @{
               @"fast" : @(ABI29_0_0EXFaceDetectionFastMode),
               @"accurate" : @(ABI29_0_0EXFaceDetectionAccurateMode)
               },
           @"Landmarks" : @{
               @"all" : @(ABI29_0_0EXFaceDetectAllLandmarks),
               @"none" : @(ABI29_0_0EXFaceDetectNoLandmarks)
               },
           @"Classifications" : @{
               @"all" : @(ABI29_0_0EXFaceRunAllClassifications),
               @"none" : @(ABI29_0_0EXFaceRunNoClassifications)
               }
           };
}

# pragma mark - GMVDataOutput transformations

+ (CGAffineTransform)transformFromDeviceVideoOrientation:(AVCaptureVideoOrientation)deviceVideoOrientation toInterfaceVideoOrientation:(AVCaptureVideoOrientation)interfaceVideoOrientation videoWidth:(NSNumber *)width videoHeight:(NSNumber *)height
{
  ABI29_0_0EXFaceDetectorPointTransformCalculator *calculator = [[ABI29_0_0EXFaceDetectorPointTransformCalculator alloc] initToTransformFromOrientation:deviceVideoOrientation toOrientation:interfaceVideoOrientation forVideoWidth:[width floatValue] andVideoHeight:[height floatValue]];
  return [calculator transform];
}

// Normally we would use `dataOutput.xScale`, `.yScale` and `.offset`.
// Unfortunately, it turns out that using these attributes results in different results
// on iPhone {6, 7} and iPhone 5S. On newer iPhones the transform works properly,
// whereas on iPhone 5S the scale is too big (~0.7, while it should be ~0.4) and the offset
// moves the face points away. This workaround (using screen + orientation + video resolution
// to calculate proper scale) has been proven to work all three devices.
+ (CGAffineTransform)transformFromDeviceOutput:(GMVDataOutput *)dataOutput withInterfaceOrientation:(AVCaptureVideoOrientation)interfaceVideoOrientation
{
  UIScreen *mainScreen = [UIScreen mainScreen];
  BOOL interfaceIsLandscape = interfaceVideoOrientation == AVCaptureVideoOrientationLandscapeLeft || interfaceVideoOrientation == AVCaptureVideoOrientationLandscapeRight;
  CGFloat interfaceWidth = interfaceIsLandscape ? mainScreen.bounds.size.height : mainScreen.bounds.size.width;
  CGFloat interfaceHeight = interfaceIsLandscape ? mainScreen.bounds.size.width : mainScreen.bounds.size.height;
  CGFloat xScale = interfaceWidth / [(NSNumber *)dataOutput.videoSettings[ABI29_0_0EXGMVDataOutputHeightKey] floatValue];
  CGFloat yScale = interfaceHeight / [(NSNumber *)dataOutput.videoSettings[ABI29_0_0EXGMVDataOutputWidthKey] floatValue];
  CGAffineTransform dataOutputTransform = CGAffineTransformIdentity;
  dataOutputTransform = CGAffineTransformScale(dataOutputTransform, xScale, yScale);
  return dataOutputTransform;
}

+ (CGAffineTransform)transformFromDeviceOutput:(GMVDataOutput *)dataOutput toInterfaceVideoOrientation:(AVCaptureVideoOrientation)interfaceVideoOrientation
{
  UIDeviceOrientation currentDeviceOrientation = [[UIDevice currentDevice] orientation];
  AVCaptureVideoOrientation deviceVideoOrientation = [self videoOrientationForDeviceOrientation:currentDeviceOrientation];
  
  NSNumber *videoWidth = dataOutput.videoSettings[ABI29_0_0EXGMVDataOutputWidthKey];
  NSNumber *videoHeight = dataOutput.videoSettings[ABI29_0_0EXGMVDataOutputHeightKey];
  
  CGAffineTransform interfaceTransform = [self transformFromDeviceVideoOrientation:deviceVideoOrientation toInterfaceVideoOrientation:interfaceVideoOrientation videoWidth:videoWidth videoHeight:videoHeight];
  
  CGAffineTransform dataOutputTransform = [self transformFromDeviceOutput:dataOutput withInterfaceOrientation:interfaceVideoOrientation];
  
  return CGAffineTransformConcat(interfaceTransform, dataOutputTransform);
}

# pragma mark - Enum conversion

+ (AVCaptureVideoOrientation)videoOrientationForDeviceOrientation:(UIDeviceOrientation)orientation
{
  switch (orientation) {
    case UIDeviceOrientationPortrait:
      return AVCaptureVideoOrientationPortrait;
    case UIDeviceOrientationPortraitUpsideDown:
      return AVCaptureVideoOrientationPortraitUpsideDown;
    case UIDeviceOrientationLandscapeLeft:
      return AVCaptureVideoOrientationLandscapeRight;
    case UIDeviceOrientationLandscapeRight:
      return AVCaptureVideoOrientationLandscapeLeft;
    default:
      return AVCaptureVideoOrientationPortrait;
  }
}

@end
