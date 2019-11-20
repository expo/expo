//
//  EXFaceDetectorPointTransformCalculator.m
//  Exponent
//
//  Created by Stanisław Chmiela on 30.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXFaceDetector/EXCSBufferOrientationCalculator.h>

#define TRANSFORM_PI_2 CGAffineTransformMake(0, 1, -1, 0, 0, 0)
#define TRANSFORM_PI CGAffineTransformMake(-1, 0, 0, -1, 0, 0)
#define TRANSFORM_NEGATIVE_PI_2 CGAffineTransformMake(0, -1, 1, 0, 0, 0)
#define TRANSFORM_X_SYMETRY CGAffineTransformMake(1, 0, 0, -1, 0, 0)
#define TRANSFORM_Y_SYMETRY CGAffineTransformMake(-1, 0, 0, 1, 0, 0)

/*
 * The purpose of this class is to calculate the transform used to translate
 * face detected by MLKit using CMSampleBufferRef to proper view coordinates.
 *
 * CSSampleBuffer always operates on image in LandscapeLeft orientation.
 * Therefore, all obtained points needs to be rotated, translated and scaled properly in order to fit original position on preview.
 *
 * Let's see the behavior on a specific example. Imagine an app with portrait screen orientation.
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
 * For buffer orientation, hovewer, is landscape right, which means face will be positioned in buffer as indicated:
 *
 * ```
 *   +---------------+
 *   |              >|
 *   |              >|
 *   |               |
 *   +---------------+
 * ```
 *
 * Which would result in displayng improper face position on preview:
 * ```
 *     +---+
 *     |^^ |                 // by ^^ we shall denote a happy face, ^^
 *     |x  |                 // by xx we shall denote face position as detected by MLKit
 *     |x  |
 *     +---+
 *       -                   // by - we shall denote the bottom of the interface.
 * ```
 *
 * In order to display face properly we need to rotate it 90 degrees counterclockwise. However, rotation alon would give still improper results:
 * ```
 *     +---+
 *  xx |^^ |                  // by ^^ we shall denote a happy face, ^^
 *     |   |                 // by xx we shall denote face position as detected by MLKit
 *     |   |
 *     +---+
 *     -                   // by - and | we shall denote boundaries of an interface
 * ```
 * Which is the result of rotation being performed aroun (0,0) point. Now we need to add translation by interface width:
 * ```
 *     +---+
 *     |** |                 // by xx we shall denote face position as detected by MLKit
 *     |   |
 *     |   |
 *     +---+
 *     -                   // by - and | we shall denote boundaries of an interface
 * ```
 * And we have face correctly displayed.
 * Last think we need to remember is performing x or y symetry for when preview is mirrored (for front camera) in portrait or landscape orientation respectively.
 */

@implementation EXCSBufferOrientationCalculator

+ (CGAffineTransform)pointTransformForInterfaceOrientation:(UIInterfaceOrientation)orientation
                                            forBufferWidth:(CGFloat)bufferWidth
                                           andBufferHeight:(CGFloat)bufferHeight
                                             andVideoWidth:(CGFloat)videoWidth
                                            andVideoHeight:(CGFloat)videoHeight
                                               andMirrored:(BOOL)mirrored
{
  CGAffineTransform rotationTransform = CGAffineTransformConcat(
                                                                [EXCSBufferOrientationCalculator rotationTransformForOrientation:orientation],
                                                                [EXCSBufferOrientationCalculator transformForMirror:orientation forMirrored:mirrored]);
  CGAffineTransform rotationWithTranslation = [EXCSBufferOrientationCalculator rotationWithTranslation:rotationTransform forVideoWidth:videoWidth forVideoHeight:videoHeight];
  
  CGFloat scaleFactor = [EXCSBufferOrientationCalculator scaleForCropWithPreservingAspectRatioforBufferWidth:bufferWidth andBufferHeight:bufferHeight andVideoWidth:videoWidth andVideoHeight:videoHeight];
  
  CGAffineTransform cropTranslation = [EXCSBufferOrientationCalculator cropTranslationsTransformationForRotation:rotationWithTranslation andScale:scaleFactor andBufferWidth:bufferWidth andBufferHeight:bufferHeight andVideoWidth:videoWidth andVideoHeight:videoHeight];
  CGAffineTransform rotationWithAllTranslations = CGAffineTransformConcat(rotationWithTranslation, cropTranslation);
  return CGAffineTransformScale(rotationWithAllTranslations, scaleFactor, scaleFactor);
}

+ (CGAffineTransform)rotationTransformForOrientation:(UIInterfaceOrientation)orientation
{
  switch (orientation) {
    case (UIInterfaceOrientationLandscapeRight):
      return CGAffineTransformIdentity;
    case (UIInterfaceOrientationPortrait):
      return TRANSFORM_PI_2;
    case (UIInterfaceOrientationLandscapeLeft):
      return TRANSFORM_PI;
    case (UIInterfaceOrientationPortraitUpsideDown):
      return TRANSFORM_NEGATIVE_PI_2;
    default:
      return CGAffineTransformIdentity;
  }
}

+ (CGAffineTransform)transformForMirror:(UIInterfaceOrientation)orientation forMirrored:(BOOL)mirrored
{
  if(mirrored)
  {
    if(UIInterfaceOrientationIsLandscape(orientation)) {
      return TRANSFORM_X_SYMETRY;
    } else {
      return TRANSFORM_Y_SYMETRY;
    }
  } else {
    return CGAffineTransformIdentity;
  }
}

+(CGAffineTransform)rotationWithTranslation:(CGAffineTransform)rotationTransformation
                              forVideoWidth:(CGFloat)videoWidth
                             forVideoHeight:(CGFloat)videoHeight
{
  BOOL translateX = rotationTransformation.a == -1 || rotationTransformation.c == -1;
  BOOL translateY = rotationTransformation.b == -1 || rotationTransformation.d == -1;
  CGAffineTransform translationTransformation = CGAffineTransformTranslate(CGAffineTransformIdentity, translateX ? videoWidth : 0, translateY ? videoHeight : 0);
  return CGAffineTransformConcat(rotationTransformation, translationTransformation);
}

+(CGFloat)scaleForCropWithPreservingAspectRatioforBufferWidth:(CGFloat)bufferWidth
                                              andBufferHeight:(CGFloat)bufferHeight
                                                andVideoWidth:(CGFloat)videoWidth
                                               andVideoHeight:(CGFloat)videoHeight
{
  float widthFactor = videoWidth / bufferWidth;
  float heightFactor = videoHeight / bufferHeight;
  
  return MAX(widthFactor, heightFactor);
}

+(CGAffineTransform)cropTranslationsTransformationForRotation:(CGAffineTransform)rotation
                                                     andScale:(CGFloat)scale
                                               andBufferWidth:(CGFloat)bufferWidth
                                              andBufferHeight:(CGFloat)bufferHeight
                                                andVideoWidth:(CGFloat)videoWidth
                                               andVideoHeight:(CGFloat)videoHeight
{
  float xOffset = -((bufferWidth * scale) - videoWidth) / 2;
  float yOffset = -((bufferHeight * scale) - videoHeight) / 2;
  
  // This is actually multipling rotation matrix by crop translations point.
  float xTranslation = (rotation.a + rotation.c) * xOffset;
  float yTranslation = (rotation.b + rotation.d) * yOffset;
  
  return CGAffineTransformMakeTranslation(xTranslation, yTranslation);
}

@end
