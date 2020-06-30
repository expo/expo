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

#import "logging.h"
#import "log_severity.h"
#import "raw_logging.h"
#import "stl_logging.h"
#import "vlog_is_on.h"

FOUNDATION_EXPORT double glogVersionNumber;
FOUNDATION_EXPORT const unsigned char glogVersionString[];

