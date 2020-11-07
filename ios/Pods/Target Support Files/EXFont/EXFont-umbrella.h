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

#import "EXFont.h"
#import "EXFontLoader.h"
#import "EXFontLoaderProcessor.h"
#import "EXFontManager.h"
#import "EXFontScaler.h"
#import "EXFontScalersManager.h"

FOUNDATION_EXPORT double EXFontVersionNumber;
FOUNDATION_EXPORT const unsigned char EXFontVersionString[];

