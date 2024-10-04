/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTModuleMethod.h"

#import <objc/message.h>

#import "ABI47_0_0RCTAssert.h"
#import "ABI47_0_0RCTBridge+Private.h"
#import "ABI47_0_0RCTBridge.h"
#import "ABI47_0_0RCTConvert.h"
#import "ABI47_0_0RCTCxxConvert.h"
#import "ABI47_0_0RCTLog.h"
#import "ABI47_0_0RCTManagedPointer.h"
#import "ABI47_0_0RCTParserUtils.h"
#import "ABI47_0_0RCTProfile.h"
#import "ABI47_0_0RCTUtils.h"

typedef BOOL (^ABI47_0_0RCTArgumentBlock)(ABI47_0_0RCTBridge *, NSUInteger, id);

/**
 * Get the converter function for the specified type
 */
static SEL selectorForType(NSString *type)
{
  const char *input = type.UTF8String;
  return NSSelectorFromString([ABI47_0_0RCTParseType(&input) stringByAppendingString:@":"]);
}

@implementation ABI47_0_0RCTMethodArgument

- (instancetype)initWithType:(NSString *)type nullability:(ABI47_0_0RCTNullability)nullability unused:(BOOL)unused
{
  if (self = [super init]) {
    _type = [type copy];
    _nullability = nullability;
    _unused = unused;
  }
  return self;
}

@end

@implementation ABI47_0_0RCTModuleMethod {
  Class _moduleClass;
  const ABI47_0_0RCTMethodInfo *_methodInfo;
  NSString *_JSMethodName;

  SEL _selector;
  NSInvocation *_invocation;
  NSArray<ABI47_0_0RCTArgumentBlock> *_argumentBlocks;
  NSMutableArray *_retainedObjects;
}

static void ABI47_0_0RCTLogArgumentError(ABI47_0_0RCTModuleMethod *method, NSUInteger index, id valueOrType, const char *issue)
{
  ABI47_0_0RCTLogError(
      @"Argument %tu (%@) of %@.%s %s",
      index,
      valueOrType,
      ABI47_0_0RCTBridgeModuleNameForClass(method->_moduleClass),
      method.JSMethodName,
      issue);
}

ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

ABI47_0_0RCT_EXTERN_C_BEGIN

// returns YES if the selector ends in a colon (indicating that there is at
// least one argument, and maybe more selector parts) or NO if it doesn't.
static BOOL ABI47_0_0RCTParseSelectorPart(const char **input, NSMutableString *selector)
{
  NSString *selectorPart;
  if (ABI47_0_0RCTParseSelectorIdentifier(input, &selectorPart)) {
    [selector appendString:selectorPart];
  }
  ABI47_0_0RCTSkipWhitespace(input);
  if (ABI47_0_0RCTReadChar(input, ':')) {
    [selector appendString:@":"];
    ABI47_0_0RCTSkipWhitespace(input);
    return YES;
  }
  return NO;
}

static BOOL ABI47_0_0RCTParseUnused(const char **input)
{
  return ABI47_0_0RCTReadString(input, "__attribute__((unused))") || ABI47_0_0RCTReadString(input, "__attribute__((__unused__))") ||
      ABI47_0_0RCTReadString(input, "__unused");
}

static ABI47_0_0RCTNullability ABI47_0_0RCTParseNullability(const char **input)
{
  if (ABI47_0_0RCTReadString(input, "nullable")) {
    return ABI47_0_0RCTNullable;
  } else if (ABI47_0_0RCTReadString(input, "nonnull")) {
    return ABI47_0_0RCTNonnullable;
  }
  return ABI47_0_0RCTNullabilityUnspecified;
}

static ABI47_0_0RCTNullability ABI47_0_0RCTParseNullabilityPostfix(const char **input)
{
  if (ABI47_0_0RCTReadString(input, "_Nullable") || ABI47_0_0RCTReadString(input, "__nullable")) {
    return ABI47_0_0RCTNullable;
  } else if (ABI47_0_0RCTReadString(input, "_Nonnull") || ABI47_0_0RCTReadString(input, "__nonnull")) {
    return ABI47_0_0RCTNonnullable;
  }
  return ABI47_0_0RCTNullabilityUnspecified;
}

