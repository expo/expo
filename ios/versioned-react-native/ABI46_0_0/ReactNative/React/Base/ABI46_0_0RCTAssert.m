/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTAssert.h"
#import "ABI46_0_0RCTLog.h"

NSString *const ABI46_0_0RCTErrorDomain = @"ABI46_0_0RCTErrorDomain";
NSString *const ABI46_0_0RCTJSStackTraceKey = @"ABI46_0_0RCTJSStackTraceKey";
NSString *const ABI46_0_0RCTJSRawStackTraceKey = @"ABI46_0_0RCTJSRawStackTraceKey";
NSString *const ABI46_0_0RCTObjCStackTraceKey = @"ABI46_0_0RCTObjCStackTraceKey";
NSString *const ABI46_0_0RCTFatalExceptionName = @"ABI46_0_0RCTFatalException";
NSString *const ABI46_0_0RCTUntruncatedMessageKey = @"ABI46_0_0RCTUntruncatedMessageKey";
NSString *const ABI46_0_0RCTJSExtraDataKey = @"ABI46_0_0RCTJSExtraDataKey";

static NSString *const ABI46_0_0RCTAssertFunctionStack = @"ABI46_0_0RCTAssertFunctionStack";

ABI46_0_0RCTAssertFunction ABI46_0_0RCTCurrentAssertFunction = nil;
ABI46_0_0RCTFatalHandler ABI46_0_0RCTCurrentFatalHandler = nil;
ABI46_0_0RCTFatalExceptionHandler ABI46_0_0RCTCurrentFatalExceptionHandler = nil;

NSException *_ABI46_0_0RCTNotImplementedException(SEL, Class);
NSException *_ABI46_0_0RCTNotImplementedException(SEL cmd, Class cls)
{
  NSString *msg = [NSString stringWithFormat:
                                @"%s is not implemented "
                                 "for the class %@",
                                sel_getName(cmd),
                                cls];
  return [NSException exceptionWithName:@"ABI46_0_0RCTNotDesignatedInitializerException" reason:msg userInfo:nil];
}

void ABI46_0_0RCTSetAssertFunction(ABI46_0_0RCTAssertFunction assertFunction)
{
  ABI46_0_0RCTCurrentAssertFunction = assertFunction;
}

ABI46_0_0RCTAssertFunction ABI46_0_0RCTGetAssertFunction(void)
{
  return ABI46_0_0RCTCurrentAssertFunction;
}

void ABI46_0_0RCTAddAssertFunction(ABI46_0_0RCTAssertFunction assertFunction)
{
  ABI46_0_0RCTAssertFunction existing = ABI46_0_0RCTCurrentAssertFunction;
  if (existing) {
    ABI46_0_0RCTCurrentAssertFunction =
        ^(NSString *condition, NSString *fileName, NSNumber *lineNumber, NSString *function, NSString *message) {
          existing(condition, fileName, lineNumber, function, message);
          assertFunction(condition, fileName, lineNumber, function, message);
        };
  } else {
    ABI46_0_0RCTCurrentAssertFunction = assertFunction;
  }
}

/**
 * returns the topmost stacked assert function for the current thread, which
 * may not be the same as the current value of ABI46_0_0RCTCurrentAssertFunction.
 */
static ABI46_0_0RCTAssertFunction ABI46_0_0RCTGetLocalAssertFunction()
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSArray<ABI46_0_0RCTAssertFunction> *functionStack = threadDictionary[ABI46_0_0RCTAssertFunctionStack];
  ABI46_0_0RCTAssertFunction assertFunction = functionStack.lastObject;
  if (assertFunction) {
    return assertFunction;
  }
  return ABI46_0_0RCTCurrentAssertFunction;
}

void ABI46_0_0RCTPerformBlockWithAssertFunction(void (^block)(void), ABI46_0_0RCTAssertFunction assertFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray<ABI46_0_0RCTAssertFunction> *functionStack = threadDictionary[ABI46_0_0RCTAssertFunctionStack];
  if (!functionStack) {
    functionStack = [NSMutableArray new];
    threadDictionary[ABI46_0_0RCTAssertFunctionStack] = functionStack;
  }
  [functionStack addObject:assertFunction];
  block();
  [functionStack removeLastObject];
}

