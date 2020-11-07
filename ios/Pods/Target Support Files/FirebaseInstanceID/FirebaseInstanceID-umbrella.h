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

#import "FirebaseInstanceID.h"
#import "FIRInstanceID.h"

FOUNDATION_EXPORT double FirebaseInstanceIDVersionNumber;
FOUNDATION_EXPORT const unsigned char FirebaseInstanceIDVersionString[];

