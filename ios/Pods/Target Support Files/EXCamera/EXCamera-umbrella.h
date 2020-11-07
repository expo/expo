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

#import "EXCamera.h"
#import "EXCameraManager.h"
#import "EXCameraPermissionRequester.h"
#import "EXCameraUtils.h"

FOUNDATION_EXPORT double EXCameraVersionNumber;
FOUNDATION_EXPORT const unsigned char EXCameraVersionString[];

