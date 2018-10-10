//
//  EXFaceDetectorPointTransformCalculator.m
//  Exponent
//
//  Created by Stanisław Chmiela on 30.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXFaceDetector/EXFaceDetectorPointTransformCalculator.h>

#define cDefaultFloatComparisonEpsilon 0.0001
#define cModEqualFloatsWithEpsilon(dividend, divisor, modulo, epsilon) \
        fabs( fmod(dividend, divisor) - modulo ) < epsilon
#define cModEqualFloats(dividend, divisor, modulo) \
        cModEqualFloatsWithEpsilon(dividend, divisor, modulo, cDefaultFloatComparisonEpsilon)

/*
 * The purpose of this class is to calculate the transform used to translate
 * face detected by Google Mobile Vision to proper view coordinates.
 *
 * When an Expo app locks interface orientatation in `app.json` or with `ScreenOrientation.allow`,
 * interface gets locked, but device orientation still can change. It looks like Google Mobile Vision
 * listens to device orientation changes and transforms coordinates of faces as if the device orientation
 * always equals interface orientation (which in Expo is not the case).
 *
 * Let's see the behavior on a specific example. Imagine an app with screen orientation locked to portrait.
 *
 * ```
 *   +---+
 *   |^^ |                 // by ^^ we shall denote a happy face, ^^
 *   |   |
 *   |   |
 *   +---+
 *     -                   // by - we shall denote the bottom of the interface.
 * ```
 *
 * When the device is being held like this face is properly reported in (0, 0).
 * However, when we rotate the device to landscape, the situation looks like this:
 *
 * ```
 *   +---------------+
 *   |^^            x|     // by xx we shall where the face should by according to GMV detector.
 *  ||              x|     // note that interface is still portrait-oriented
 *   |               |
 *   +---------------+
 * ```
 *
 * For GMV, which thinks that the interface is in landscape (`UIDeviceOrientation` changed to landscape)
 * the face is in `(0, 0)`. However, for our app `(0, 0)` is in the top left corner of the device --
 * -- that's where the face indicator gets positioned.
 *
 * That's when we have to rotate and translate the face indicator. Here we have to rotate it by -90 degrees.
 *
 * ```
 *   +---------------+
 *   |^^             |xx   // something is still wrong
 *  ||               |
 *   |               |
 *   +---------------+
 * ```
 *
 * Not only must we rotate the indicator, we also have to translate it. Here by (-videoWidth, 0).
 *
 * ```
 *   +---------------+
 *   |**             |     // detected eyes glow inside the face indicator
 *  ||               |
 *   |               |
 *   +---------------+
 * ```
 *
 * Fixing this issue is the purpose of this whole class.
 *
 */


typedef NS_ENUM(NSInteger, EXTranslationEnum) {
  EXTranslateYNegativeWidth,
  EXTranslateXNegativeHeight,
  EXTranslateXYNegative,
  EXTranslateYXNegative
};

@interface EXFaceDetectorPointTransformCalculator()

@property (assign, nonatomic) AVCaptureVideoOrientation fromOrientation;
@property (assign, nonatomic) AVCaptureVideoOrientation toOrientation;
@property (assign, nonatomic) CGFloat videoWidth;
@property (assign, nonatomic) CGFloat videoHeight;

@end

@implementation EXFaceDetectorPointTransformCalculator

- (instancetype)initToTransformFromOrientation:(AVCaptureVideoOrientation)fromOrientation toOrientation:(AVCaptureVideoOrientation)toOrientation forVideoWidth:(CGFloat)videoWidth andVideoHeight:(CGFloat)videoHeight
{
  self = [super init];
  if (self) {
    _fromOrientation = fromOrientation;
    _toOrientation = toOrientation;
    _videoWidth = videoWidth;
    _videoHeight = videoHeight;
  }
  return self;
}

