//
//  CLSLogging.h
//  Crashlytics
//
//  Copyright (c) 2015 Crashlytics, Inc. All rights reserved.
//
#ifdef __OBJC__
#import "CLSAttributes.h"
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN
#endif



/**
 *
 * The CLS_LOG macro provides as easy way to gather more information in your log messages that are
 * sent with your crash data. CLS_LOG prepends your custom log message with the function name and
 * line number where the macro was used. If your app was built with the DEBUG preprocessor macro
 * defined CLS_LOG uses the CLSNSLog function which forwards your log message to NSLog and CLSLog.
 * If the DEBUG preprocessor macro is not defined CLS_LOG uses CLSLog only.
 *
 * Example output:
 * -[AppDelegate login:] line 134 $ login start
 *
 * If you would like to change this macro, create a new header file, unset our define and then define
 * your own version. Make sure this new header file is imported after the Crashlytics header file.
 *
 * #undef CLS_LOG
 * #define CLS_LOG(__FORMAT__, ...) CLSNSLog...
 *
 **/
#ifdef __OBJC__
#ifdef DEBUG
#define CLS_LOG(__FORMAT__, ...) CLSNSLog((@"%s line %d $ " __FORMAT__), __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__)
#else
#define CLS_LOG(__FORMAT__, ...) CLSLog((@"%s line %d $ " __FORMAT__), __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__)
#endif
#endif

/**
 *
 * Add logging that will be sent with your crash data. This logging will not show up in the system.log
 * and will only be visible in your Crashlytics dashboard.
 *
 **/

#ifdef __OBJC__
OBJC_EXTERN void CLSLog(NSString *format, ...) NS_FORMAT_FUNCTION(1,2);
OBJC_EXTERN void CLSLogv(NSString *format, va_list ap) NS_FORMAT_FUNCTION(1,0);

/**
 *
 * Add logging that will be sent with your crash data. This logging will show up in the system.log
 * and your Crashlytics dashboard. It is not recommended for Release builds.
 *
 **/
OBJC_EXTERN void CLSNSLog(NSString *format, ...) NS_FORMAT_FUNCTION(1,2);
OBJC_EXTERN void CLSNSLogv(NSString *format, va_list ap) NS_FORMAT_FUNCTION(1,0);


NS_ASSUME_NONNULL_END
#endif
