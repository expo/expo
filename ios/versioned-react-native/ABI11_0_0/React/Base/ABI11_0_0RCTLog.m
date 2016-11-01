/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTLog.h"

#include <asl.h>

#import "ABI11_0_0RCTAssert.h"
#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTBridge+Private.h"
#import "ABI11_0_0RCTDefines.h"
#import "ABI11_0_0RCTRedBox.h"
#import "ABI11_0_0RCTUtils.h"

static NSString *const ABI11_0_0RCTLogFunctionStack = @"ABI11_0_0RCTLogFunctionStack";

const char *ABI11_0_0RCTLogLevels[] = {
  "trace",
  "info",
  "warn",
  "error",
  "fatal",
};

#if ABI11_0_0RCT_DEBUG
static const ABI11_0_0RCTLogLevel ABI11_0_0RCTDefaultLogThreshold = ABI11_0_0RCTLogLevelInfo - 1;
#else
static const ABI11_0_0RCTLogLevel ABI11_0_0RCTDefaultLogThreshold = ABI11_0_0RCTLogLevelError;
#endif

static ABI11_0_0RCTLogFunction ABI11_0_0RCTCurrentLogFunction;
static ABI11_0_0RCTLogLevel ABI11_0_0RCTCurrentLogThreshold = ABI11_0_0RCTDefaultLogThreshold;

ABI11_0_0RCTLogLevel ABI11_0_0RCTGetLogThreshold()
{
  return ABI11_0_0RCTCurrentLogThreshold;
}

void ABI11_0_0RCTSetLogThreshold(ABI11_0_0RCTLogLevel threshold) {
  ABI11_0_0RCTCurrentLogThreshold = threshold;
}

ABI11_0_0RCTLogFunction ABI11_0_0RCTDefaultLogFunction = ^(
  ABI11_0_0RCTLogLevel level,
  __unused ABI11_0_0RCTLogSource source,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
)
{
  NSString *log = ABI11_0_0RCTFormatLog([NSDate date], level, fileName, lineNumber, message);
  fprintf(stderr, "%s\n", log.UTF8String);
  fflush(stderr);

  int aslLevel;
  switch(level) {
    case ABI11_0_0RCTLogLevelTrace:
      aslLevel = ASL_LEVEL_DEBUG;
      break;
    case ABI11_0_0RCTLogLevelInfo:
      aslLevel = ASL_LEVEL_NOTICE;
      break;
    case ABI11_0_0RCTLogLevelWarning:
      aslLevel = ASL_LEVEL_WARNING;
      break;
    case ABI11_0_0RCTLogLevelError:
      aslLevel = ASL_LEVEL_ERR;
      break;
    case ABI11_0_0RCTLogLevelFatal:
      aslLevel = ASL_LEVEL_CRIT;
      break;
  }
  asl_log(NULL, NULL, aslLevel, "%s", message.UTF8String);
};

void ABI11_0_0RCTSetLogFunction(ABI11_0_0RCTLogFunction logFunction)
{
  ABI11_0_0RCTCurrentLogFunction = logFunction;
}

ABI11_0_0RCTLogFunction ABI11_0_0RCTGetLogFunction()
{
  if (!ABI11_0_0RCTCurrentLogFunction) {
    ABI11_0_0RCTCurrentLogFunction = ABI11_0_0RCTDefaultLogFunction;
  }
  return ABI11_0_0RCTCurrentLogFunction;
}

void ABI11_0_0RCTAddLogFunction(ABI11_0_0RCTLogFunction logFunction)
{
  ABI11_0_0RCTLogFunction existing = ABI11_0_0RCTGetLogFunction();
  if (existing) {
    ABI11_0_0RCTSetLogFunction(^(ABI11_0_0RCTLogLevel level, ABI11_0_0RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
      existing(level, source, fileName, lineNumber, message);
      logFunction(level, source, fileName, lineNumber, message);
    });
  } else {
    ABI11_0_0RCTSetLogFunction(logFunction);
  }
}

/**
 * returns the topmost stacked log function for the current thread, which
 * may not be the same as the current value of ABI11_0_0RCTCurrentLogFunction.
 */
static ABI11_0_0RCTLogFunction ABI11_0_0RCTGetLocalLogFunction()
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSArray<ABI11_0_0RCTLogFunction> *functionStack = threadDictionary[ABI11_0_0RCTLogFunctionStack];
  ABI11_0_0RCTLogFunction logFunction = functionStack.lastObject;
  if (logFunction) {
    return logFunction;
  }
  return ABI11_0_0RCTGetLogFunction();
}

void ABI11_0_0RCTPerformBlockWithLogFunction(void (^block)(void), ABI11_0_0RCTLogFunction logFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray<ABI11_0_0RCTLogFunction> *functionStack = threadDictionary[ABI11_0_0RCTLogFunctionStack];
  if (!functionStack) {
    functionStack = [NSMutableArray new];
    threadDictionary[ABI11_0_0RCTLogFunctionStack] = functionStack;
  }
  [functionStack addObject:logFunction];
  block();
  [functionStack removeLastObject];
}

