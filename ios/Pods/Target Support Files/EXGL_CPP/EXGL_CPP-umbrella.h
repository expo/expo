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

#import "EXGLContext-inl.h"
#import "EXGLContext.h"
#import "EXGLImageUtils.h"
#import "EXGLNativeMethodsUtils.h"
#import "EXJSIUtils.h"
#import "EXPlatformUtils.h"
#import "stb_image.h"
#import "TypedArrayApi.h"
#import "UEXGL.h"

FOUNDATION_EXPORT double EXGL_CPPVersionNumber;
FOUNDATION_EXPORT const unsigned char EXGL_CPPVersionString[];

