/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTAssert.h"
#import "ABI42_0_0RCTLog.h"

NSString *const ABI42_0_0RCTErrorDomain = @"ABI42_0_0RCTErrorDomain";
NSString *const ABI42_0_0RCTJSStackTraceKey = @"ABI42_0_0RCTJSStackTraceKey";
NSString *const ABI42_0_0RCTJSRawStackTraceKey = @"ABI42_0_0RCTJSRawStackTraceKey";
NSString *const ABI42_0_0RCTFatalExceptionName = @"ABI42_0_0RCTFatalException";
NSString *const ABI42_0_0RCTUntruncatedMessageKey = @"ABI42_0_0RCTUntruncatedMessageKey";

static NSString *const ABI42_0_0RCTAssertFunctionStack = @"ABI42_0_0RCTAssertFunctionStack";

ABI42_0_0RCTAssertFunction ABI42_0_0RCTCurrentAssertFunction = nil;
ABI42_0_0RCTFatalHandler ABI42_0_0RCTCurrentFatalHandler = nil;
ABI42_0_0RCTFatalExceptionHandler ABI42_0_0RCTCurrentFatalExceptionHandler = nil;

NSException *_ABI42_0_0RCTNotImplementedException(SEL, Class);
NSException *_ABI42_0_0RCTNotImplementedException(SEL cmd, Class cls)
{
  NSString *msg = [NSString stringWithFormat:
                                @"%s is not implemented "
                                 "for the class %@",
                                sel_getName(cmd),
                                cls];
  return [NSException exceptionWithName:@"ABI42_0_0RCTNotDesignatedInitializerException" reason:msg userInfo:nil];
}

void ABI42_0_0RCTSetAssertFunction(ABI42_0_0RCTAssertFunction assertFunction)
{
  ABI42_0_0RCTCurrentAssertFunction = assertFunction;
}

ABI42_0_0RCTAssertFunction ABI42_0_0RCTGetAssertFunction(void)
{
  return ABI42_0_0RCTCurrentAssertFunction;
}

void ABI42_0_0RCTAddAssertFunction(ABI42_0_0RCTAssertFunction assertFunction)
{
  ABI42_0_0RCTAssertFunction existing = ABI42_0_0RCTCurrentAssertFunction;
  if (existing) {
    ABI42_0_0RCTCurrentAssertFunction =
        ^(NSString *condition, NSString *fileName, NSNumber *lineNumber, NSString *function, NSString *message) {
          existing(condition, fileName, lineNumber, function, message);
          assertFunction(condition, fileName, lineNumber, function, message);
        };
  } else {
    ABI42_0_0RCTCurrentAssertFunction = assertFunction;
  }
}

/**
 * returns the topmost stacked assert function for the current thread, which
 * may not be the same as the current value of ABI42_0_0RCTCurrentAssertFunction.
 */
static ABI42_0_0RCTAssertFunction ABI42_0_0RCTGetLocalAssertFunction()
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSArray<ABI42_0_0RCTAssertFunction> *functionStack = threadDictionary[ABI42_0_0RCTAssertFunctionStack];
  ABI42_0_0RCTAssertFunction assertFunction = functionStack.lastObject;
  if (assertFunction) {
    return assertFunction;
  }
  return ABI42_0_0RCTCurrentAssertFunction;
}

void ABI42_0_0RCTPerformBlockWithAssertFunction(void (^block)(void), ABI42_0_0RCTAssertFunction assertFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray<ABI42_0_0RCTAssertFunction> *functionStack = threadDictionary[ABI42_0_0RCTAssertFunctionStack];
  if (!functionStack) {
    functionStack = [NSMutableArray new];
    threadDictionary[ABI42_0_0RCTAssertFunctionStack] = functionStack;
  }
  [functionStack addObject:assertFunction];
  block();
  [functionStack removeLastObject];
}

NSString *ABI42_0_0RCTCurrentThreadName(void)
{
  NSThread *thread = [NSThread currentThread];
  NSString *threadName = ABI42_0_0RCTIsMainQueue() || thread.isMainThread ? @"main" : thread.name;
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

void _ABI42_0_0RCTAssertFormat(
    const char *condition,
    const char *fileName,
    int lineNumber,
    const char *function,
    NSString *format,
    ...)
{
  ABI42_0_0RCTAssertFunction assertFunction = ABI42_0_0RCTGetLocalAssertFunction();
  if (assertFunction) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    assertFunction(@(condition), @(fileName), @(lineNumber), @(function), message);
  }
}

