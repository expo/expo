/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTAssert.h"
#import "ABI24_0_0RCTLog.h"

NSString *const ABI24_0_0RCTErrorDomain = @"ABI24_0_0RCTErrorDomain";
NSString *const ABI24_0_0RCTJSStackTraceKey = @"ABI24_0_0RCTJSStackTraceKey";
NSString *const ABI24_0_0RCTJSRawStackTraceKey = @"ABI24_0_0RCTJSRawStackTraceKey";
NSString *const ABI24_0_0RCTFatalExceptionName = @"ABI24_0_0RCTFatalException";

static NSString *const ABI24_0_0RCTAssertFunctionStack = @"ABI24_0_0RCTAssertFunctionStack";

ABI24_0_0RCTAssertFunction ABI24_0_0RCTCurrentAssertFunction = nil;
ABI24_0_0RCTFatalHandler ABI24_0_0RCTCurrentFatalHandler = nil;

NSException *_ABI24_0_0RCTNotImplementedException(SEL, Class);
NSException *_ABI24_0_0RCTNotImplementedException(SEL cmd, Class cls)
{
  NSString *msg = [NSString stringWithFormat:@"%s is not implemented "
                   "for the class %@", sel_getName(cmd), cls];
  return [NSException exceptionWithName:@"ABI24_0_0RCTNotDesignatedInitializerException"
                                 reason:msg userInfo:nil];
}

void ABI24_0_0RCTSetAssertFunction(ABI24_0_0RCTAssertFunction assertFunction)
{
  ABI24_0_0RCTCurrentAssertFunction = assertFunction;
}

ABI24_0_0RCTAssertFunction ABI24_0_0RCTGetAssertFunction(void)
{
  return ABI24_0_0RCTCurrentAssertFunction;
}

void ABI24_0_0RCTAddAssertFunction(ABI24_0_0RCTAssertFunction assertFunction)
{
  ABI24_0_0RCTAssertFunction existing = ABI24_0_0RCTCurrentAssertFunction;
  if (existing) {
    ABI24_0_0RCTCurrentAssertFunction = ^(NSString *condition,
                                 NSString *fileName,
                                 NSNumber *lineNumber,
                                 NSString *function,
                                 NSString *message) {

      existing(condition, fileName, lineNumber, function, message);
      assertFunction(condition, fileName, lineNumber, function, message);
    };
  } else {
    ABI24_0_0RCTCurrentAssertFunction = assertFunction;
  }
}

/**
 * returns the topmost stacked assert function for the current thread, which
 * may not be the same as the current value of ABI24_0_0RCTCurrentAssertFunction.
 */
static ABI24_0_0RCTAssertFunction ABI24_0_0RCTGetLocalAssertFunction()
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSArray<ABI24_0_0RCTAssertFunction> *functionStack = threadDictionary[ABI24_0_0RCTAssertFunctionStack];
  ABI24_0_0RCTAssertFunction assertFunction = functionStack.lastObject;
  if (assertFunction) {
    return assertFunction;
  }
  return ABI24_0_0RCTCurrentAssertFunction;
}

void ABI24_0_0RCTPerformBlockWithAssertFunction(void (^block)(void), ABI24_0_0RCTAssertFunction assertFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray<ABI24_0_0RCTAssertFunction> *functionStack = threadDictionary[ABI24_0_0RCTAssertFunctionStack];
  if (!functionStack) {
    functionStack = [NSMutableArray new];
    threadDictionary[ABI24_0_0RCTAssertFunctionStack] = functionStack;
  }
  [functionStack addObject:assertFunction];
  block();
  [functionStack removeLastObject];
}

NSString *ABI24_0_0RCTCurrentThreadName(void)
{
  NSThread *thread = [NSThread currentThread];
  NSString *threadName = ABI24_0_0RCTIsMainQueue() || thread.isMainThread ? @"main" : thread.name;
  if (threadName.length == 0) {
    const char *label = dispatch_queue_get_label(DISPATCH_CURRENT_QUEUE_LABEL);
    if (label && strlen(label) > 0) {
      threadName = @(label);
    } else {
      threadName = [NSString stringWithFormat:@"%p", thread];
    }
  }
  return threadName;
}

void _ABI24_0_0RCTAssertFormat(
  const char *condition,
  const char *fileName,
  int lineNumber,
  const char *function,
  NSString *format, ...)
{
  ABI24_0_0RCTAssertFunction assertFunction = ABI24_0_0RCTGetLocalAssertFunction();
  if (assertFunction) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    assertFunction(@(condition), @(fileName), @(lineNumber), @(function), message);
  }
}

void ABI24_0_0RCTFatal(NSError *error)
{
  _ABI24_0_0RCTLogNativeInternal(ABI24_0_0RCTLogLevelFatal, NULL, 0, @"%@", error.localizedDescription);

  ABI24_0_0RCTFatalHandler fatalHandler = ABI24_0_0RCTGetFatalHandler();
  if (fatalHandler) {
    fatalHandler(error);
  } else {
#if DEBUG
    @try {
#endif
      NSString *name = [NSString stringWithFormat:@"%@: %@", ABI24_0_0RCTFatalExceptionName, error.localizedDescription];
      NSString *message = ABI24_0_0RCTFormatError(error.localizedDescription, error.userInfo[ABI24_0_0RCTJSStackTraceKey], 75);
      [NSException raise:name format:@"%@", message];
#if DEBUG
    } @catch (NSException *e) {}
#endif
  }
}

void ABI24_0_0RCTSetFatalHandler(ABI24_0_0RCTFatalHandler fatalhandler)
{
  ABI24_0_0RCTCurrentFatalHandler = fatalhandler;
}

ABI24_0_0RCTFatalHandler ABI24_0_0RCTGetFatalHandler(void)
{
  return ABI24_0_0RCTCurrentFatalHandler;
}

NSString *ABI24_0_0RCTFormatError(NSString *message, NSArray<NSDictionary<NSString *, id> *> *stackTrace, NSUInteger maxMessageLength)
{
  if (maxMessageLength > 0 && message.length > maxMessageLength) {
    message = [[message substringToIndex:maxMessageLength] stringByAppendingString:@"..."];
  }

  NSMutableString *prettyStack = [NSMutableString string];
  if (stackTrace) {
    [prettyStack appendString:@", stack:\n"];

    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"^(\\d+\\.js)$"
                                                                           options:NSRegularExpressionCaseInsensitive
                                                                             error:NULL];
    for (NSDictionary<NSString *, id> *frame in stackTrace) {
      NSString *fileName = [frame[@"file"] lastPathComponent];
      if (fileName && [regex numberOfMatchesInString:fileName options:0 range:NSMakeRange(0, [fileName length])]) {
        fileName = [fileName stringByAppendingString:@":"];
      } else {
        fileName = @"";
      }

      [prettyStack appendFormat:@"%@@%@%@:%@\n", frame[@"methodName"], fileName, frame[@"lineNumber"], frame[@"column"]];
    }
  }

  return [NSString stringWithFormat:@"%@%@", message, prettyStack];
}