NSString *ABI46_0_0RCTCurrentThreadName(void)
{
  NSThread *thread = [NSThread currentThread];
  NSString *threadName = ABI46_0_0RCTIsMainQueue() || thread.isMainThread ? @"main" : thread.name;
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

void _ABI46_0_0RCTAssertFormat(
    const char *condition,
    const char *fileName,
    int lineNumber,
    const char *function,
    NSString *format,
    ...)
{
  ABI46_0_0RCTAssertFunction assertFunction = ABI46_0_0RCTGetLocalAssertFunction();
  if (assertFunction) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    assertFunction(@(condition), @(fileName), @(lineNumber), @(function), message);
  }
}

void ABI46_0_0RCTFatal(NSError *error)
{
  _ABI46_0_0RCTLogNativeInternal(ABI46_0_0RCTLogLevelFatal, NULL, 0, @"%@", error.localizedDescription);

  ABI46_0_0RCTFatalHandler fatalHandler = ABI46_0_0RCTGetFatalHandler();
  if (fatalHandler) {
    fatalHandler(error);
  } else {
#if DEBUG
    @try {
#endif
      NSString *name = [NSString stringWithFormat:@"%@: %@", ABI46_0_0RCTFatalExceptionName, error.localizedDescription];

      // Truncate the localized description to 175 characters to avoid wild screen overflows
      NSString *message = ABI46_0_0RCTFormatError(error.localizedDescription, error.userInfo[ABI46_0_0RCTJSStackTraceKey], 175);

      // Attach an untruncated copy of the description to the userInfo, in case it is needed
      NSMutableDictionary *userInfo = [error.userInfo mutableCopy];
      [userInfo setObject:ABI46_0_0RCTFormatError(error.localizedDescription, error.userInfo[ABI46_0_0RCTJSStackTraceKey], -1)
                   forKey:ABI46_0_0RCTUntruncatedMessageKey];

      // Expected resulting exception information:
      // name: ABI46_0_0RCTFatalException: <underlying error description>
      // reason: <underlying error description plus JS stack trace, truncated to 175 characters>
      // userInfo: <underlying error userinfo, plus untruncated description plus JS stack trace>
      @throw [[NSException alloc] initWithName:name reason:message userInfo:userInfo];
#if DEBUG
    } @catch (NSException *e) {
    }
#endif
  }
}

void ABI46_0_0RCTSetFatalHandler(ABI46_0_0RCTFatalHandler fatalHandler)
{
  ABI46_0_0RCTCurrentFatalHandler = fatalHandler;
}

ABI46_0_0RCTFatalHandler ABI46_0_0RCTGetFatalHandler(void)
{
  return ABI46_0_0RCTCurrentFatalHandler;
}

NSString *
ABI46_0_0RCTFormatError(NSString *message, NSArray<NSDictionary<NSString *, id> *> *stackTrace, NSUInteger maxMessageLength)
{
  if (maxMessageLength > 0 && message.length > maxMessageLength) {
    message = [[message substringToIndex:maxMessageLength] stringByAppendingString:@"..."];
  }

  NSString *prettyStack = ABI46_0_0RCTFormatStackTrace(stackTrace);

  return [NSString
      stringWithFormat:@"%@%@%@", message, prettyStack ? @", stack:\n" : @"", prettyStack ? prettyStack : @""];
}

NSString *ABI46_0_0RCTFormatStackTrace(NSArray<NSDictionary<NSString *, id> *> *stackTrace)
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

