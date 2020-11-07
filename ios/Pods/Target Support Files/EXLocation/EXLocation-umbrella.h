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

#import "EXLocation.h"
#import "EXLocationDelegate.h"
#import "EXLocationPermissionRequester.h"
#import "EXGeofencingTaskConsumer.h"
#import "EXLocationTaskConsumer.h"

FOUNDATION_EXPORT double EXLocationVersionNumber;
FOUNDATION_EXPORT const unsigned char EXLocationVersionString[];

