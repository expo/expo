//
//  EXImageUtils.m
//  Exponent
//
//  Created by Stanisław Chmiela on 17.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import "EXImageUtils.h"

@implementation EXImageUtils

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

+ (void)updatePhotoMetadata:(CMSampleBufferRef)imageSampleBuffer withAdditionalData:(NSDictionary *)additionalData inResponse:(NSMutableDictionary *)response
{
  CFDictionaryRef exifAttachments = CMGetAttachment(imageSampleBuffer, kCGImagePropertyExifDictionary, NULL);
  NSMutableDictionary *metadata = (__bridge NSMutableDictionary *)exifAttachments;
  metadata[(NSString *)kCGImagePropertyExifPixelYDimension] = response[@"width"];
  metadata[(NSString *)kCGImagePropertyExifPixelXDimension] = response[@"height"];
  
  for (id key in additionalData) {
    metadata[key] = additionalData[key];
  }
  
  NSDictionary *gps = metadata[(NSString *)kCGImagePropertyGPSDictionary];
  
  if (gps) {
    for (NSString *gpsKey in gps) {
      metadata[[@"GPS" stringByAppendingString:gpsKey]] = gps[gpsKey];
    }
  }
  
  response[@"exif"] = metadata;
}

@end
