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

#import "bignum-dtoa.h"
#import "bignum.h"
#import "cached-powers.h"
#import "diy-fp.h"
#import "double-conversion.h"
#import "fast-dtoa.h"
#import "fixed-dtoa.h"
#import "ieee.h"
#import "strtod.h"
#import "utils.h"

FOUNDATION_EXPORT double DoubleConversionVersionNumber;
FOUNDATION_EXPORT const unsigned char DoubleConversionVersionString[];

