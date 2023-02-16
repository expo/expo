/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTAssert.h"
#import "ABI48_0_0RCTLog.h"

NSString *const ABI48_0_0RCTErrorDomain = @"ABI48_0_0RCTErrorDomain";
NSString *const ABI48_0_0RCTJSStackTraceKey = @"ABI48_0_0RCTJSStackTraceKey";
NSString *const ABI48_0_0RCTJSRawStackTraceKey = @"ABI48_0_0RCTJSRawStackTraceKey";
NSString *const ABI48_0_0RCTObjCStackTraceKey = @"ABI48_0_0RCTObjCStackTraceKey";
NSString *const ABI48_0_0RCTFatalExceptionName = @"ABI48_0_0RCTFatalException";
NSString *const ABI48_0_0RCTUntruncatedMessageKey = @"ABI48_0_0RCTUntruncatedMessageKey";
NSString *const ABI48_0_0RCTJSExtraDataKey = @"ABI48_0_0RCTJSExtraDataKey";

static NSString *const ABI48_0_0RCTAssertFunctionStack = @"ABI48_0_0RCTAssertFunctionStack";

ABI48_0_0RCTAssertFunction ABI48_0_0RCTCurrentAssertFunction = nil;
ABI48_0_0RCTFatalHandler ABI48_0_0RCTCurrentFatalHandler = nil;
ABI48_0_0RCTFatalExceptionHandler ABI48_0_0RCTCurrentFatalExceptionHandler = nil;

NSException *_ABI48_0_0RCTNotImplementedException(SEL, Class);
NSException *_ABI48_0_0RCTNotImplementedException(SEL cmd, Class cls)
{
  NSString *msg = [NSString stringWithFormat:
                                @"%s is not implemented "
                                 "for the class %@",
                                sel_getName(cmd),
                                cls];
  return [NSException exceptionWithName:@"ABI48_0_0RCTNotDesignatedInitializerException" reason:msg userInfo:nil];
}

void ABI48_0_0RCTSetAssertFunction(ABI48_0_0RCTAssertFunction assertFunction)
{
  ABI48_0_0RCTCurrentAssertFunction = assertFunction;
}

ABI48_0_0RCTAssertFunction ABI48_0_0RCTGetAssertFunction(void)
{
  return ABI48_0_0RCTCurrentAssertFunction;
}

void ABI48_0_0RCTAddAssertFunction(ABI48_0_0RCTAssertFunction assertFunction)
{
  ABI48_0_0RCTAssertFunction existing = ABI48_0_0RCTCurrentAssertFunction;
  if (existing) {
    ABI48_0_0RCTCurrentAssertFunction =
        ^(NSString *condition, NSString *fileName, NSNumber *lineNumber, NSString *function, NSString *message) {
          existing(condition, fileName, lineNumber, function, message);
          assertFunction(condition, fileName, lineNumber, function, message);
        };
  } else {
    ABI48_0_0RCTCurrentAssertFunction = assertFunction;
  }
}

/**
 * returns the topmost stacked assert function for the current thread, which
 * may not be the same as the current value of ABI48_0_0RCTCurrentAssertFunction.
 */
static ABI48_0_0RCTAssertFunction ABI48_0_0RCTGetLocalAssertFunction()
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSArray<ABI48_0_0RCTAssertFunction> *functionStack = threadDictionary[ABI48_0_0RCTAssertFunctionStack];
  ABI48_0_0RCTAssertFunction assertFunction = functionStack.lastObject;
  if (assertFunction) {
    return assertFunction;
  }
  return ABI48_0_0RCTCurrentAssertFunction;
}

void ABI48_0_0RCTPerformBlockWithAssertFunction(void (^block)(void), ABI48_0_0RCTAssertFunction assertFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray<ABI48_0_0RCTAssertFunction> *functionStack = threadDictionary[ABI48_0_0RCTAssertFunctionStack];
  if (!functionStack) {
    functionStack = [NSMutableArray new];
    threadDictionary[ABI48_0_0RCTAssertFunctionStack] = functionStack;
  }
  [functionStack addObject:assertFunction];
  block();
  [functionStack removeLastObject];
}

