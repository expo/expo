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

#import "EXTask.h"
#import "EXTaskExecutionRequest.h"
#import "EXTaskManager.h"
#import "EXTaskManagerAppDelegate.h"
#import "EXTaskService.h"

FOUNDATION_EXPORT double EXTaskManagerVersionNumber;
FOUNDATION_EXPORT const unsigned char EXTaskManagerVersionString[];

