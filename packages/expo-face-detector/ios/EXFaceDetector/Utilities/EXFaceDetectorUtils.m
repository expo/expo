//
//  EXFaceDetectorUtils.m
//  Exponent
//
//  Created by Stanisław Chmiela on 22.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXFaceDetector/EXFaceDetectorUtils.h>
#import <EXFaceDetector/EXFaceDetectorPointTransformCalculator.h>
#import "Firebase.h"

NSString *const EXGMVDataOutputWidthKey = @"Width";
NSString *const EXGMVDataOutputHeightKey = @"Height";

@implementation EXFaceDetectorUtils

+ (NSDictionary *)constantsToExport
{
  return @{
           @"Mode" : @{
               @"fast" : @(FIRVisionFaceDetectorPerformanceModeFast),
               @"accurate" : @(FIRVisionFaceDetectorPerformanceModeAccurate)
               },
           @"Landmarks" : @{
               @"all" : @(FIRVisionFaceDetectorLandmarkModeAll),
               @"none" : @(FIRVisionFaceDetectorLandmarkModeNone)
               },
           @"Classifications" : @{
               @"all" : @(FIRVisionFaceDetectorClassificationModeAll),
               @"none" : @(FIRVisionFaceDetectorClassificationModeAll)
               }
           };
}

# pragma mark - GMVDataOutput transformations

+ (CGAffineTransform)transformFromDeviceVideoOrientation:(AVCaptureVideoOrientation)deviceVideoOrientation toInterfaceVideoOrientation:(AVCaptureVideoOrientation)interfaceVideoOrientation videoWidth:(NSNumber *)width videoHeight:(NSNumber *)height
{
  EXFaceDetectorPointTransformCalculator *calculator = [[EXFaceDetectorPointTransformCalculator alloc] initToTransformFromOrientation:deviceVideoOrientation toOrientation:interfaceVideoOrientation forVideoWidth:[width floatValue] andVideoHeight:[height floatValue]];
  return [calculator transform];
}

// Normally we would use `dataOutput.xScale`, `.yScale` and `.offset`.
// Unfortunately, it turns out that using these attributes results in different results
// on iPhone {6, 7} and iPhone 5S. On newer iPhones the transform works properly,
// whereas on iPhone 5S the scale is too big (~0.7, while it should be ~0.4) and the offset
// moves the face points away. This workaround (using screen + orientation + video resolution
// to calculate proper scale) has been proven to work all three devices.
+ (CGAffineTransform)transformFromDeviceOutput:(AVCaptureVideoDataOutput *)dataOutput withInterfaceOrientation:(AVCaptureVideoOrientation)interfaceVideoOrientation
{
  UIScreen *mainScreen = [UIScreen mainScreen];
  BOOL interfaceIsLandscape = interfaceVideoOrientation == AVCaptureVideoOrientationLandscapeLeft || interfaceVideoOrientation == AVCaptureVideoOrientationLandscapeRight;
  CGFloat interfaceWidth = interfaceIsLandscape ? mainScreen.bounds.size.height : mainScreen.bounds.size.width;
  CGFloat interfaceHeight = interfaceIsLandscape ? mainScreen.bounds.size.width : mainScreen.bounds.size.height;
  CGFloat xScale = interfaceWidth / [(NSNumber *)dataOutput.videoSettings[EXGMVDataOutputHeightKey] floatValue];
  CGFloat yScale = interfaceHeight / [(NSNumber *)dataOutput.videoSettings[EXGMVDataOutputWidthKey] floatValue];
  CGAffineTransform dataOutputTransform = CGAffineTransformIdentity;
  dataOutputTransform = CGAffineTransformScale(dataOutputTransform, xScale, yScale);
  return dataOutputTransform;
}