void ABI11_0_0RCTPerformBlockWithLogPrefix(void (^block)(void), NSString *prefix)
{
  ABI11_0_0RCTLogFunction logFunction = ABI11_0_0RCTGetLocalLogFunction();
  if (logFunction) {
    ABI11_0_0RCTPerformBlockWithLogFunction(block, ^(ABI11_0_0RCTLogLevel level, ABI11_0_0RCTLogSource source,
                                            NSString *fileName, NSNumber *lineNumber,
                                            NSString *message) {
      logFunction(level, source, fileName, lineNumber, [prefix stringByAppendingString:message]);
    });
  }
}

NSString *ABI11_0_0RCTFormatLog(
  NSDate *timestamp,
  ABI11_0_0RCTLogLevel level,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
)
{
  NSMutableString *log = [NSMutableString new];
  if (timestamp) {
    static NSDateFormatter *formatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      formatter = [NSDateFormatter new];
      formatter.dateFormat = formatter.dateFormat = @"yyyy-MM-dd HH:mm:ss.SSS ";
    });
    [log appendString:[formatter stringFromDate:timestamp]];
  }
  if (level) {
    [log appendFormat:@"[%s]", ABI11_0_0RCTLogLevels[level]];
  }

  [log appendFormat:@"[tid:%@]", ABI11_0_0RCTCurrentThreadName()];

  if (fileName) {
    fileName = fileName.lastPathComponent;
    if (lineNumber) {
      [log appendFormat:@"[%@:%@]", fileName, lineNumber];
    } else {
      [log appendFormat:@"[%@]", fileName];
    }
  }
  if (message) {
    [log appendString:@" "];
    [log appendString:message];
  }
  return log;
}

void _ABI11_0_0RCTLogNativeInternal(ABI11_0_0RCTLogLevel level, const char *fileName, int lineNumber, NSString *format, ...)
{
  ABI11_0_0RCTLogFunction logFunction = ABI11_0_0RCTGetLocalLogFunction();
  BOOL log = ABI11_0_0RCT_DEBUG || (logFunction != nil);
  if (log && level >= ABI11_0_0RCTGetLogThreshold()) {
    // Get message
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    // Call log function
    if (logFunction) {
      logFunction(level, ABI11_0_0RCTLogSourceNative, fileName ? @(fileName) : nil, lineNumber > 0 ? @(lineNumber) : nil, message);
    }

#if ABI11_0_0RCT_DEV

    // Log to red box in debug mode.
    if ([UIApplication sharedApplication] && level >= ABI11_0_0RCTLOG_REDBOX_LEVEL) {
      NSArray<NSString *> *stackSymbols = [NSThread callStackSymbols];
      NSMutableArray<NSDictionary *> *stack =
        [NSMutableArray arrayWithCapacity:(stackSymbols.count - 1)];
      [stackSymbols enumerateObjectsUsingBlock:^(NSString *frameSymbols, NSUInteger idx, __unused BOOL *stop) {
        if (idx > 0) { // don't include the current frame
          NSString *address = [[frameSymbols componentsSeparatedByString:@"0x"][1] componentsSeparatedByString:@" "][0];
          NSRange addressRange = [frameSymbols rangeOfString:address];
          NSString *methodName = [frameSymbols substringFromIndex:(addressRange.location + addressRange.length + 1)];
          if (idx == 1 && fileName) {
            NSString *file = [@(fileName) componentsSeparatedByString:@"/"].lastObject;
            [stack addObject:@{@"methodName": methodName, @"file": file, @"lineNumber": @(lineNumber)}];
          } else {
            [stack addObject:@{@"methodName": methodName}];
          }
        }
      }];
      dispatch_async(dispatch_get_main_queue(), ^{
        // red box is thread safe, but by deferring to main queue we avoid a startup
        // race condition that causes the module to be accessed before it has loaded
        [[ABI11_0_0RCTBridge currentBridge].redBox showErrorMessage:message withStack:stack];
      });
    }

    if (!ABI11_0_0RCTRunningInTestEnvironment()) {
      // Log to JS executor
      [[ABI11_0_0RCTBridge currentBridge] logMessage:message level:level ? @(ABI11_0_0RCTLogLevels[level]) : @"info"];
    }

#endif

  }
}

void _ABI11_0_0RCTLogJavaScriptInternal(ABI11_0_0RCTLogLevel level, NSString *message)
{
  ABI11_0_0RCTLogFunction logFunction = ABI11_0_0RCTGetLocalLogFunction();
  BOOL log = ABI11_0_0RCT_DEBUG || (logFunction != nil);
  if (log && level >= ABI11_0_0RCTGetLogThreshold()) {
    if (logFunction) {
      logFunction(level, ABI11_0_0RCTLogSourceJavaScript, nil, nil, message);
    }
  }
}
