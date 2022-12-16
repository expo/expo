/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI46_0_0React/ABI46_0_0RCTAssert.h>
#import <ABI46_0_0React/ABI46_0_0RCTDefines.h>
#import <ABI46_0_0React/ABI46_0_0RCTUtils.h>

@class ABI46_0_0RCTModuleRegistry;
@class ABI46_0_0RCTCallableJSModules;

#ifndef ABI46_0_0RCTLOG_ENABLED
#define ABI46_0_0RCTLOG_ENABLED 1
#endif

/**
 * Thresholds for logs to display a redbox. You can override these values when debugging
 * in order to tweak the default logging behavior.
 */
#ifndef ABI46_0_0RCTLOG_REDBOX_LEVEL
#define ABI46_0_0RCTLOG_REDBOX_LEVEL ABI46_0_0RCTLogLevelError
#endif

/**
 * Logging macros. Use these to log information, warnings and errors in your
 * own code.
 */
#define ABI46_0_0RCTLog(...) _ABI46_0_0RCTLog(ABI46_0_0RCTLogLevelInfo, __VA_ARGS__)
#define ABI46_0_0RCTLogTrace(...) _ABI46_0_0RCTLog(ABI46_0_0RCTLogLevelTrace, __VA_ARGS__)
#define ABI46_0_0RCTLogInfo(...) _ABI46_0_0RCTLog(ABI46_0_0RCTLogLevelInfo, __VA_ARGS__)
#define ABI46_0_0RCTLogAdvice(string, ...) ABI46_0_0RCTLogWarn([@"(ADVICE) " stringByAppendingString:(NSString *)string], __VA_ARGS__)
#define ABI46_0_0RCTLogWarn(...) _ABI46_0_0RCTLog(ABI46_0_0RCTLogLevelWarning, __VA_ARGS__)
#define ABI46_0_0RCTLogError(...) _ABI46_0_0RCTLog(ABI46_0_0RCTLogLevelError, __VA_ARGS__)

/**
 * An enum representing the severity of the log message.
 */
typedef NS_ENUM(NSInteger, ABI46_0_0RCTLogLevel) {
  ABI46_0_0RCTLogLevelTrace = 0,
  ABI46_0_0RCTLogLevelInfo = 1,
  ABI46_0_0RCTLogLevelWarning = 2,
  ABI46_0_0RCTLogLevelError = 3,
  ABI46_0_0RCTLogLevelFatal = 4
};

/**
 * An enum representing the source of a log message.
 */
typedef NS_ENUM(NSInteger, ABI46_0_0RCTLogSource) { ABI46_0_0RCTLogSourceNative = 1, ABI46_0_0RCTLogSourceJavaScript = 2 };

/**
 * A block signature to be used for custom logging functions. In most cases you
 * will want to pass these arguments to the ABI46_0_0RCTFormatLog function in order to
 * generate a string.
 */
typedef void (^ABI46_0_0RCTLogFunction)(
    ABI46_0_0RCTLogLevel level,
    ABI46_0_0RCTLogSource source,
    NSString *fileName,
    NSNumber *lineNumber,
    NSString *message);

/**
 * A method to generate a string from a collection of log data. To omit any
 * particular data from the log, just pass nil or zero for the argument.
 */
ABI46_0_0RCT_EXTERN NSString *
ABI46_0_0RCTFormatLog(NSDate *timestamp, ABI46_0_0RCTLogLevel level, NSString *fileName, NSNumber *lineNumber, NSString *message);

/**
 * A method to generate a string ABI46_0_0RCTLogLevel
 */
ABI46_0_0RCT_EXTERN NSString *ABI46_0_0RCTFormatLogLevel(ABI46_0_0RCTLogLevel);

/**
 * A method to generate a string from a ABI46_0_0RCTLogSource
 */
ABI46_0_0RCT_EXTERN NSString *ABI46_0_0RCTFormatLogSource(ABI46_0_0RCTLogSource);

/**
 * The default logging function used by ABI46_0_0RCTLogXX.
 */
extern ABI46_0_0RCTLogFunction ABI46_0_0RCTDefaultLogFunction;

/**
 * These methods get and set the global logging threshold. This is the level
 * below which logs will be ignored. Default is ABI46_0_0RCTLogLevelInfo for debug and
 * ABI46_0_0RCTLogLevelError for production.
 */
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTSetLogThreshold(ABI46_0_0RCTLogLevel threshold);
ABI46_0_0RCT_EXTERN ABI46_0_0RCTLogLevel ABI46_0_0RCTGetLogThreshold(void);

/**
 * These methods get and set the global logging function called by the ABI46_0_0RCTLogXX
 * macros. You can use these to replace the standard behavior with custom log
 * functionality.
 */
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTSetLogFunction(ABI46_0_0RCTLogFunction logFunction);
ABI46_0_0RCT_EXTERN ABI46_0_0RCTLogFunction ABI46_0_0RCTGetLogFunction(void);

/**
 * This appends additional code to the existing log function, without replacing
 * the existing functionality. Useful if you just want to forward logs to an
 * extra service without changing the default behavior.
 */
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTAddLogFunction(ABI46_0_0RCTLogFunction logFunction);

/**
 * This method temporarily overrides the log function while performing the
 * specified block. This is useful for testing purposes (to detect if a given
 * function logs something) or to suppress or override logging temporarily.
 */
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTPerformBlockWithLogFunction(void (^block)(void), ABI46_0_0RCTLogFunction logFunction);

/**
 * This method adds a conditional prefix to any messages logged within the scope
 * of the passed block. This is useful for adding additional context to log
 * messages. The block will be performed synchronously on the current thread.
 */
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTPerformBlockWithLogPrefix(void (^block)(void), NSString *prefix);

/**
 * These methods allows static methods in ABI46_0_0RCTLog to call NativeModules and TurboModules.
 * TODO(T112035275) After Bridgeless mixed mode is removed, we can merge these methods
 */
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTLogSetBridgeModuleRegistry(ABI46_0_0RCTModuleRegistry *moduleRegistry);
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTLogSetBridgelessModuleRegistry(ABI46_0_0RCTModuleRegistry *moduleRegistry);

/**
 * This methods allows static methods in ABI46_0_0RCTLog to call JS methods.
 * TODO(T112035275) After Bridgeless mixed mode is removed, we can merge these methods
 */
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTLogSetBridgeCallableJSModules(ABI46_0_0RCTCallableJSModules *callableJSModules);
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTLogSetBridgelessCallableJSModules(ABI46_0_0RCTCallableJSModules *callableJSModules);

/**
 * Private logging function - ignore this.
 */
#if ABI46_0_0RCTLOG_ENABLED
#define _ABI46_0_0RCTLog(lvl, ...) _ABI46_0_0RCTLogNativeInternal(lvl, __FILE__, __LINE__, __VA_ARGS__)
#else
#define _ABI46_0_0RCTLog(lvl, ...) \
  do {                    \
  } while (0)
#endif

ABI46_0_0RCT_EXTERN void _ABI46_0_0RCTLogNativeInternal(ABI46_0_0RCTLogLevel, const char *, int, NSString *, ...) NS_FORMAT_FUNCTION(4, 5);
ABI46_0_0RCT_EXTERN void _ABI46_0_0RCTLogJavaScriptInternal(ABI46_0_0RCTLogLevel, NSString *);
