/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTLog.h"

#include <asl.h>
#include <cxxabi.h>

#import "ABI20_0_0RCTAssert.h"
#import "ABI20_0_0RCTBridge+Private.h"
#import "ABI20_0_0RCTBridge.h"
#import "ABI20_0_0RCTDefines.h"
#import "ABI20_0_0RCTRedBox.h"
#import "ABI20_0_0RCTUtils.h"

static NSString *const ABI20_0_0RCTLogFunctionStack = @"ABI20_0_0RCTLogFunctionStack";

const char *ABI20_0_0RCTLogLevels[] = {
  "trace",
  "info",
  "warn",
  "error",
  "fatal",
};

#if ABI20_0_0RCT_DEBUG
static const ABI20_0_0RCTLogLevel ABI20_0_0RCTDefaultLogThreshold = (ABI20_0_0RCTLogLevel)(ABI20_0_0RCTLogLevelInfo - 1);
#else
static const ABI20_0_0RCTLogLevel ABI20_0_0RCTDefaultLogThreshold = ABI20_0_0RCTLogLevelError;
#endif

static ABI20_0_0RCTLogFunction ABI20_0_0RCTCurrentLogFunction;
static ABI20_0_0RCTLogLevel ABI20_0_0RCTCurrentLogThreshold = ABI20_0_0RCTDefaultLogThreshold;

ABI20_0_0RCTLogLevel ABI20_0_0RCTGetLogThreshold()
{
  return ABI20_0_0RCTCurrentLogThreshold;
}

void ABI20_0_0RCTSetLogThreshold(ABI20_0_0RCTLogLevel threshold) {
  ABI20_0_0RCTCurrentLogThreshold = threshold;
}

ABI20_0_0RCTLogFunction ABI20_0_0RCTDefaultLogFunction = ^(
  ABI20_0_0RCTLogLevel level,
  __unused ABI20_0_0RCTLogSource source,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
)
{
  NSString *log = ABI20_0_0RCTFormatLog([NSDate date], level, fileName, lineNumber, message);
  fprintf(stderr, "%s\n", log.UTF8String);
  fflush(stderr);

  int aslLevel;
  switch(level) {
    case ABI20_0_0RCTLogLevelTrace:
      aslLevel = ASL_LEVEL_DEBUG;
      break;
    case ABI20_0_0RCTLogLevelInfo:
      aslLevel = ASL_LEVEL_NOTICE;
      break;
    case ABI20_0_0RCTLogLevelWarning:
      aslLevel = ASL_LEVEL_WARNING;
      break;
    case ABI20_0_0RCTLogLevelError:
      aslLevel = ASL_LEVEL_ERR;
      break;
    case ABI20_0_0RCTLogLevelFatal:
      aslLevel = ASL_LEVEL_CRIT;
      break;
  }
  asl_log(NULL, NULL, aslLevel, "%s", message.UTF8String);
};

void ABI20_0_0RCTSetLogFunction(ABI20_0_0RCTLogFunction logFunction)
{
  ABI20_0_0RCTCurrentLogFunction = logFunction;
}

ABI20_0_0RCTLogFunction ABI20_0_0RCTGetLogFunction()
{
  if (!ABI20_0_0RCTCurrentLogFunction) {
    ABI20_0_0RCTCurrentLogFunction = ABI20_0_0RCTDefaultLogFunction;
  }
  return ABI20_0_0RCTCurrentLogFunction;
}

void ABI20_0_0RCTAddLogFunction(ABI20_0_0RCTLogFunction logFunction)
{
  ABI20_0_0RCTLogFunction existing = ABI20_0_0RCTGetLogFunction();
  if (existing) {
    ABI20_0_0RCTSetLogFunction(^(ABI20_0_0RCTLogLevel level, ABI20_0_0RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
      existing(level, source, fileName, lineNumber, message);
      logFunction(level, source, fileName, lineNumber, message);
    });
  } else {
    ABI20_0_0RCTSetLogFunction(logFunction);
  }
}

/**
 * returns the topmost stacked log function for the current thread, which
 * may not be the same as the current value of ABI20_0_0RCTCurrentLogFunction.
 */
static ABI20_0_0RCTLogFunction ABI20_0_0RCTGetLocalLogFunction()
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSArray<ABI20_0_0RCTLogFunction> *functionStack = threadDictionary[ABI20_0_0RCTLogFunctionStack];
  ABI20_0_0RCTLogFunction logFunction = functionStack.lastObject;
  if (logFunction) {
    return logFunction;
  }
  return ABI20_0_0RCTGetLogFunction();
}

void ABI20_0_0RCTPerformBlockWithLogFunction(void (^block)(void), ABI20_0_0RCTLogFunction logFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray<ABI20_0_0RCTLogFunction> *functionStack = threadDictionary[ABI20_0_0RCTLogFunctionStack];
  if (!functionStack) {
    functionStack = [NSMutableArray new];
    threadDictionary[ABI20_0_0RCTLogFunctionStack] = functionStack;
  }
  [functionStack addObject:logFunction];
  block();
  [functionStack removeLastObject];
}

