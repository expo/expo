//
//  EXCameraPointTransformer.m
//  Exponent
//
//  Created by Stanisław Chmiela on 30.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import "EXCameraPointTransformCalculator.h"

typedef NS_ENUM(NSInteger, EXTranslationEnum) {
  EXTranslateYNegativeWidth,
  EXTranslateXNegativeHeight,
  EXTranslateXYNegative,
  EXTranslateYXNegative
};

@implementation EXCameraPointTransformCalculator

# pragma mark - Lookup tables

static NSDictionary<NSNumber *, NSDictionary<NSNumber *, NSNumber *> *> *rotationDictionary = nil;
static NSDictionary<NSNumber *, NSDictionary<NSNumber *, NSNumber *> *> *translationDictionary = nil;

+ (NSDictionary<NSNumber *, NSDictionary<NSNumber *, NSNumber *> *> *) getRotationDictionary
{
  if (rotationDictionary == nil) {
    [self initRotationDictionary];
  }

  return rotationDictionary;
}

+ (NSDictionary<NSNumber *, NSDictionary<NSNumber *, NSNumber *> *> *) getTranslationDictionary
{
  if (translationDictionary == nil) {
    [self initTranslationDictionary];
  }
  
  return translationDictionary;
}

# pragma mark - Calculations public API

+ (CGFloat)rotationFromOrientation:(AVCaptureVideoOrientation)fromOrientation toOrientation:(AVCaptureVideoOrientation)toOrientation
{
  if (fromOrientation == toOrientation) {
    return 0;
  }

  AVCaptureVideoOrientation firstOrientation = MIN(fromOrientation, toOrientation);
  AVCaptureVideoOrientation secondOrientation = MAX(fromOrientation, toOrientation);
  CGFloat angle = [[self getRotationDictionary][@(firstOrientation)][@(secondOrientation)] doubleValue];
  
  if (fromOrientation > toOrientation) {
    angle = -angle;
  }
  
  return angle;
}

+ (CGPoint)translationFromOrientation:(AVCaptureVideoOrientation)fromOrientation toOrientation:(AVCaptureVideoOrientation)toOrientation videoWidth:(CGFloat)videoWidth videoHeight:(CGFloat)videoHeight
{
  if (fromOrientation == toOrientation) {
    return CGPointZero;
  }
  
  AVCaptureVideoOrientation firstOrientation = MIN(fromOrientation, toOrientation);
  AVCaptureVideoOrientation secondOrientation = MAX(fromOrientation, toOrientation);
  EXTranslationEnum enumValue = [[self getTranslationDictionary][@(firstOrientation)][@(secondOrientation)] intValue];
  
  CGPoint translation = [self translationFromEnum:enumValue videoWidth:videoWidth videoHeight:videoHeight];
  
  if (fromOrientation > toOrientation) {
    CGFloat translationRotationAngle = [self rotationFromOrientation:fromOrientation toOrientation:toOrientation];
    if (fabs(fmod(translationRotationAngle + M_PI, M_PI) - M_PI_2) < 0.01) {
      CGAffineTransform transform = CGAffineTransformIdentity;
      transform = CGAffineTransformRotate(transform, translationRotationAngle);
      translation = CGPointApplyAffineTransform(translation, transform);
    }
  }
  
  return translation;
}

+ (CGPoint)translationFromEnum:(EXTranslationEnum)enumValue videoWidth:(CGFloat)videoWidth videoHeight:(CGFloat)videoHeight
{
  switch (enumValue) {
    case EXTranslateXNegativeHeight:
      return CGPointMake(-videoHeight, 0);
    case EXTranslateYNegativeWidth:
      return CGPointMake(0, -videoWidth);
    case EXTranslateXYNegative:
      return CGPointMake(-videoWidth, -videoHeight);
    case EXTranslateYXNegative:
      return CGPointMake(-videoHeight, -videoWidth);
  }
}

# pragma mark - Initialize dictionaries

+ (void)initRotationDictionary
{
  rotationDictionary = @{
                         @(AVCaptureVideoOrientationPortrait): @{
                             @(AVCaptureVideoOrientationLandscapeLeft) : @(M_PI_2),
                             @(AVCaptureVideoOrientationLandscapeRight) : @(-M_PI_2),
                             @(AVCaptureVideoOrientationPortraitUpsideDown) : @(M_PI),
                             },
                         @(AVCaptureVideoOrientationPortraitUpsideDown): @{
                             @(AVCaptureVideoOrientationLandscapeLeft) : @(-M_PI_2),
                             @(AVCaptureVideoOrientationLandscapeRight) : @(M_PI_2)
                             },
                         @(AVCaptureVideoOrientationLandscapeRight): @{
                             @(AVCaptureVideoOrientationLandscapeLeft) : @(M_PI)
                             }
                         };
}

+ (void)initTranslationDictionary
{
  translationDictionary = @{
                            @(AVCaptureVideoOrientationPortrait): @{
                                @(AVCaptureVideoOrientationLandscapeLeft) : @(EXTranslateYNegativeWidth),
                                @(AVCaptureVideoOrientationLandscapeRight) : @(EXTranslateXNegativeHeight),
                                @(AVCaptureVideoOrientationPortraitUpsideDown) : @(EXTranslateYXNegative)
                                },
                            @(AVCaptureVideoOrientationPortraitUpsideDown): @{
                                @(AVCaptureVideoOrientationLandscapeLeft) : @(EXTranslateXNegativeHeight),
                                @(AVCaptureVideoOrientationLandscapeRight) : @(EXTranslateYNegativeWidth)
                                },
                            @(AVCaptureVideoOrientationLandscapeRight): @{
                                @(AVCaptureVideoOrientationLandscapeLeft) : @(EXTranslateXYNegative)
                                }
                            };
}

@end
