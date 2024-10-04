//
//  ABI42_0_0EXCameraUtils.m
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <ABI42_0_0EXCamera/ABI42_0_0EXCameraUtils.h>

@implementation ABI42_0_0EXCameraUtils

# pragma mark - Camera utilities

+ (AVCaptureDevice *)deviceWithMediaType:(AVMediaType)mediaType preferringPosition:(AVCaptureDevicePosition)position
{
  return [AVCaptureDevice defaultDeviceWithDeviceType:AVCaptureDeviceTypeBuiltInWideAngleCamera mediaType:mediaType position:position];
}

# pragma mark - Enum conversion

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

+ (float)temperatureForWhiteBalance:(ABI42_0_0EXCameraWhiteBalance)whiteBalance
{
  switch (whiteBalance) {
    case ABI42_0_0EXCameraWhiteBalanceSunny: default:
      return 5200;
    case ABI42_0_0EXCameraWhiteBalanceCloudy:
      return 6000;
    case ABI42_0_0EXCameraWhiteBalanceShadow:
      return 7000;
    case ABI42_0_0EXCameraWhiteBalanceIncandescent:
      return 3000;
    case ABI42_0_0EXCameraWhiteBalanceFluorescent:
      return 4200;
  }
}

+ (NSString *)captureSessionPresetForVideoResolution:(ABI42_0_0EXCameraVideoResolution)resolution
{
  switch (resolution) {
    case ABI42_0_0EXCameraVideo2160p:
      return AVCaptureSessionPreset3840x2160;
    case ABI42_0_0EXCameraVideo1080p:
      return AVCaptureSessionPreset1920x1080;
    case ABI42_0_0EXCameraVideo720p:
      return AVCaptureSessionPreset1280x720;
    case ABI42_0_0EXCameraVideo4x3:
      return AVCaptureSessionPreset640x480;
    default:
      return AVCaptureSessionPresetHigh;
  }
}

+ (int)exportImageOrientation:(UIImageOrientation)orientation
{
   switch (orientation) {
     case UIImageOrientationLeft:
       return 90;
     case UIImageOrientationRight:
       return -90;
     case UIImageOrientationDown:
       return 180;
     default:
       return 0;
   }
}

+ (AVVideoCodecType)videoCodecForType:(ABI42_0_0EXCameraVideoCodec)videoCodecType
{
  switch (videoCodecType) {
    case ABI42_0_0EXCameraVideoCodecH264:
      return AVVideoCodecTypeH264;
    case ABI42_0_0EXCameraVideoCodecHEVC:
      return AVVideoCodecTypeHEVC;
    case ABI42_0_0EXCameraVideoCodecJPEG:
      return AVVideoCodecTypeJPEG;
    case ABI42_0_0EXCameraVideoCodecAppleProRes422:
      return AVVideoCodecTypeAppleProRes422;
    case ABI42_0_0EXCameraVideoCodecAppleProRes4444:
      return AVVideoCodecTypeAppleProRes4444;
    default:
      return @"VIDEO_CODEC_UNKNOWN";
  }
}


# pragma mark - Image utilities

+ (UIImage *)generatePhotoOfSize:(CGSize)size
{
  CGRect rect = CGRectMake(0, 0, size.width, size.height);
  UIImage *image;
  UIGraphicsBeginImageContextWithOptions(size, YES, 0);
  UIColor *color = [UIColor blackColor];
  [color setFill];
  UIRectFill(rect);
  NSDate *currentDate = [NSDate date];
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  [dateFormatter setDateFormat:@"dd.MM.YY HH:mm:ss"];
  NSString *text = [dateFormatter stringFromDate:currentDate];
  NSDictionary *attributes = [NSDictionary dictionaryWithObjects: @[[UIFont systemFontOfSize:18.0], [UIColor orangeColor]]
                                                         forKeys: @[NSFontAttributeName, NSForegroundColorAttributeName]];
  [text drawAtPoint:CGPointMake(size.width * 0.1, size.height * 0.9) withAttributes:attributes];
  image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}

+ (UIImage *)cropImage:(UIImage *)image toRect:(CGRect)rect
{
  CGImageRef takenCGImage = image.CGImage;
  CGImageRef cropCGImage = CGImageCreateWithImageInRect(takenCGImage, rect);
  image = [UIImage imageWithCGImage:cropCGImage scale:image.scale orientation:image.imageOrientation];
  CGImageRelease(cropCGImage);
  return image;
}

+ (NSString *)writeImage:(NSData *)image toPath:(NSString *)path
{
  [image writeToFile:path atomically:YES];
  NSURL *fileURL = [NSURL fileURLWithPath:path];
  return [fileURL absoluteString];
}

+ (NSData *)dataFromImage:(UIImage *)image withMetadata:(NSDictionary *)metadata imageQuality:(float)quality
{
  // Get metadata (includes the ABI42_0_0EXIF data)
  CGImageSourceRef sourceCGIImageRef = CGImageSourceCreateWithData((CFDataRef) UIImageJPEGRepresentation(image, 1.0f), NULL);
  NSDictionary *sourceMetadata = (__bridge NSDictionary *) CGImageSourceCopyPropertiesAtIndex(sourceCGIImageRef, 0, NULL);
  
  NSMutableDictionary *updatedMetadata = [sourceMetadata mutableCopy];
  
  for (id key in metadata) {
    updatedMetadata[key] = metadata[key];
  }
  
  // Set compression quality
  [updatedMetadata setObject:@(quality) forKey:(__bridge NSString *)kCGImageDestinationLossyCompressionQuality];

  // Create an image destination
  NSMutableData *processedImageData = [NSMutableData data];
  CGImageDestinationRef destinationCGImageRef = CGImageDestinationCreateWithData((__bridge CFMutableDataRef)processedImageData, CGImageSourceGetType(sourceCGIImageRef), 1, NULL);

  // Add image to the destination
  // Note: it'll save only these value which are under the kCGImageProperty* key.
  CGImageDestinationAddImage(destinationCGImageRef, image.CGImage, (__bridge CFDictionaryRef) updatedMetadata);

  // Finalize the destination
  if (CGImageDestinationFinalize(destinationCGImageRef)) {
    CFRelease(sourceCGIImageRef);
    CFRelease(destinationCGImageRef);
  
    return processedImageData;
  }
  return nil;
}

+ (NSMutableDictionary *)updateExifMetadata:(NSDictionary *)metadata withAdditionalData:(NSDictionary *)additionalData
{
  NSMutableDictionary *mutableMetadata = [[NSMutableDictionary alloc] initWithDictionary:metadata];
  for (id key in additionalData) {
    mutableMetadata[key] = additionalData[key];
  }

  NSDictionary *gps = mutableMetadata[(NSString *)kCGImagePropertyGPSDictionary];

  if (gps) {
    for (NSString *gpsKey in gps) {
      mutableMetadata[[@"GPS" stringByAppendingString:gpsKey]] = gps[gpsKey];
    }
  }

  return mutableMetadata;
}

@end