+ (CGAffineTransform)transformFromDeviceOutput:(AVCaptureVideoDataOutput *)dataOutput toInterfaceVideoOrientation:(AVCaptureVideoOrientation)interfaceVideoOrientation
{
  UIDeviceOrientation currentDeviceOrientation = [[UIDevice currentDevice] orientation];
  AVCaptureVideoOrientation deviceVideoOrientation = [self videoOrientationForDeviceOrientation:currentDeviceOrientation];
  
  NSNumber *videoWidth = dataOutput.videoSettings[EXGMVDataOutputWidthKey];
  NSNumber *videoHeight = dataOutput.videoSettings[EXGMVDataOutputHeightKey];
  
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

# pragma mark - Image conversions

+ (UIImage *)convertBufferToUIImage:(CMSampleBufferRef)sampleBuffer previewSize:(CGSize)previewSize mirrored:(BOOL)mirrored
{
  CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
  CIImage *ciImage = [CIImage imageWithCVPixelBuffer:imageBuffer];
  // set correct orientation
  __block UIInterfaceOrientation orientation;
  dispatch_sync(dispatch_get_main_queue(), ^{
    orientation = [[UIApplication sharedApplication] statusBarOrientation];
  });
  UIInterfaceOrientation curOrientation = orientation;
  int orientationToApply = 1;
  if (curOrientation == UIInterfaceOrientationLandscapeLeft){
    orientationToApply =  mirrored ? kCGImagePropertyOrientationUpMirrored : kCGImagePropertyOrientationDown;
  } else if (curOrientation == UIInterfaceOrientationLandscapeRight){
    orientationToApply = mirrored ? kCGImagePropertyOrientationDownMirrored : kCGImagePropertyOrientationUp;
  } else if (curOrientation == UIInterfaceOrientationPortrait){
    orientationToApply = mirrored ? kCGImagePropertyOrientationLeftMirrored : kCGImagePropertyOrientationRight;
  } else if (curOrientation == UIInterfaceOrientationPortraitUpsideDown){
    orientationToApply = mirrored ? kCGImagePropertyOrientationRightMirrored : kCGImagePropertyOrientationLeft;
  }
  ciImage = [ciImage imageByApplyingOrientation:orientationToApply];
  
  // scale down CIImage
  float bufferWidth = CVPixelBufferGetWidth(imageBuffer);
  float bufferHeight = CVPixelBufferGetHeight(imageBuffer);
  float bufferSmallerDim = MIN(bufferWidth, bufferHeight);
  
  float scale = 400 / bufferSmallerDim;
  
  CIFilter* scaleFilter = [CIFilter filterWithName:@"CILanczosScaleTransform"];
  [scaleFilter setValue:ciImage forKey:kCIInputImageKey];
  [scaleFilter setValue:@(scale) forKey:kCIInputScaleKey];
  [scaleFilter setValue:@(1) forKey:kCIInputAspectRatioKey];
  ciImage = scaleFilter.outputImage;
  
  // convert to UIImage and crop to preview aspect ratio
  NSDictionary *contextOptions = @{kCIContextUseSoftwareRenderer : @(false)};
  CIContext *temporaryContext = [CIContext contextWithOptions:contextOptions];
  CGImageRef videoImage;
  CGRect boundingRect;
  if (curOrientation == UIInterfaceOrientationLandscapeLeft || curOrientation == UIInterfaceOrientationLandscapeRight) {
    boundingRect = CGRectMake(0, 0, bufferWidth*scale, bufferHeight*scale);
  } else {
    boundingRect = CGRectMake(0, 0, bufferHeight*scale, bufferWidth*scale);
  }
  videoImage = [temporaryContext createCGImage:ciImage fromRect:boundingRect];
  CGRect croppedSize = AVMakeRectWithAspectRatioInsideRect(previewSize, boundingRect);
  CGImageRef croppedCGImage = CGImageCreateWithImageInRect(videoImage, croppedSize);
  UIImage *image = [[UIImage alloc] initWithCGImage:croppedCGImage];
  CGImageRelease(videoImage);
  CGImageRelease(croppedCGImage);
  return image;
}

@end
