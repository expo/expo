/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI29_0_0/ABI29_0_0RCTAssert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTDefines.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUtils.h>

#ifndef ABI29_0_0RCTLOG_ENABLED
#define ABI29_0_0RCTLOG_ENABLED 1
#endif

/**
 * Thresholds for logs to display a redbox. You can override these values when debugging
 * in order to tweak the default logging behavior.
 */
#ifndef ABI29_0_0RCTLOG_REDBOX_LEVEL
#define ABI29_0_0RCTLOG_REDBOX_LEVEL ABI29_0_0RCTLogLevelError
#endif

/**
 * Logging macros. Use these to log information, warnings and errors in your
 * own code.
 */
#define ABI29_0_0RCTLog(...) _ABI29_0_0RCTLog(ABI29_0_0RCTLogLevelInfo, __VA_ARGS__)
#define ABI29_0_0RCTLogTrace(...) _ABI29_0_0RCTLog(ABI29_0_0RCTLogLevelTrace, __VA_ARGS__)
#define ABI29_0_0RCTLogInfo(...) _ABI29_0_0RCTLog(ABI29_0_0RCTLogLevelInfo, __VA_ARGS__)
#define ABI29_0_0RCTLogAdvice(string, ...) ABI29_0_0RCTLogWarn([@"(ADVICE) " stringByAppendingString:(NSString *)string], __VA_ARGS__)
#define ABI29_0_0RCTLogWarn(...) _ABI29_0_0RCTLog(ABI29_0_0RCTLogLevelWarning, __VA_ARGS__)
#define ABI29_0_0RCTLogError(...) _ABI29_0_0RCTLog(ABI29_0_0RCTLogLevelError, __VA_ARGS__)

/**
 * An enum representing the severity of the log message.
 */
typedef NS_ENUM(NSInteger, ABI29_0_0RCTLogLevel) {
  ABI29_0_0RCTLogLevelTrace = 0,
  ABI29_0_0RCTLogLevelInfo = 1,
  ABI29_0_0RCTLogLevelWarning = 2,
  ABI29_0_0RCTLogLevelError = 3,
  ABI29_0_0RCTLogLevelFatal = 4
};

/**
 * An enum representing the source of a log message.
 */
typedef NS_ENUM(NSInteger, ABI29_0_0RCTLogSource) {
  ABI29_0_0RCTLogSourceNative = 1,
  ABI29_0_0RCTLogSourceJavaScript = 2
};

/**
 * A block signature to be used for custom logging functions. In most cases you
 * will want to pass these arguments to the ABI29_0_0RCTFormatLog function in order to
 * generate a string.
 */
typedef void (^ABI29_0_0RCTLogFunction)(
  ABI29_0_0RCTLogLevel level,
  ABI29_0_0RCTLogSource source,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
);

/**
 * A method to generate a string from a collection of log data. To omit any
 * particular data from the log, just pass nil or zero for the argument.
 */
ABI29_0_0RCT_EXTERN NSString *ABI29_0_0RCTFormatLog(
  NSDate *timestamp,
  ABI29_0_0RCTLogLevel level,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
);

/**
 * The default logging function used by ABI29_0_0RCTLogXX.
 */
extern ABI29_0_0RCTLogFunction ABI29_0_0RCTDefaultLogFunction;

/**
 * These methods get and set the global logging threshold. This is the level
 * below which logs will be ignored. Default is ABI29_0_0RCTLogLevelInfo for debug and
 * ABI29_0_0RCTLogLevelError for production.
 */
ABI29_0_0RCT_EXTERN void ABI29_0_0RCTSetLogThreshold(ABI29_0_0RCTLogLevel threshold);
ABI29_0_0RCT_EXTERN ABI29_0_0RCTLogLevel ABI29_0_0RCTGetLogThreshold(void);

/**
 * These methods get and set the global logging function called by the ABI29_0_0RCTLogXX
 * macros. You can use these to replace the standard behavior with custom log
 * functionality.
 */
ABI29_0_0RCT_EXTERN void ABI29_0_0RCTSetLogFunction(ABI29_0_0RCTLogFunction logFunction);
ABI29_0_0RCT_EXTERN ABI29_0_0RCTLogFunction ABI29_0_0RCTGetLogFunction(void);

/**
 * This appends additional code to the existing log function, without replacing
 * the existing functionality. Useful if you just want to forward logs to an
 * extra service without changing the default behavior.
 */
ABI29_0_0RCT_EXTERN void ABI29_0_0RCTAddLogFunction(ABI29_0_0RCTLogFunction logFunction);

/**
 * This method temporarily overrides the log function while performing the
 * specified block. This is useful for testing purposes (to detect if a given
 * function logs something) or to suppress or override logging temporarily.
 */
ABI29_0_0RCT_EXTERN void ABI29_0_0RCTPerformBlockWithLogFunction(void (^block)(void), ABI29_0_0RCTLogFunction logFunction);

/**
 * This method adds a conditional prefix to any messages logged within the scope
 * of the passed block. This is useful for adding additional context to log
 * messages. The block will be performed synchronously on the current thread.
 */
ABI29_0_0RCT_EXTERN void ABI29_0_0RCTPerformBlockWithLogPrefix(void (^block)(void), NSString *prefix);

/**
 * Private logging function - ignore this.
 */
#if ABI29_0_0RCTLOG_ENABLED
#define _ABI29_0_0RCTLog(lvl, ...) _ABI29_0_0RCTLogNativeInternal(lvl, __FILE__, __LINE__, __VA_ARGS__)
#else
#define _ABI29_0_0RCTLog(lvl, ...) do { } while (0)
#endif

ABI29_0_0RCT_EXTERN void _ABI29_0_0RCTLogNativeInternal(ABI29_0_0RCTLogLevel, const char *, int, NSString *, ...) NS_FORMAT_FUNCTION(4,5);
ABI29_0_0RCT_EXTERN void _ABI29_0_0RCTLogJavaScriptInternal(ABI29_0_0RCTLogLevel, NSString *);