// returns YES if execution is safe to proceed (enqueue callback invocation), NO if callback has already been invoked
#if ABI47_0_0RCT_DEBUG
static BOOL checkCallbackMultipleInvocations(BOOL *didInvoke)
{
  if (*didInvoke) {
    ABI47_0_0RCTFatal(ABI47_0_0RCTErrorWithMessage(
        @"Illegal callback invocation from native module. This callback type only permits a single invocation from native code."));
    return NO;
  } else {
    *didInvoke = YES;
    return YES;
  }
}
#endif

NSString *ABI47_0_0RCTParseMethodSignature(const char *input, NSArray<ABI47_0_0RCTMethodArgument *> **arguments)
{
  ABI47_0_0RCTSkipWhitespace(&input);

  NSMutableArray *args;
  NSMutableString *selector = [NSMutableString new];
  while (ABI47_0_0RCTParseSelectorPart(&input, selector)) {
    if (!args) {
      args = [NSMutableArray new];
    }

    // Parse type
    if (ABI47_0_0RCTReadChar(&input, '(')) {
      ABI47_0_0RCTSkipWhitespace(&input);

      // 5 cases that both nullable and __unused exist
      // 1: foo:(nullable __unused id)foo 2: foo:(nullable id __unused)foo
      // 3: foo:(__unused id _Nullable)foo 4: foo:(id __unused _Nullable)foo
      // 5: foo:(id _Nullable __unused)foo
      ABI47_0_0RCTNullability nullability = ABI47_0_0RCTParseNullability(&input);
      ABI47_0_0RCTSkipWhitespace(&input);

      BOOL unused = ABI47_0_0RCTParseUnused(&input);
      ABI47_0_0RCTSkipWhitespace(&input);

      NSString *type = ABI47_0_0RCTParseType(&input);
      ABI47_0_0RCTSkipWhitespace(&input);

      if (nullability == ABI47_0_0RCTNullabilityUnspecified) {
        nullability = ABI47_0_0RCTParseNullabilityPostfix(&input);
        ABI47_0_0RCTSkipWhitespace(&input);
        if (!unused) {
          unused = ABI47_0_0RCTParseUnused(&input);
          ABI47_0_0RCTSkipWhitespace(&input);
          if (unused && nullability == ABI47_0_0RCTNullabilityUnspecified) {
            nullability = ABI47_0_0RCTParseNullabilityPostfix(&input);
            ABI47_0_0RCTSkipWhitespace(&input);
          }
        }
      } else if (!unused) {
        unused = ABI47_0_0RCTParseUnused(&input);
        ABI47_0_0RCTSkipWhitespace(&input);
      }
      [args addObject:[[ABI47_0_0RCTMethodArgument alloc] initWithType:type nullability:nullability unused:unused]];
      ABI47_0_0RCTSkipWhitespace(&input);
      ABI47_0_0RCTReadChar(&input, ')');
      ABI47_0_0RCTSkipWhitespace(&input);
    } else {
      // Type defaults to id if unspecified
      [args addObject:[[ABI47_0_0RCTMethodArgument alloc] initWithType:@"id" nullability:ABI47_0_0RCTNullable unused:NO]];
    }

    // Argument name
    ABI47_0_0RCTParseArgumentIdentifier(&input, NULL);
    ABI47_0_0RCTSkipWhitespace(&input);
  }

  *arguments = [args copy];
  return selector;
}

ABI47_0_0RCT_EXTERN_C_END

- (instancetype)initWithExportedMethod:(const ABI47_0_0RCTMethodInfo *)exportedMethod moduleClass:(Class)moduleClass
{
  if (self = [super init]) {
    _moduleClass = moduleClass;
    _methodInfo = exportedMethod;
  }
  return self;
}

