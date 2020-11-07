#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "EXCSBufferOrientationCalculator.h"
#import "EXFaceDetector.h"
#import "EXFaceDetectorAppDelegate.h"
#import "EXFaceDetectorManager.h"
#import "EXFaceDetectorManagerProvider.h"
#import "EXFaceDetectorModule.h"
#import "EXFaceEncoder.h"
#import "EXFaceDetectorUtils.h"

FOUNDATION_EXPORT double EXFaceDetectorVersionNumber;
FOUNDATION_EXPORT const unsigned char EXFaceDetectorVersionString[];