void ABI46_0_0RCTFatalException(NSException *exception)
{
  _ABI46_0_0RCTLogNativeInternal(ABI46_0_0RCTLogLevelFatal, NULL, 0, @"%@: %@", exception.name, exception.reason);

  ABI46_0_0RCTFatalExceptionHandler fatalExceptionHandler = ABI46_0_0RCTGetFatalExceptionHandler();
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

void ABI46_0_0RCTSetFatalExceptionHandler(ABI46_0_0RCTFatalExceptionHandler fatalExceptionHandler)
{
  ABI46_0_0RCTCurrentFatalExceptionHandler = fatalExceptionHandler;
}

ABI46_0_0RCTFatalExceptionHandler ABI46_0_0RCTGetFatalExceptionHandler(void)
{
  return ABI46_0_0RCTCurrentFatalExceptionHandler;
}

// MARK: - New Architecture Validation - Enable Reporting

#if ABI46_0_0RCT_NEW_ARCHITECTURE
static ABI46_0_0RCTNotAllowedValidation validationReportingEnabled = ABI46_0_0RCTNotAllowedInBridgeless;
#else
static ABI46_0_0RCTNotAllowedValidation validationReportingEnabled = ABI46_0_0RCTNotAllowedValidationDisabled;
#endif

__attribute__((used)) ABI46_0_0RCT_EXTERN void ABI46_0_0RCTNewArchitectureValidationSetEnabled(ABI46_0_0RCTNotAllowedValidation type)
{
#if ABI46_0_0RCT_NEW_ARCHITECTURE
  // Cannot disable the reporting in this mode.
#else
  validationReportingEnabled = type;
#endif
}

// MARK: - New Architecture Validation - Private

static BOOL shouldEnforceValidation(ABI46_0_0RCTNotAllowedValidation type)
{
  switch (type) {
    case ABI46_0_0RCTNotAllowedInAppWideFabric:
      return validationReportingEnabled == ABI46_0_0RCTNotAllowedInBridgeless ||
          validationReportingEnabled == ABI46_0_0RCTNotAllowedInAppWideFabric;
    case ABI46_0_0RCTNotAllowedInBridgeless:
      return validationReportingEnabled == ABI46_0_0RCTNotAllowedInBridgeless;
    case ABI46_0_0RCTNotAllowedValidationDisabled:
      return NO;
  }
  return NO;
}

static NSString *stringDescribingContext(id context)
{
  if ([context isKindOfClass:NSString.class]) {
    return context;
  } else if (context) {
    Class klass = [context class];
    if (klass) {
      return NSStringFromClass(klass);
    }
  }
  return @"uncategorized";
}

static NSString *validationMessage(ABI46_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  NSString *notAllowedType;
  switch (type) {
    case ABI46_0_0RCTNotAllowedValidationDisabled:
      ABI46_0_0RCTAssert(0, @"ABI46_0_0RCTNotAllowedValidationDisabled not a validation type.");
      break;
    case ABI46_0_0RCTNotAllowedInAppWideFabric:
      notAllowedType = @"Fabric";
      break;
    case ABI46_0_0RCTNotAllowedInBridgeless:
      notAllowedType = @"Bridgeless";
      break;
  }

  return
      [NSString stringWithFormat:@"[ABI46_0_0ReactNative Architecture][NotAllowedIn%@] Unexpectedly reached code path in %@. %@",
                                 notAllowedType,
                                 stringDescribingContext(context),
                                 extra ?: @""];
}

// MARK: - New Architecture Validation - Public

void ABI46_0_0RCTEnforceNewArchitectureValidation(ABI46_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  if (!shouldEnforceValidation(type)) {
    return;
  }

  ABI46_0_0RCTAssert(0, @"%@", validationMessage(type, context, extra));
}

void ABI46_0_0RCTErrorNewArchitectureValidation(ABI46_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  if (!shouldEnforceValidation(type)) {
    return;
  }

  ABI46_0_0RCTLogError(@"%@", validationMessage(type, context, extra));
}

void ABI46_0_0RCTLogNewArchitectureValidation(ABI46_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  if (!shouldEnforceValidation(type)) {
    return;
  }

  ABI46_0_0RCTLogInfo(@"%@", validationMessage(type, context, extra));
}
