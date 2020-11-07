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

#import "jsi/JSCRuntime.h"
#import "jsi/decorator.h"
#import "jsi/instrumentation.h"
#import "jsi/jsi-inl.h"
#import "jsi/jsi.h"
#import "jsi/JSIDynamic.h"
#import "jsi/jsilib.h"
#import "jsi/threadsafe.h"

FOUNDATION_EXPORT double jsiVersionNumber;
FOUNDATION_EXPORT const unsigned char jsiVersionString[];