void ABI42_0_0RCTFatal(NSError *error)
{
  _ABI42_0_0RCTLogNativeInternal(ABI42_0_0RCTLogLevelFatal, NULL, 0, @"%@", error.localizedDescription);

  ABI42_0_0RCTFatalHandler fatalHandler = ABI42_0_0RCTGetFatalHandler();
  if (fatalHandler) {
    fatalHandler(error);
  } else {
#if DEBUG
    @try {
#endif
      NSString *name = [NSString stringWithFormat:@"%@: %@", ABI42_0_0RCTFatalExceptionName, error.localizedDescription];

      // Truncate the localized description to 175 characters to avoid wild screen overflows
      NSString *message = ABI42_0_0RCTFormatError(error.localizedDescription, error.userInfo[ABI42_0_0RCTJSStackTraceKey], 175);

      // Attach an untruncated copy of the description to the userInfo, in case it is needed
      NSMutableDictionary *userInfo = [error.userInfo mutableCopy];
      [userInfo setObject:ABI42_0_0RCTFormatError(error.localizedDescription, error.userInfo[ABI42_0_0RCTJSStackTraceKey], -1)
                   forKey:ABI42_0_0RCTUntruncatedMessageKey];

      // Expected resulting exception information:
      // name: ABI42_0_0RCTFatalException: <underlying error description>
      // reason: <underlying error description plus JS stack trace, truncated to 175 characters>
      // userInfo: <underlying error userinfo, plus untruncated description plus JS stack trace>
      @throw [[NSException alloc] initWithName:name reason:message userInfo:userInfo];
#if DEBUG
    } @catch (NSException *e) {
    }
#endif
  }
}

void ABI42_0_0RCTSetFatalHandler(ABI42_0_0RCTFatalHandler fatalHandler)
{
  ABI42_0_0RCTCurrentFatalHandler = fatalHandler;
}

ABI42_0_0RCTFatalHandler ABI42_0_0RCTGetFatalHandler(void)
{
  return ABI42_0_0RCTCurrentFatalHandler;
}

NSString *
ABI42_0_0RCTFormatError(NSString *message, NSArray<NSDictionary<NSString *, id> *> *stackTrace, NSUInteger maxMessageLength)
{
  if (maxMessageLength > 0 && message.length > maxMessageLength) {
    message = [[message substringToIndex:maxMessageLength] stringByAppendingString:@"..."];
  }

  NSString *prettyStack = ABI42_0_0RCTFormatStackTrace(stackTrace);

  return [NSString
      stringWithFormat:@"%@%@%@", message, prettyStack ? @", stack:\n" : @"", prettyStack ? prettyStack : @""];
}

NSString *ABI42_0_0RCTFormatStackTrace(NSArray<NSDictionary<NSString *, id> *> *stackTrace)
{
  if (stackTrace) {
    NSMutableString *prettyStack = [NSMutableString string];

    NSRegularExpression *regex =
        [NSRegularExpression regularExpressionWithPattern:@"\\b((?:seg-\\d+(?:_\\d+)?|\\d+)\\.js)"
                                                  options:NSRegularExpressionCaseInsensitive
                                                    error:NULL];
    for (NSDictionary<NSString *, id> *frame in stackTrace) {
      NSString *fileName = [frame[@"file"] lastPathComponent];
      NSTextCheckingResult *match =
          fileName != nil ? [regex firstMatchInString:fileName options:0 range:NSMakeRange(0, fileName.length)] : nil;
      if (match) {
        fileName = [NSString stringWithFormat:@"%@:", [fileName substringWithRange:match.range]];
      } else {
        fileName = @"";
      }

      [prettyStack
          appendFormat:@"%@@%@%@:%@\n", frame[@"methodName"], fileName, frame[@"lineNumber"], frame[@"column"]];
    }

    return prettyStack;
  }
  return nil;
}

void ABI42_0_0RCTFatalException(NSException *exception)
{
  _ABI42_0_0RCTLogNativeInternal(ABI42_0_0RCTLogLevelFatal, NULL, 0, @"%@: %@", exception.name, exception.reason);

  ABI42_0_0RCTFatalExceptionHandler fatalExceptionHandler = ABI42_0_0RCTGetFatalExceptionHandler();
  if (fatalExceptionHandler) {
    fatalExceptionHandler(exception);
  } else {
#if DEBUG
    @try {
#endif
      @throw exception;
#if DEBUG
    } @catch (NSException *e) {
    }
#endif
  }
}

void ABI42_0_0RCTSetFatalExceptionHandler(ABI42_0_0RCTFatalExceptionHandler fatalExceptionHandler)
{
  ABI42_0_0RCTCurrentFatalExceptionHandler = fatalExceptionHandler;
}

ABI42_0_0RCTFatalExceptionHandler ABI42_0_0RCTGetFatalExceptionHandler(void)
{
  return ABI42_0_0RCTCurrentFatalExceptionHandler;
}