NSString *ABI48_0_0RCTCurrentThreadName(void)
{
  NSThread *thread = [NSThread currentThread];
  NSString *threadName = ABI48_0_0RCTIsMainQueue() || thread.isMainThread ? @"main" : thread.name;
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

void _ABI48_0_0RCTAssertFormat(
    const char *condition,
    const char *fileName,
    int lineNumber,
    const char *function,
    NSString *format,
    ...)
{
  ABI48_0_0RCTAssertFunction assertFunction = ABI48_0_0RCTGetLocalAssertFunction();
  if (assertFunction) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    assertFunction(@(condition), @(fileName), @(lineNumber), @(function), message);
  }
}

void ABI48_0_0RCTFatal(NSError *error)
{
  _ABI48_0_0RCTLogNativeInternal(ABI48_0_0RCTLogLevelFatal, NULL, 0, @"%@", error.localizedDescription);

  ABI48_0_0RCTFatalHandler fatalHandler = ABI48_0_0RCTGetFatalHandler();
  if (fatalHandler) {
    fatalHandler(error);
  } else {
#if DEBUG
    @try {
#endif
      NSString *name = [NSString stringWithFormat:@"%@: %@", ABI48_0_0RCTFatalExceptionName, error.localizedDescription];

      // Truncate the localized description to 175 characters to avoid wild screen overflows
      NSString *message = ABI48_0_0RCTFormatError(error.localizedDescription, error.userInfo[ABI48_0_0RCTJSStackTraceKey], 175);

      // Attach an untruncated copy of the description to the userInfo, in case it is needed
      NSMutableDictionary *userInfo = [error.userInfo mutableCopy];
      [userInfo setObject:ABI48_0_0RCTFormatError(error.localizedDescription, error.userInfo[ABI48_0_0RCTJSStackTraceKey], -1)
                   forKey:ABI48_0_0RCTUntruncatedMessageKey];

      // Expected resulting exception information:
      // name: ABI48_0_0RCTFatalException: <underlying error description>
      // reason: <underlying error description plus JS stack trace, truncated to 175 characters>
      // userInfo: <underlying error userinfo, plus untruncated description plus JS stack trace>
      @throw [[NSException alloc] initWithName:name reason:message userInfo:userInfo];
#if DEBUG
    } @catch (NSException *e) {
    }
#endif
  }
}

void ABI48_0_0RCTSetFatalHandler(ABI48_0_0RCTFatalHandler fatalHandler)
{
  ABI48_0_0RCTCurrentFatalHandler = fatalHandler;
}

ABI48_0_0RCTFatalHandler ABI48_0_0RCTGetFatalHandler(void)
{
  return ABI48_0_0RCTCurrentFatalHandler;
}

NSString *
ABI48_0_0RCTFormatError(NSString *message, NSArray<NSDictionary<NSString *, id> *> *stackTrace, NSUInteger maxMessageLength)
{
  if (maxMessageLength > 0 && message.length > maxMessageLength) {
    message = [[message substringToIndex:maxMessageLength] stringByAppendingString:@"..."];
  }

  NSString *prettyStack = ABI48_0_0RCTFormatStackTrace(stackTrace);

  return [NSString
      stringWithFormat:@"%@%@%@", message, prettyStack ? @", stack:\n" : @"", prettyStack ? prettyStack : @""];
}

NSString *ABI48_0_0RCTFormatStackTrace(NSArray<NSDictionary<NSString *, id> *> *stackTrace)
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

