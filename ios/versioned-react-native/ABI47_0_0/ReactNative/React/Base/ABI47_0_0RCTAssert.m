/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTAssert.h"
#import "ABI47_0_0RCTLog.h"

NSString *const ABI47_0_0RCTErrorDomain = @"ABI47_0_0RCTErrorDomain";
NSString *const ABI47_0_0RCTJSStackTraceKey = @"ABI47_0_0RCTJSStackTraceKey";
NSString *const ABI47_0_0RCTJSRawStackTraceKey = @"ABI47_0_0RCTJSRawStackTraceKey";
NSString *const ABI47_0_0RCTObjCStackTraceKey = @"ABI47_0_0RCTObjCStackTraceKey";
NSString *const ABI47_0_0RCTFatalExceptionName = @"ABI47_0_0RCTFatalException";
NSString *const ABI47_0_0RCTUntruncatedMessageKey = @"ABI47_0_0RCTUntruncatedMessageKey";
NSString *const ABI47_0_0RCTJSExtraDataKey = @"ABI47_0_0RCTJSExtraDataKey";

static NSString *const ABI47_0_0RCTAssertFunctionStack = @"ABI47_0_0RCTAssertFunctionStack";

ABI47_0_0RCTAssertFunction ABI47_0_0RCTCurrentAssertFunction = nil;
ABI47_0_0RCTFatalHandler ABI47_0_0RCTCurrentFatalHandler = nil;
ABI47_0_0RCTFatalExceptionHandler ABI47_0_0RCTCurrentFatalExceptionHandler = nil;

NSException *_ABI47_0_0RCTNotImplementedException(SEL, Class);
NSException *_ABI47_0_0RCTNotImplementedException(SEL cmd, Class cls)
{
  NSString *msg = [NSString stringWithFormat:
                                @"%s is not implemented "
                                 "for the class %@",
                                sel_getName(cmd),
                                cls];
  return [NSException exceptionWithName:@"ABI47_0_0RCTNotDesignatedInitializerException" reason:msg userInfo:nil];
}

void ABI47_0_0RCTSetAssertFunction(ABI47_0_0RCTAssertFunction assertFunction)
{
  ABI47_0_0RCTCurrentAssertFunction = assertFunction;
}

ABI47_0_0RCTAssertFunction ABI47_0_0RCTGetAssertFunction(void)
{
  return ABI47_0_0RCTCurrentAssertFunction;
}

void ABI47_0_0RCTAddAssertFunction(ABI47_0_0RCTAssertFunction assertFunction)
{
  ABI47_0_0RCTAssertFunction existing = ABI47_0_0RCTCurrentAssertFunction;
  if (existing) {
    ABI47_0_0RCTCurrentAssertFunction =
        ^(NSString *condition, NSString *fileName, NSNumber *lineNumber, NSString *function, NSString *message) {
          existing(condition, fileName, lineNumber, function, message);
          assertFunction(condition, fileName, lineNumber, function, message);
        };
  } else {
    ABI47_0_0RCTCurrentAssertFunction = assertFunction;
  }
}

/**
 * returns the topmost stacked assert function for the current thread, which
 * may not be the same as the current value of ABI47_0_0RCTCurrentAssertFunction.
 */
static ABI47_0_0RCTAssertFunction ABI47_0_0RCTGetLocalAssertFunction()
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSArray<ABI47_0_0RCTAssertFunction> *functionStack = threadDictionary[ABI47_0_0RCTAssertFunctionStack];
  ABI47_0_0RCTAssertFunction assertFunction = functionStack.lastObject;
  if (assertFunction) {
    return assertFunction;
  }
  return ABI47_0_0RCTCurrentAssertFunction;
}

void ABI47_0_0RCTPerformBlockWithAssertFunction(void (^block)(void), ABI47_0_0RCTAssertFunction assertFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray<ABI47_0_0RCTAssertFunction> *functionStack = threadDictionary[ABI47_0_0RCTAssertFunctionStack];
  if (!functionStack) {
    functionStack = [NSMutableArray new];
    threadDictionary[ABI47_0_0RCTAssertFunctionStack] = functionStack;
  }
  [functionStack addObject:assertFunction];
  block();
  [functionStack removeLastObject];
}