- (void)processMethodSignature
{
  NSArray<ABI47_0_0RCTMethodArgument *> *arguments;
  _selector = NSSelectorFromString(ABI47_0_0RCTParseMethodSignature(_methodInfo->objcName, &arguments));
  ABI47_0_0RCTAssert(_selector, @"%s is not a valid selector", _methodInfo->objcName);

  // Create method invocation
  NSMethodSignature *methodSignature = [_moduleClass instanceMethodSignatureForSelector:_selector];
  ABI47_0_0RCTAssert(methodSignature, @"%s is not a recognized Objective-C method.", sel_getName(_selector));
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
  invocation.selector = _selector;
  _invocation = invocation;
  NSMutableArray *retainedObjects = [NSMutableArray array];
  _retainedObjects = retainedObjects;

  // Process arguments
  NSUInteger numberOfArguments = methodSignature.numberOfArguments;
  NSMutableArray<ABI47_0_0RCTArgumentBlock> *argumentBlocks = [[NSMutableArray alloc] initWithCapacity:numberOfArguments - 2];

#if ABI47_0_0RCT_DEBUG
  __weak ABI47_0_0RCTModuleMethod *weakSelf = self;
#endif

#define ABI47_0_0RCT_RETAINED_ARG_BLOCK(_logic)                                                         \
  [argumentBlocks addObject:^(__unused __weak ABI47_0_0RCTBridge * bridge, NSUInteger index, id json) { \
    _logic [invocation setArgument:&value atIndex:(index) + 2];                                \
    if (value) {                                                                               \
      [retainedObjects addObject:value];                                                       \
    }                                                                                          \
    return YES;                                                                                \
  }]

#define __PRIMITIVE_CASE(_type, _nullable)                                                \
  {                                                                                       \
    isNullableType = _nullable;                                                           \
    _type (*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;                    \
    [argumentBlocks addObject:^(__unused ABI47_0_0RCTBridge * bridge, NSUInteger index, id json) { \
      _type value = convert([ABI47_0_0RCTConvert class], selector, json);                          \
      [invocation setArgument:&value atIndex:(index) + 2];                                \
      return YES;                                                                         \
    }];                                                                                   \
    break;                                                                                \
  }

#define PRIMITIVE_CASE(_type) __PRIMITIVE_CASE(_type, NO)
#define NULLABLE_PRIMITIVE_CASE(_type) __PRIMITIVE_CASE(_type, YES)

// Explicitly copy the block
#define __COPY_BLOCK(block...)         \
  id value = [block copy];             \
  if (value) {                         \
    [retainedObjects addObject:value]; \
  }

#if ABI47_0_0RCT_DEBUG
#define BLOCK_CASE(_block_args, _block)                                        \
  ABI47_0_0RCT_RETAINED_ARG_BLOCK(if (json && ![json isKindOfClass:[NSNumber class]]) { \
    ABI47_0_0RCTLogArgumentError(weakSelf, index, json, "should be a function");        \
    return NO;                                                                 \
  } __block BOOL didInvoke = NO;                                               \
                         __COPY_BLOCK(^_block_args {                           \
                           if (checkCallbackMultipleInvocations(&didInvoke))   \
                             _block                                            \
                         });)
#else
#define BLOCK_CASE(_block_args, _block)             \
  ABI47_0_0RCT_RETAINED_ARG_BLOCK(__COPY_BLOCK(^_block_args{ \
      _block});)
#endif

  for (NSUInteger i = 2; i < numberOfArguments; i++) {
    const char *objcType = [methodSignature getArgumentTypeAtIndex:i];
    BOOL isNullableType = NO;
    ABI47_0_0RCTMethodArgument *argument = arguments[i - 2];
    NSString *typeName = argument.type;
    SEL selector = selectorForType(typeName);
    if ([ABI47_0_0RCTConvert respondsToSelector:selector]) {
      switch (objcType[0]) {
        // Primitives
        case _C_CHR:
          PRIMITIVE_CASE(char)
        case _C_UCHR:
          PRIMITIVE_CASE(unsigned char)
        case _C_SHT:
          PRIMITIVE_CASE(short)
        case _C_USHT:
          PRIMITIVE_CASE(unsigned short)
        case _C_INT:
          PRIMITIVE_CASE(int)
        case _C_UINT:
          PRIMITIVE_CASE(unsigned int)
        case _C_LNG:
          PRIMITIVE_CASE(long)
        case _C_ULNG:
          PRIMITIVE_CASE(unsigned long)
        case _C_LNG_LNG:
          PRIMITIVE_CASE(long long)
        case _C_ULNG_LNG:
          PRIMITIVE_CASE(unsigned long long)
        case _C_FLT:
          PRIMITIVE_CASE(float)
        case _C_DBL:
          PRIMITIVE_CASE(double)
        case _C_BOOL:
          PRIMITIVE_CASE(BOOL)
        case _C_SEL:
          NULLABLE_PRIMITIVE_CASE(SEL)
        case _C_CHARPTR:
          NULLABLE_PRIMITIVE_CASE(const char *)
        case _C_PTR:
          NULLABLE_PRIMITIVE_CASE(void *)

        case _C_ID: {
          isNullableType = YES;
          id (*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;
          ABI47_0_0RCT_RETAINED_ARG_BLOCK(id value = convert([ABI47_0_0RCTConvert class], selector, json););
          break;
        }

        case _C_STRUCT_B: {
          NSMethodSignature *typeSignature = [ABI47_0_0RCTConvert methodSignatureForSelector:selector];
          NSInvocation *typeInvocation = [NSInvocation invocationWithMethodSignature:typeSignature];
          typeInvocation.selector = selector;
          typeInvocation.target = [ABI47_0_0RCTConvert class];

          [argumentBlocks addObject:^(__unused ABI47_0_0RCTBridge *bridge, NSUInteger index, id json) {
            void *returnValue = malloc(typeSignature.methodReturnLength);
            if (!returnValue) {
              // CWE - 391 : Unchecked error condition
              // https://www.cvedetails.com/cwe-details/391/Unchecked-Error-Condition.html
              // https://eli.thegreenplace.net/2009/10/30/handling-out-of-memory-conditions-in-c
              abort();
            }
            [typeInvocation setArgument:&json atIndex:2];
            [typeInvocation invoke];
            [typeInvocation getReturnValue:returnValue];
            [invocation setArgument:returnValue atIndex:index + 2];
            free(returnValue);
            return YES;
          }];
          break;
        }

        default: {
          static const char *blockType = @encode(__typeof__(^{
          }));
          if (!strcmp(objcType, blockType)) {
            BLOCK_CASE((NSArray * args), { [bridge enqueueCallback:json args:args]; });
          } else {
            ABI47_0_0RCTLogError(@"Unsupported argument type '%@' in method %@.", typeName, [self methodName]);
          }
        }
      }
    } else if ([typeName isEqualToString:@"ABI47_0_0RCTResponseSenderBlock"]) {
      BLOCK_CASE((NSArray * args), { [bridge enqueueCallback:json args:args]; });
    } else if ([typeName isEqualToString:@"ABI47_0_0RCTResponseErrorBlock"]) {
      BLOCK_CASE((NSError * error), { [bridge enqueueCallback:json args:@[ ABI47_0_0RCTJSErrorFromNSError(error) ]]; });
    } else if ([typeName isEqualToString:@"ABI47_0_0RCTPromiseResolveBlock"]) {
      ABI47_0_0RCTAssert(
          i == numberOfArguments - 2,
          @"The ABI47_0_0RCTPromiseResolveBlock must be the second to last parameter in %@",
          [self methodName]);
      BLOCK_CASE((id result), { [bridge enqueueCallback:json args:result ? @[ result ] : @[]]; });
    } else if ([typeName isEqualToString:@"ABI47_0_0RCTPromiseRejectBlock"]) {
      ABI47_0_0RCTAssert(
          i == numberOfArguments - 1, @"The ABI47_0_0RCTPromiseRejectBlock must be the last parameter in %@", [self methodName]);
      BLOCK_CASE((NSString * code, NSString * message, NSError * error), {
        NSDictionary *errorJSON = ABI47_0_0RCTJSErrorFromCodeMessageAndNSError(code, message, error);
        [bridge enqueueCallback:json args:@[ errorJSON ]];
      });
    } else if ([typeName hasPrefix:@"ABI47_0_0JS::"]) {
      NSString *selectorNameForCxxType =
          [[typeName stringByReplacingOccurrencesOfString:@"::" withString:@"_"] stringByAppendingString:@":"];
      selector = NSSelectorFromString(selectorNameForCxxType);

      [argumentBlocks addObject:^(__unused ABI47_0_0RCTBridge *bridge, NSUInteger index, id json) {
        ABI47_0_0RCTManagedPointer *(*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;
        ABI47_0_0RCTManagedPointer *box = convert([ABI47_0_0RCTCxxConvert class], selector, json);

        void *pointer = box.voidPointer;
        [invocation setArgument:&pointer atIndex:index + 2];
        [retainedObjects addObject:box];

        return YES;
      }];
    } else {
      // Unknown argument type
      ABI47_0_0RCTLogError(
          @"Unknown argument type '%@' in method %@. Extend ABI47_0_0RCTConvert to support this type.",
          typeName,
          [self methodName]);
    }

#if ABI47_0_0RCT_DEBUG
    ABI47_0_0RCTNullability nullability = argument.nullability;
    if (!isNullableType) {
      if (nullability == ABI47_0_0RCTNullable) {
        ABI47_0_0RCTLogArgumentError(
            weakSelf,
            i - 2,
            typeName,
            "is marked as "
            "nullable, but is not a nullable type.");
      }
      nullability = ABI47_0_0RCTNonnullable;
    }

    /**
     * Special case - Numbers are not nullable in Android, so we
     * don't support this for now. In future we may allow it.
     */
    if ([typeName isEqualToString:@"NSNumber"]) {
      BOOL unspecified = (nullability == ABI47_0_0RCTNullabilityUnspecified);
      if (!argument.unused && (nullability == ABI47_0_0RCTNullable || unspecified)) {
        ABI47_0_0RCTLogArgumentError(
            weakSelf,
            i - 2,
            typeName,
            [unspecified ? @"has unspecified nullability" : @"is marked as nullable"
                stringByAppendingString:@" but ABI47_0_0React requires that all NSNumber "
                                         "arguments are explicitly marked as `nonnull` to ensure "
                                         "compatibility with Android."]
                .UTF8String);
      }
      nullability = ABI47_0_0RCTNonnullable;
    }

    if (nullability == ABI47_0_0RCTNonnullable) {
      ABI47_0_0RCTArgumentBlock oldBlock = argumentBlocks[i - 2];
      argumentBlocks[i - 2] = ^(ABI47_0_0RCTBridge *bridge, NSUInteger index, id json) {
        if (json != nil) {
          if (!oldBlock(bridge, index, json)) {
            return NO;
          }
          if (isNullableType) {
            // Check converted value wasn't null either, as method probably
            // won't gracefully handle a nil value for a nonull argument
            void *value;
            [invocation getArgument:&value atIndex:index + 2];
            if (value == NULL) {
              return NO;
            }
          }
          return YES;
        }
        ABI47_0_0RCTLogArgumentError(weakSelf, index, typeName, "must not be null");
        return NO;
      };
    }
#endif
  }

#if ABI47_0_0RCT_DEBUG
  const char *objcType = _invocation.methodSignature.methodReturnType;
  if (_methodInfo->isSync && objcType[0] != _C_ID) {
    ABI47_0_0RCTLogError(
        @"Return type of %@.%s should be (id) as the method is \"sync\"",
        ABI47_0_0RCTBridgeModuleNameForClass(_moduleClass),
        self.JSMethodName);
  }
#endif

  _argumentBlocks = argumentBlocks;
}

- (SEL)selector
{
  if (_selector == NULL) {
    ABI47_0_0RCT_PROFILE_BEGIN_EVENT(
        ABI47_0_0RCTProfileTagAlways,
        @"",
        (@{@"module" : NSStringFromClass(_moduleClass), @"method" : @(_methodInfo->objcName)}));
    [self processMethodSignature];
    ABI47_0_0RCT_PROFILE_END_EVENT(ABI47_0_0RCTProfileTagAlways, @"");
  }
  return _selector;
}

- (const char *)JSMethodName
{
  NSString *methodName = _JSMethodName;
  if (!methodName) {
    const char *jsName = _methodInfo->jsName;
    if (jsName && strlen(jsName) > 0) {
      methodName = @(jsName);
    } else {
      methodName = @(_methodInfo->objcName);
      NSRange colonRange = [methodName rangeOfString:@":"];
      if (colonRange.location != NSNotFound) {
        methodName = [methodName substringToIndex:colonRange.location];
      }
      methodName = [methodName stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
      ABI47_0_0RCTAssert(
          methodName.length,
          @"%s is not a valid JS function name, please"
           " supply an alternative using ABI47_0_0RCT_REMAP_METHOD()",
          _methodInfo->objcName);
    }
    _JSMethodName = methodName;
  }
  return methodName.UTF8String;
}

- (ABI47_0_0RCTFunctionType)functionType
{
  if (strstr(_methodInfo->objcName, "ABI47_0_0RCTPromise") != NULL) {
    ABI47_0_0RCTAssert(!_methodInfo->isSync, @"Promises cannot be used in sync functions");
    return ABI47_0_0RCTFunctionTypePromise;
  } else if (_methodInfo->isSync) {
    return ABI47_0_0RCTFunctionTypeSync;
  } else {
    return ABI47_0_0RCTFunctionTypeNormal;
  }
}

- (id)invokeWithBridge:(ABI47_0_0RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments
{
  if (_argumentBlocks == nil) {
    [self processMethodSignature];
  }

#if ABI47_0_0RCT_DEBUG
  // Sanity check
  ABI47_0_0RCTAssert([module class] == _moduleClass, @"Attempted to invoke method \
            %@ on a module of class %@", [self methodName], [module class]);

  // Safety check
  if (arguments.count != _argumentBlocks.count) {
    NSInteger actualCount = arguments.count;
    NSInteger expectedCount = _argumentBlocks.count;

    // Subtract the implicit Promise resolver and rejecter functions for implementations of async functions
    if (self.functionType == ABI47_0_0RCTFunctionTypePromise) {
      actualCount -= 2;
      expectedCount -= 2;
    }

    ABI47_0_0RCTLogError(
        @"%@.%s was called with %lld arguments but expects %lld arguments. "
        @"If you haven\'t changed this method yourself, this usually means that "
        @"your versions of the native code and JavaScript code are out of sync. "
        @"Updating both should make this error go away.",
        ABI47_0_0RCTBridgeModuleNameForClass(_moduleClass),
        self.JSMethodName,
        (long long)actualCount,
        (long long)expectedCount);
    return nil;
  }
#endif

  // Set arguments
  NSUInteger index = 0;
  for (id json in arguments) {
    ABI47_0_0RCTArgumentBlock block = _argumentBlocks[index];
    if (!block(bridge, index, ABI47_0_0RCTNilIfNull(json))) {
      // Invalid argument, abort
      ABI47_0_0RCTLogArgumentError(self, index, json, "could not be processed. Aborting method call.");
      return nil;
    }
    index++;
  }

  // Invoke method
#ifdef ABI47_0_0RCT_MAIN_THREAD_WATCH_DOG_THRESHOLD
  if (ABI47_0_0RCTIsMainQueue()) {
    CFTimeInterval start = CACurrentMediaTime();
    [_invocation invokeWithTarget:module];
    CFTimeInterval duration = CACurrentMediaTime() - start;
    if (duration > ABI47_0_0RCT_MAIN_THREAD_WATCH_DOG_THRESHOLD) {
      ABI47_0_0RCTLogWarn(
          @"Main Thread Watchdog: Invocation of %@ blocked the main thread for %dms. "
           "Consider using background-threaded modules and asynchronous calls "
           "to spend less time on the main thread and keep the app's UI responsive.",
          [self methodName],
          (int)(duration * 1000));
    }
  } else {
    [_invocation invokeWithTarget:module];
  }
#else
  [_invocation invokeWithTarget:module];
#endif

  [_retainedObjects removeAllObjects];

  if (_methodInfo->isSync) {
    void *returnValue;
    [_invocation getReturnValue:&returnValue];
    return (__bridge id)returnValue;
  }
  return nil;
}

- (NSString *)methodName
{
  if (!_selector) {
    [self processMethodSignature];
  }
  return [NSString stringWithFormat:@"-[%@ %s]", _moduleClass, sel_getName(_selector)];
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; exports %@ as %s(); type: %s>",
                                    [self class],
                                    self,
                                    [self methodName],
                                    self.JSMethodName,
                                    ABI47_0_0RCTFunctionDescriptorFromType(self.functionType)];
}

@end
