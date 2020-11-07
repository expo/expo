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

#import "EXAuthTask.h"
#import "EXGoogleSignIn+Serialization.h"
#import "EXGoogleSignIn.h"
#import "EXGoogleSignInAppDelegate.h"

FOUNDATION_EXPORT double EXGoogleSignInVersionNumber;
FOUNDATION_EXPORT const unsigned char EXGoogleSignInVersionString[];