NSString *ABI47_0_0RCTCurrentThreadName(void)
{
  NSThread *thread = [NSThread currentThread];
  NSString *threadName = ABI47_0_0RCTIsMainQueue() || thread.isMainThread ? @"main" : thread.name;
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

void _ABI47_0_0RCTAssertFormat(
    const char *condition,
    const char *fileName,
    int lineNumber,
    const char *function,
    NSString *format,
    ...)
{
  ABI47_0_0RCTAssertFunction assertFunction = ABI47_0_0RCTGetLocalAssertFunction();
  if (assertFunction) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    assertFunction(@(condition), @(fileName), @(lineNumber), @(function), message);
  }
}

void ABI47_0_0RCTFatal(NSError *error)
{
  _ABI47_0_0RCTLogNativeInternal(ABI47_0_0RCTLogLevelFatal, NULL, 0, @"%@", error.localizedDescription);

  ABI47_0_0RCTFatalHandler fatalHandler = ABI47_0_0RCTGetFatalHandler();
  if (fatalHandler) {
    fatalHandler(error);
  } else {
#if DEBUG
    @try {
#endif
      NSString *name = [NSString stringWithFormat:@"%@: %@", ABI47_0_0RCTFatalExceptionName, error.localizedDescription];

      // Truncate the localized description to 175 characters to avoid wild screen overflows
      NSString *message = ABI47_0_0RCTFormatError(error.localizedDescription, error.userInfo[ABI47_0_0RCTJSStackTraceKey], 175);

      // Attach an untruncated copy of the description to the userInfo, in case it is needed
      NSMutableDictionary *userInfo = [error.userInfo mutableCopy];
      [userInfo setObject:ABI47_0_0RCTFormatError(error.localizedDescription, error.userInfo[ABI47_0_0RCTJSStackTraceKey], -1)
                   forKey:ABI47_0_0RCTUntruncatedMessageKey];

      // Expected resulting exception information:
      // name: ABI47_0_0RCTFatalException: <underlying error description>
      // reason: <underlying error description plus JS stack trace, truncated to 175 characters>
      // userInfo: <underlying error userinfo, plus untruncated description plus JS stack trace>
      @throw [[NSException alloc] initWithName:name reason:message userInfo:userInfo];
#if DEBUG
    } @catch (NSException *e) {
    }
#endif
  }
}

void ABI47_0_0RCTSetFatalHandler(ABI47_0_0RCTFatalHandler fatalHandler)
{
  ABI47_0_0RCTCurrentFatalHandler = fatalHandler;
}

ABI47_0_0RCTFatalHandler ABI47_0_0RCTGetFatalHandler(void)
{
  return ABI47_0_0RCTCurrentFatalHandler;
}

NSString *
ABI47_0_0RCTFormatError(NSString *message, NSArray<NSDictionary<NSString *, id> *> *stackTrace, NSUInteger maxMessageLength)
{
  if (maxMessageLength > 0 && message.length > maxMessageLength) {
    message = [[message substringToIndex:maxMessageLength] stringByAppendingString:@"..."];
  }

  NSString *prettyStack = ABI47_0_0RCTFormatStackTrace(stackTrace);

  return [NSString
      stringWithFormat:@"%@%@%@", message, prettyStack ? @", stack:\n" : @"", prettyStack ? prettyStack : @""];
}

NSString *ABI47_0_0RCTFormatStackTrace(NSArray<NSDictionary<NSString *, id> *> *stackTrace)
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