void ABI48_0_0RCTFatalException(NSException *exception)
{
  _ABI48_0_0RCTLogNativeInternal(ABI48_0_0RCTLogLevelFatal, NULL, 0, @"%@: %@", exception.name, exception.reason);

  ABI48_0_0RCTFatalExceptionHandler fatalExceptionHandler = ABI48_0_0RCTGetFatalExceptionHandler();
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

void ABI48_0_0RCTSetFatalExceptionHandler(ABI48_0_0RCTFatalExceptionHandler fatalExceptionHandler)
{
  ABI48_0_0RCTCurrentFatalExceptionHandler = fatalExceptionHandler;
}

ABI48_0_0RCTFatalExceptionHandler ABI48_0_0RCTGetFatalExceptionHandler(void)
{
  return ABI48_0_0RCTCurrentFatalExceptionHandler;
}

// MARK: - New Architecture Validation - Enable Reporting

#if ABI48_0_0RCT_ONLY_NEW_ARCHITECTURE
static ABI48_0_0RCTNotAllowedValidation minValidationLevel = ABI48_0_0RCTNotAllowedInBridgeless;
#else
static ABI48_0_0RCTNotAllowedValidation minValidationLevel = ABI48_0_0RCTNotAllowedValidationDisabled;
#endif

__attribute__((used)) ABI48_0_0RCT_EXTERN void ABI48_0_0RCTNewArchitectureSetMinValidationLevel(ABI48_0_0RCTNotAllowedValidation level)
{
#if ABI48_0_0RCT_ONLY_NEW_ARCHITECTURE
  // Cannot disable the reporting in this mode.
#else
  minValidationLevel = level;
#endif
}

// MARK: - New Architecture Validation - Private

static BOOL shouldEnforceValidation(ABI48_0_0RCTNotAllowedValidation type)
{
  return type >= minValidationLevel;
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

static NSString *validationMessage(ABI48_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  NSString *notAllowedType;
  switch (type) {
    case ABI48_0_0RCTNotAllowedValidationDisabled:
      ABI48_0_0RCTAssert(0, @"ABI48_0_0RCTNotAllowedValidationDisabled not a validation type.");
      return nil;
    case ABI48_0_0RCTNotAllowedInFabricWithoutLegacy:
      notAllowedType = @"Fabric";
      break;
    case ABI48_0_0RCTNotAllowedInBridgeless:
      notAllowedType = @"Bridgeless";
      break;
  }

  return
      [NSString stringWithFormat:@"[ABI48_0_0ReactNative Architecture][NotAllowedIn%@] Unexpectedly reached code path in %@. %@",
                                 notAllowedType,
                                 stringDescribingContext(context),
                                 extra ?: @""];
}

static void
newArchitectureValidationInternal(ABI48_0_0RCTLogLevel level, ABI48_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  if (!shouldEnforceValidation(type)) {
    return;
  }

  NSString *msg = validationMessage(type, context, extra);
  if (msg) {
    switch (level) {
      case ABI48_0_0RCTLogLevelInfo:
        ABI48_0_0RCTLogInfo(@"%@", msg);
        break;
      case ABI48_0_0RCTLogLevelError:
        ABI48_0_0RCTLogError(@"%@", msg);
        break;
      case ABI48_0_0RCTLogLevelFatal:
        ABI48_0_0RCTAssert(0, @"%@", msg);
        break;
      default:
        ABI48_0_0RCTAssert(0, @"New architecture validation is only for info, error, and fatal levels.");
    }
  }
}

// MARK: - New Architecture Validation - Public

void ABI48_0_0RCTEnforceNewArchitectureValidation(ABI48_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  newArchitectureValidationInternal(ABI48_0_0RCTLogLevelFatal, type, context, extra);
}

void ABI48_0_0RCTErrorNewArchitectureValidation(ABI48_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
#if ABI48_0_0RCT_ONLY_NEW_ARCHITECTURE
  newArchitectureValidationInternal(ABI48_0_0RCTLogLevelFatal, type, context, extra);
#else
  newArchitectureValidationInternal(ABI48_0_0RCTLogLevelError, type, context, extra);
#endif
}

void ABI48_0_0RCTLogNewArchitectureValidation(ABI48_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  newArchitectureValidationInternal(ABI48_0_0RCTLogLevelInfo, type, context, extra);
}

void ABI48_0_0RCTNewArchitectureValidationPlaceholder(ABI48_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
#if ABI48_0_0RCT_ONLY_NEW_ARCHITECTURE
  newArchitectureValidationInternal(ABI48_0_0RCTLogLevelInfo, type, context, extra);
#endif
}