- (CGFloat)rotation
{
  if (_fromOrientation == _toOrientation) {
    return 0;
  }
  
  AVCaptureVideoOrientation firstOrientation = MIN(_fromOrientation, _toOrientation);
  AVCaptureVideoOrientation secondOrientation = MAX(_fromOrientation, _toOrientation);
  CGFloat angle = [[[self class] getRotationDictionary][@(firstOrientation)][@(secondOrientation)] doubleValue];
  
  /*
   * It turns out that if you need to rotate the indicator by -90 degrees to get it from
   * landscape left (Device orientation) to portrait (Interface Orientation),
   * to get the indicator from portrait (D) to landscape left (I), you need to rotate it by 90 degrees.
   * Same analogy `r(1, 2) == x <==> r(2, 1) == -x` is true for every other transformation.
   */
  if (_fromOrientation > _toOrientation) {
    angle = -angle;
  }
  
  return angle;
}

- (CGPoint)translation
{
  if (_fromOrientation == _toOrientation) {
    return CGPointZero;
  }
  
  AVCaptureVideoOrientation firstOrientation = MIN(_fromOrientation, _toOrientation);
  AVCaptureVideoOrientation secondOrientation = MAX(_fromOrientation, _toOrientation);
  EXTranslationEnum enumValue = [[[self class] getTranslationDictionary][@(firstOrientation)][@(secondOrientation)] intValue];
  
  CGPoint translation = [self translationForEnum:enumValue];
  
  /*
   * Here the analogy is a little bit more complicated than when calculating rotation.
   * It turns out that if you need to translate the _rotated_ indicator
   * from landscape left (D) to portrait (I) by `(-videoWidth, 0)` (see top class comment),
   * to translate the rotated indicator from portrait (D) to landscape left (D) you need to translate it
   * by `(0, -videoWidth)`.
   *
   * ```
   *                                +-------+
   * +--------------------+         |^^     |     //   ^^    == happy face
   * |^^                  |         |       |
   * |                    |         |       |
   * |                    |         |       ||    // | or -  == bottom of the interface
   * |                    |         |       |
   * |                    |         |x      |     //   xx    == initial face indicator
   * +--------------------+         |x      |
   *           -                    +-------+
   *                                 oo           //   oo    == rotated face indicator
   * ```
   *
   * As we can see, the indicator has to be translated by `(0, -videoWidth)` to match with the happy face.
   *
   * It turns out, that `(0, -videoWidth) == translation(device: 1, interface: 4)` can be calculated by
   * rotating `translation(device: 4, interface: 1) == (-videoWidth, 0)` by `rotation(4, 1) == -90deg`.
   *
   * One might think that the same analogy `t(1, 2) == r(2, 1)[t(2, 1)]` works always,
   * but here this assumption would be wrong. The analogy works only when device and interface rotations
   * differ by 90 or -90 degrees.
   *
   * Otherwise (when transforming from/to portrait/upside or landscape left/right)
   * `translation(1, 2) == translation(2, 1).
   */
  if (_fromOrientation > _toOrientation) {
    CGFloat translationRotationAngle = [self rotation];
    if (cModEqualFloats(translationRotationAngle + M_PI, M_PI, M_PI_2)) {
      CGAffineTransform transform = CGAffineTransformIdentity;
      transform = CGAffineTransformRotate(transform, translationRotationAngle);
      translation = CGPointApplyAffineTransform(translation, transform);
    }
  }
  
  return translation;
}

- (CGAffineTransform)transform
{
  CGAffineTransform transform = CGAffineTransformIdentity;
  
  CGFloat rotation = [self rotation];
  transform = CGAffineTransformRotate(transform, rotation);
  
  CGPoint translation = [self translation];
  transform = CGAffineTransformTranslate(transform, translation.x, translation.y);
  
  return transform;
}

# pragma mark - Enum conversion

- (CGPoint)translationForEnum:(EXTranslationEnum)enumValue
{
  switch (enumValue) {
    case EXTranslateXNegativeHeight:
      return CGPointMake(-_videoHeight, 0);
    case EXTranslateYNegativeWidth:
      return CGPointMake(0, -_videoWidth);
    case EXTranslateXYNegative:
      return CGPointMake(-_videoWidth, -_videoHeight);
    case EXTranslateYXNegative:
      return CGPointMake(-_videoHeight, -_videoWidth);
  }
}

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

# pragma mark - Initialize dictionaries

// If you wonder why this dictionary is half-empty, see comment inside `- (CGFloat)rotation`. It may help you.
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

// If you wonder why this dictionary is half-empty, see comment inside `- (CGPoint)translation`. It may help you.
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