void ABI47_0_0RCTFatalException(NSException *exception)
{
  _ABI47_0_0RCTLogNativeInternal(ABI47_0_0RCTLogLevelFatal, NULL, 0, @"%@: %@", exception.name, exception.reason);

  ABI47_0_0RCTFatalExceptionHandler fatalExceptionHandler = ABI47_0_0RCTGetFatalExceptionHandler();
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

void ABI47_0_0RCTSetFatalExceptionHandler(ABI47_0_0RCTFatalExceptionHandler fatalExceptionHandler)
{
  ABI47_0_0RCTCurrentFatalExceptionHandler = fatalExceptionHandler;
}

ABI47_0_0RCTFatalExceptionHandler ABI47_0_0RCTGetFatalExceptionHandler(void)
{
  return ABI47_0_0RCTCurrentFatalExceptionHandler;
}

// MARK: - New Architecture Validation - Enable Reporting

#if ABI47_0_0RCT_ONLY_NEW_ARCHITECTURE
static ABI47_0_0RCTNotAllowedValidation minValidationLevel = ABI47_0_0RCTNotAllowedInBridgeless;
#else
static ABI47_0_0RCTNotAllowedValidation minValidationLevel = ABI47_0_0RCTNotAllowedValidationDisabled;
#endif

__attribute__((used)) ABI47_0_0RCT_EXTERN void ABI47_0_0RCTNewArchitectureSetMinValidationLevel(ABI47_0_0RCTNotAllowedValidation level)
{
#if ABI47_0_0RCT_ONLY_NEW_ARCHITECTURE
  // Cannot disable the reporting in this mode.
#else
  minValidationLevel = level;
#endif
}

// MARK: - New Architecture Validation - Private

static BOOL shouldEnforceValidation(ABI47_0_0RCTNotAllowedValidation type)
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

static NSString *validationMessage(ABI47_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  NSString *notAllowedType;
  switch (type) {
    case ABI47_0_0RCTNotAllowedValidationDisabled:
      ABI47_0_0RCTAssert(0, @"ABI47_0_0RCTNotAllowedValidationDisabled not a validation type.");
      return nil;
    case ABI47_0_0RCTNotAllowedInFabricWithoutLegacy:
      notAllowedType = @"Fabric";
      break;
    case ABI47_0_0RCTNotAllowedInBridgeless:
      notAllowedType = @"Bridgeless";
      break;
  }

  return
      [NSString stringWithFormat:@"[ABI47_0_0ReactNative Architecture][NotAllowedIn%@] Unexpectedly reached code path in %@. %@",
                                 notAllowedType,
                                 stringDescribingContext(context),
                                 extra ?: @""];
}

static void
newArchitectureValidationInternal(ABI47_0_0RCTLogLevel level, ABI47_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  if (!shouldEnforceValidation(type)) {
    return;
  }

  NSString *msg = validationMessage(type, context, extra);
  if (msg) {
    switch (level) {
      case ABI47_0_0RCTLogLevelInfo:
        ABI47_0_0RCTLogInfo(@"%@", msg);
        break;
      case ABI47_0_0RCTLogLevelError:
        ABI47_0_0RCTLogError(@"%@", msg);
        break;
      case ABI47_0_0RCTLogLevelFatal:
        ABI47_0_0RCTAssert(0, @"%@", msg);
        break;
      default:
        ABI47_0_0RCTAssert(0, @"New architecture validation is only for info, error, and fatal levels.");
    }
  }
}

// MARK: - New Architecture Validation - Public

void ABI47_0_0RCTEnforceNewArchitectureValidation(ABI47_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  newArchitectureValidationInternal(ABI47_0_0RCTLogLevelFatal, type, context, extra);
}

void ABI47_0_0RCTErrorNewArchitectureValidation(ABI47_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
#if ABI47_0_0RCT_ONLY_NEW_ARCHITECTURE
  newArchitectureValidationInternal(ABI47_0_0RCTLogLevelFatal, type, context, extra);
#else
  newArchitectureValidationInternal(ABI47_0_0RCTLogLevelError, type, context, extra);
#endif
}

void ABI47_0_0RCTLogNewArchitectureValidation(ABI47_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
  newArchitectureValidationInternal(ABI47_0_0RCTLogLevelInfo, type, context, extra);
}

void ABI47_0_0RCTNewArchitectureValidationPlaceholder(ABI47_0_0RCTNotAllowedValidation type, id context, NSString *extra)
{
#if ABI47_0_0RCT_ONLY_NEW_ARCHITECTURE
  newArchitectureValidationInternal(ABI47_0_0RCTLogLevelInfo, type, context, extra);
#endif
}