void ABI20_0_0RCTPerformBlockWithLogPrefix(void (^block)(void), NSString *prefix)
{
  ABI20_0_0RCTLogFunction logFunction = ABI20_0_0RCTGetLocalLogFunction();
  if (logFunction) {
    ABI20_0_0RCTPerformBlockWithLogFunction(block, ^(ABI20_0_0RCTLogLevel level, ABI20_0_0RCTLogSource source,
                                            NSString *fileName, NSNumber *lineNumber,
                                            NSString *message) {
      logFunction(level, source, fileName, lineNumber, [prefix stringByAppendingString:message]);
    });
  }
}

NSString *ABI20_0_0RCTFormatLog(
  NSDate *timestamp,
  ABI20_0_0RCTLogLevel level,
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
    [log appendFormat:@"[%s]", ABI20_0_0RCTLogLevels[level]];
  }

  [log appendFormat:@"[tid:%@]", ABI20_0_0RCTCurrentThreadName()];

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

static NSRegularExpression *nativeStackFrameRegex()
{
  static dispatch_once_t onceToken;
  static NSRegularExpression *_regex;
  dispatch_once(&onceToken, ^{
    NSError *regexError;
    _regex = [NSRegularExpression regularExpressionWithPattern:@"0x[0-9a-f]+ (.*) \\+ (\\d+)$" options:0 error:&regexError];
    if (regexError) {
      ABI20_0_0RCTLogError(@"Failed to build regex: %@", [regexError localizedDescription]);
    }
  });
  return _regex;
}

void _ABI20_0_0RCTLogNativeInternal(ABI20_0_0RCTLogLevel level, const char *fileName, int lineNumber, NSString *format, ...)
{
  ABI20_0_0RCTLogFunction logFunction = ABI20_0_0RCTGetLocalLogFunction();
  BOOL log = ABI20_0_0RCT_DEBUG || (logFunction != nil);
  if (log && level >= ABI20_0_0RCTGetLogThreshold()) {
    // Get message
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    // Call log function
    if (logFunction) {
      logFunction(level, ABI20_0_0RCTLogSourceNative, fileName ? @(fileName) : nil, lineNumber > 0 ? @(lineNumber) : nil, message);
    }

#if ABI20_0_0RCT_DEV

    // Log to red box in debug mode.
    if (ABI20_0_0RCTSharedApplication() && level >= ABI20_0_0RCTLOG_REDBOX_LEVEL) {
      NSArray<NSString *> *stackSymbols = [NSThread callStackSymbols];
      NSMutableArray<NSDictionary *> *stack =
        [NSMutableArray arrayWithCapacity:(stackSymbols.count - 1)];
      [stackSymbols enumerateObjectsUsingBlock:^(NSString *frameSymbols, NSUInteger idx, __unused BOOL *stop) {
        if (idx == 0) {
          // don't include the current frame
          return;
        }

        NSRange range = NSMakeRange(0, frameSymbols.length);
        NSTextCheckingResult *match = [nativeStackFrameRegex() firstMatchInString:frameSymbols options:0 range:range];
        if (!match) {
          return;
        }

        NSString *methodName = [frameSymbols substringWithRange:[match rangeAtIndex:1]];
        char *demangledName = abi::__cxa_demangle([methodName UTF8String], NULL, NULL, NULL);
        if (demangledName) {
          methodName = @(demangledName);
          free(demangledName);
        }

        if (idx == 1 && fileName) {
          NSString *file = [@(fileName) componentsSeparatedByString:@"/"].lastObject;
          [stack addObject:@{@"methodName": methodName, @"file": file, @"lineNumber": @(lineNumber)}];
        } else {
          [stack addObject:@{@"methodName": methodName}];
        }
      }];

      dispatch_async(dispatch_get_main_queue(), ^{
        // red box is thread safe, but by deferring to main queue we avoid a startup
        // race condition that causes the module to be accessed before it has loaded
        [[ABI20_0_0RCTBridge currentBridge].redBox showErrorMessage:message withStack:stack];
      });
    }

    if (!ABI20_0_0RCTRunningInTestEnvironment()) {
      // Log to JS executor
      [[ABI20_0_0RCTBridge currentBridge] logMessage:message level:level ? @(ABI20_0_0RCTLogLevels[level]) : @"info"];
    }

#endif

  }
}

void _ABI20_0_0RCTLogJavaScriptInternal(ABI20_0_0RCTLogLevel level, NSString *message)
{
  ABI20_0_0RCTLogFunction logFunction = ABI20_0_0RCTGetLocalLogFunction();
  BOOL log = ABI20_0_0RCT_DEBUG || (logFunction != nil);
  if (log && level >= ABI20_0_0RCTGetLogThreshold()) {
    if (logFunction) {
      logFunction(level, ABI20_0_0RCTLogSourceJavaScript, nil, nil, message);
    }
  }
}
