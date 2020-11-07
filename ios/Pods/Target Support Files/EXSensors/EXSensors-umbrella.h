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

#import "EXSensorsManager.h"
#import "EXPedometer.h"
#import "EXAccelerometer.h"
#import "EXBarometer.h"
#import "EXBaseSensorModule.h"
#import "EXDeviceMotion.h"
#import "EXGyroscope.h"
#import "EXMagnetometer.h"
#import "EXMagnetometerUncalibrated.h"

FOUNDATION_EXPORT double EXSensorsVersionNumber;
FOUNDATION_EXPORT const unsigned char EXSensorsVersionString[];

