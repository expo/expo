/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI48_0_0React/ABI48_0_0RCTAssert.h>
#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>
#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>

@class ABI48_0_0RCTModuleRegistry;
@class ABI48_0_0RCTCallableJSModules;

#ifndef ABI48_0_0RCTLOG_ENABLED
#define ABI48_0_0RCTLOG_ENABLED 1
#endif

/**
 * Thresholds for logs to display a redbox. You can override these values when debugging
 * in order to tweak the default logging behavior.
 */
#ifndef ABI48_0_0RCTLOG_REDBOX_LEVEL
#define ABI48_0_0RCTLOG_REDBOX_LEVEL ABI48_0_0RCTLogLevelError
#endif

/**
 * Logging macros. Use these to log information, warnings and errors in your
 * own code.
 */
#define ABI48_0_0RCTLog(...) _ABI48_0_0RCTLog(ABI48_0_0RCTLogLevelInfo, __VA_ARGS__)
#define ABI48_0_0RCTLogTrace(...) _ABI48_0_0RCTLog(ABI48_0_0RCTLogLevelTrace, __VA_ARGS__)
#define ABI48_0_0RCTLogInfo(...) _ABI48_0_0RCTLog(ABI48_0_0RCTLogLevelInfo, __VA_ARGS__)
#define ABI48_0_0RCTLogAdvice(string, ...) ABI48_0_0RCTLogWarn([@"(ADVICE) " stringByAppendingString:(NSString *)string], __VA_ARGS__)
#define ABI48_0_0RCTLogWarn(...) _ABI48_0_0RCTLog(ABI48_0_0RCTLogLevelWarning, __VA_ARGS__)
#define ABI48_0_0RCTLogError(...) _ABI48_0_0RCTLog(ABI48_0_0RCTLogLevelError, __VA_ARGS__)

/**
 * An enum representing the severity of the log message.
 */
typedef NS_ENUM(NSInteger, ABI48_0_0RCTLogLevel) {
  ABI48_0_0RCTLogLevelTrace = 0,
  ABI48_0_0RCTLogLevelInfo = 1,
  ABI48_0_0RCTLogLevelWarning = 2,
  ABI48_0_0RCTLogLevelError = 3,
  ABI48_0_0RCTLogLevelFatal = 4
};

/**
 * An enum representing the source of a log message.
 */
typedef NS_ENUM(NSInteger, ABI48_0_0RCTLogSource) { ABI48_0_0RCTLogSourceNative = 1, ABI48_0_0RCTLogSourceJavaScript = 2 };

/**
 * A block signature to be used for custom logging functions. In most cases you
 * will want to pass these arguments to the ABI48_0_0RCTFormatLog function in order to
 * generate a string.
 */
typedef void (^ABI48_0_0RCTLogFunction)(
    ABI48_0_0RCTLogLevel level,
    ABI48_0_0RCTLogSource source,
    NSString *fileName,
    NSNumber *lineNumber,
    NSString *message);

/**
 * A method to generate a string from a collection of log data. To omit any
 * particular data from the log, just pass nil or zero for the argument.
 */
ABI48_0_0RCT_EXTERN NSString *
ABI48_0_0RCTFormatLog(NSDate *timestamp, ABI48_0_0RCTLogLevel level, NSString *fileName, NSNumber *lineNumber, NSString *message);

/**
 * A method to generate a string ABI48_0_0RCTLogLevel
 */
ABI48_0_0RCT_EXTERN NSString *ABI48_0_0RCTFormatLogLevel(ABI48_0_0RCTLogLevel);

/**
 * A method to generate a string from a ABI48_0_0RCTLogSource
 */
ABI48_0_0RCT_EXTERN NSString *ABI48_0_0RCTFormatLogSource(ABI48_0_0RCTLogSource);

/**
 * The default logging function used by ABI48_0_0RCTLogXX.
 */
extern ABI48_0_0RCTLogFunction ABI48_0_0RCTDefaultLogFunction;

/**
 * These methods get and set the global logging threshold. This is the level
 * below which logs will be ignored. Default is ABI48_0_0RCTLogLevelInfo for debug and
 * ABI48_0_0RCTLogLevelError for production.
 */
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTSetLogThreshold(ABI48_0_0RCTLogLevel threshold);
ABI48_0_0RCT_EXTERN ABI48_0_0RCTLogLevel ABI48_0_0RCTGetLogThreshold(void);

/**
 * These methods get and set the global logging function called by the ABI48_0_0RCTLogXX
 * macros. You can use these to replace the standard behavior with custom log
 * functionality.
 */
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTSetLogFunction(ABI48_0_0RCTLogFunction logFunction);
ABI48_0_0RCT_EXTERN ABI48_0_0RCTLogFunction ABI48_0_0RCTGetLogFunction(void);

/**
 * This appends additional code to the existing log function, without replacing
 * the existing functionality. Useful if you just want to forward logs to an
 * extra service without changing the default behavior.
 */
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTAddLogFunction(ABI48_0_0RCTLogFunction logFunction);

/**
 * This method temporarily overrides the log function while performing the
 * specified block. This is useful for testing purposes (to detect if a given
 * function logs something) or to suppress or override logging temporarily.
 */
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTPerformBlockWithLogFunction(void (^block)(void), ABI48_0_0RCTLogFunction logFunction);

/**
 * This method adds a conditional prefix to any messages logged within the scope
 * of the passed block. This is useful for adding additional context to log
 * messages. The block will be performed synchronously on the current thread.
 */
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTPerformBlockWithLogPrefix(void (^block)(void), NSString *prefix);

/**
 * These methods allows static methods in ABI48_0_0RCTLog to call NativeModules and TurboModules.
 * TODO(T112035275) After Bridgeless mixed mode is removed, we can merge these methods
 */
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTLogSetBridgeModuleRegistry(ABI48_0_0RCTModuleRegistry *moduleRegistry);
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTLogSetBridgelessModuleRegistry(ABI48_0_0RCTModuleRegistry *moduleRegistry);

/**
 * This methods allows static methods in ABI48_0_0RCTLog to call JS methods.
 * TODO(T112035275) After Bridgeless mixed mode is removed, we can merge these methods
 */
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTLogSetBridgeCallableJSModules(ABI48_0_0RCTCallableJSModules *callableJSModules);
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTLogSetBridgelessCallableJSModules(ABI48_0_0RCTCallableJSModules *callableJSModules);

/**
 * Private logging function - ignore this.
 */
#if ABI48_0_0RCTLOG_ENABLED
#define _ABI48_0_0RCTLog(lvl, ...) _ABI48_0_0RCTLogNativeInternal(lvl, __FILE__, __LINE__, __VA_ARGS__)
#else
#define _ABI48_0_0RCTLog(lvl, ...) \
  do {                    \
  } while (0)
#endif

ABI48_0_0RCT_EXTERN void _ABI48_0_0RCTLogNativeInternal(ABI48_0_0RCTLogLevel, const char *, int, NSString *, ...) NS_FORMAT_FUNCTION(4, 5);
ABI48_0_0RCT_EXTERN void _ABI48_0_0RCTLogJavaScriptInternal(ABI48_0_0RCTLogLevel, NSString *);
