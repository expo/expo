/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTModuleMethod.h"

#import <objc/message.h>

#import "ABI18_0_0RCTAssert.h"
#import "ABI18_0_0RCTBridge+Private.h"
#import "ABI18_0_0RCTBridge.h"
#import "ABI18_0_0RCTConvert.h"
#import "ABI18_0_0RCTLog.h"
#import "ABI18_0_0RCTParserUtils.h"
#import "ABI18_0_0RCTProfile.h"
#import "ABI18_0_0RCTUtils.h"

typedef BOOL (^ABI18_0_0RCTArgumentBlock)(ABI18_0_0RCTBridge *, NSUInteger, id);

@implementation ABI18_0_0RCTMethodArgument

- (instancetype)initWithType:(NSString *)type
                 nullability:(ABI18_0_0RCTNullability)nullability
                      unused:(BOOL)unused
{
  if (self = [super init]) {
    _type = [type copy];
    _nullability = nullability;
    _unused = unused;
  }
  return self;
}

@end

@implementation ABI18_0_0RCTModuleMethod
{
  Class _moduleClass;
  NSInvocation *_invocation;
  NSArray<ABI18_0_0RCTArgumentBlock> *_argumentBlocks;
  NSString *_methodSignature;
  SEL _selector;
  BOOL _isSync;
}

@synthesize JSMethodName = _JSMethodName;

static void ABI18_0_0RCTLogArgumentError(ABI18_0_0RCTModuleMethod *method, NSUInteger index,
                                id valueOrType, const char *issue)
{
  ABI18_0_0RCTLogError(@"Argument %tu (%@) of %@.%@ %s", index, valueOrType,
              ABI18_0_0RCTBridgeModuleNameForClass(method->_moduleClass),
              method->_JSMethodName, issue);
}

ABI18_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

// returns YES if the selector ends in a colon (indicating that there is at
// least one argument, and maybe more selector parts) or NO if it doesn't.
static BOOL ABI18_0_0RCTParseSelectorPart(const char **input, NSMutableString *selector)
{
  NSString *selectorPart;
  if (ABI18_0_0RCTParseIdentifier(input, &selectorPart)) {
    [selector appendString:selectorPart];
  }
  ABI18_0_0RCTSkipWhitespace(input);
  if (ABI18_0_0RCTReadChar(input, ':')) {
    [selector appendString:@":"];
    ABI18_0_0RCTSkipWhitespace(input);
    return YES;
  }
  return NO;
}

static BOOL ABI18_0_0RCTParseUnused(const char **input)
{
  return ABI18_0_0RCTReadString(input, "__unused") ||
         ABI18_0_0RCTReadString(input, "__attribute__((unused))");
}

static ABI18_0_0RCTNullability ABI18_0_0RCTParseNullability(const char **input)
{
  if (ABI18_0_0RCTReadString(input, "nullable")) {
    return ABI18_0_0RCTNullable;
  } else if (ABI18_0_0RCTReadString(input, "nonnull")) {
    return ABI18_0_0RCTNonnullable;
  }
  return ABI18_0_0RCTNullabilityUnspecified;
}

static ABI18_0_0RCTNullability ABI18_0_0RCTParseNullabilityPostfix(const char **input)
{
  if (ABI18_0_0RCTReadString(input, "_Nullable")) {
    return ABI18_0_0RCTNullable;
  } else if (ABI18_0_0RCTReadString(input, "_Nonnull")) {
    return ABI18_0_0RCTNonnullable;
  }
  return ABI18_0_0RCTNullabilityUnspecified;
}

// returns YES if execution is safe to proceed (enqueue callback invocation), NO if callback has already been invoked
static BOOL ABI18_0_0RCTCheckCallbackMultipleInvocations(BOOL *didInvoke) {
  if (*didInvoke) {
      ABI18_0_0RCTFatal(ABI18_0_0RCTErrorWithMessage(@"Illegal callback invocation from native module. This callback type only permits a single invocation from native code."));
      return NO;
  } else {
      *didInvoke = YES;
      return YES;
  }
}

SEL ABI18_0_0RCTParseMethodSignature(NSString *, NSArray<ABI18_0_0RCTMethodArgument *> **);
SEL ABI18_0_0RCTParseMethodSignature(NSString *methodSignature, NSArray<ABI18_0_0RCTMethodArgument *> **arguments)
{
  const char *input = methodSignature.UTF8String;
  ABI18_0_0RCTSkipWhitespace(&input);

  NSMutableArray *args;
  NSMutableString *selector = [NSMutableString new];
  while (ABI18_0_0RCTParseSelectorPart(&input, selector)) {
    if (!args) {
      args = [NSMutableArray new];
    }

    // Parse type
    if (ABI18_0_0RCTReadChar(&input, '(')) {
      ABI18_0_0RCTSkipWhitespace(&input);

      BOOL unused = ABI18_0_0RCTParseUnused(&input);
      ABI18_0_0RCTSkipWhitespace(&input);

      ABI18_0_0RCTNullability nullability = ABI18_0_0RCTParseNullability(&input);
      ABI18_0_0RCTSkipWhitespace(&input);

      NSString *type = ABI18_0_0RCTParseType(&input);
      ABI18_0_0RCTSkipWhitespace(&input);
      if (nullability == ABI18_0_0RCTNullabilityUnspecified) {
        nullability = ABI18_0_0RCTParseNullabilityPostfix(&input);
      }
      [args addObject:[[ABI18_0_0RCTMethodArgument alloc] initWithType:type
                                                  nullability:nullability
                                                       unused:unused]];
      ABI18_0_0RCTSkipWhitespace(&input);
      ABI18_0_0RCTReadChar(&input, ')');
      ABI18_0_0RCTSkipWhitespace(&input);
    } else {
      // Type defaults to id if unspecified
      [args addObject:[[ABI18_0_0RCTMethodArgument alloc] initWithType:@"id"
                                                  nullability:ABI18_0_0RCTNullable
                                                       unused:NO]];
    }

    // Argument name
    ABI18_0_0RCTParseIdentifier(&input, NULL);
    ABI18_0_0RCTSkipWhitespace(&input);
  }

  *arguments = [args copy];
  return NSSelectorFromString(selector);
}

- (instancetype)initWithMethodSignature:(NSString *)methodSignature
                           JSMethodName:(NSString *)JSMethodName
                                 isSync:(BOOL)isSync
                            moduleClass:(Class)moduleClass
{
  if (self = [super init]) {
    _moduleClass = moduleClass;
    _methodSignature = [methodSignature copy];
    _JSMethodName = [JSMethodName copy];
    _isSync = isSync;
  }

  return self;
}

- (void)processMethodSignature
{
  NSArray<ABI18_0_0RCTMethodArgument *> *arguments;
  _selector = ABI18_0_0RCTParseMethodSignature(_methodSignature, &arguments);
  ABI18_0_0RCTAssert(_selector, @"%@ is not a valid selector", _methodSignature);

  // Create method invocation
  NSMethodSignature *methodSignature = [_moduleClass instanceMethodSignatureForSelector:_selector];
  ABI18_0_0RCTAssert(methodSignature, @"%@ is not a recognized Objective-C method.", _methodSignature);
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
  invocation.selector = _selector;
  _invocation = invocation;

  // Process arguments
  NSUInteger numberOfArguments = methodSignature.numberOfArguments;
  NSMutableArray<ABI18_0_0RCTArgumentBlock> *argumentBlocks =
    [[NSMutableArray alloc] initWithCapacity:numberOfArguments - 2];

#define ABI18_0_0RCT_ARG_BLOCK(_logic) \
[argumentBlocks addObject:^(__unused ABI18_0_0RCTBridge *bridge, NSUInteger index, id json) { \
  _logic \
  [invocation setArgument:&value atIndex:(index) + 2]; \
  return YES; \
}];

/**
 * Explicitly copy the block and retain it, since NSInvocation doesn't retain them.
 */
#define ABI18_0_0RCT_BLOCK_ARGUMENT(block...) \
  id value = json ? [block copy] : (id)^(__unused NSArray *_){}; \
  CFBridgingRetain(value)

  __weak ABI18_0_0RCTModuleMethod *weakSelf = self;
  void (^addBlockArgument)(void) = ^{
    ABI18_0_0RCT_ARG_BLOCK(
      if (ABI18_0_0RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
        ABI18_0_0RCTLogArgumentError(weakSelf, index, json, "should be a function");
        return NO;
      }

      __block BOOL didInvoke = NO;
      ABI18_0_0RCT_BLOCK_ARGUMENT(^(NSArray *args) {
        if (ABI18_0_0RCTCheckCallbackMultipleInvocations(&didInvoke)) {
          [bridge enqueueCallback:json args:args];
        }
      });
    )
  };

  for (NSUInteger i = 2; i < numberOfArguments; i++) {
    const char *objcType = [methodSignature getArgumentTypeAtIndex:i];
    BOOL isNullableType = NO;
    ABI18_0_0RCTMethodArgument *argument = arguments[i - 2];
    NSString *typeName = argument.type;
    SEL selector = ABI18_0_0RCTConvertSelectorForType(typeName);
    if ([ABI18_0_0RCTConvert respondsToSelector:selector]) {
      switch (objcType[0]) {

#define ABI18_0_0RCT_CASE(_value, _type) \
        case _value: { \
          _type (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend; \
          ABI18_0_0RCT_ARG_BLOCK( _type value = convert([ABI18_0_0RCTConvert class], selector, json); ) \
          break; \
        }

        ABI18_0_0RCT_CASE(_C_CHR, char)
        ABI18_0_0RCT_CASE(_C_UCHR, unsigned char)
        ABI18_0_0RCT_CASE(_C_SHT, short)
        ABI18_0_0RCT_CASE(_C_USHT, unsigned short)
        ABI18_0_0RCT_CASE(_C_INT, int)
        ABI18_0_0RCT_CASE(_C_UINT, unsigned int)
        ABI18_0_0RCT_CASE(_C_LNG, long)
        ABI18_0_0RCT_CASE(_C_ULNG, unsigned long)
        ABI18_0_0RCT_CASE(_C_LNG_LNG, long long)
        ABI18_0_0RCT_CASE(_C_ULNG_LNG, unsigned long long)
        ABI18_0_0RCT_CASE(_C_FLT, float)
        ABI18_0_0RCT_CASE(_C_DBL, double)
        ABI18_0_0RCT_CASE(_C_BOOL, BOOL)

#define ABI18_0_0RCT_NULLABLE_CASE(_value, _type) \
        case _value: { \
          isNullableType = YES; \
          _type (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend; \
          ABI18_0_0RCT_ARG_BLOCK( _type value = convert([ABI18_0_0RCTConvert class], selector, json); ) \
          break; \
        }

        ABI18_0_0RCT_NULLABLE_CASE(_C_SEL, SEL)
        ABI18_0_0RCT_NULLABLE_CASE(_C_CHARPTR, const char *)
        ABI18_0_0RCT_NULLABLE_CASE(_C_PTR, void *)

        case _C_ID: {
          isNullableType = YES;
          id (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend;
          ABI18_0_0RCT_ARG_BLOCK(
            id value = convert([ABI18_0_0RCTConvert class], selector, json);
            CFBridgingRetain(value);
          )
          break;
        }

        case _C_STRUCT_B: {

          NSMethodSignature *typeSignature = [ABI18_0_0RCTConvert methodSignatureForSelector:selector];
          NSInvocation *typeInvocation = [NSInvocation invocationWithMethodSignature:typeSignature];
          typeInvocation.selector = selector;
          typeInvocation.target = [ABI18_0_0RCTConvert class];

          [argumentBlocks addObject:^(__unused ABI18_0_0RCTBridge *bridge, NSUInteger index, id json) {
            void *returnValue = malloc(typeSignature.methodReturnLength);
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
          static const char *blockType = @encode(typeof(^{}));
          if (!strcmp(objcType, blockType)) {
            addBlockArgument();
          } else {
            ABI18_0_0RCTLogError(@"Unsupported argument type '%@' in method %@.",
                        typeName, [self methodName]);
          }
        }
      }
    } else if ([typeName isEqualToString:@"ABI18_0_0RCTResponseSenderBlock"]) {
      addBlockArgument();
    } else if ([typeName isEqualToString:@"ABI18_0_0RCTResponseErrorBlock"]) {
      ABI18_0_0RCT_ARG_BLOCK(

        if (ABI18_0_0RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
          ABI18_0_0RCTLogArgumentError(weakSelf, index, json, "should be a function");
          return NO;
        }

        __block BOOL didInvoke = NO;
        ABI18_0_0RCT_BLOCK_ARGUMENT(^(NSError *error) {
          if (ABI18_0_0RCTCheckCallbackMultipleInvocations(&didInvoke)) {
            [bridge enqueueCallback:json args:@[ABI18_0_0RCTJSErrorFromNSError(error)]];
          }
        });
      )
    } else if ([typeName isEqualToString:@"ABI18_0_0RCTPromiseResolveBlock"]) {
      ABI18_0_0RCTAssert(i == numberOfArguments - 2,
                @"The ABI18_0_0RCTPromiseResolveBlock must be the second to last parameter in -[%@ %@]",
                _moduleClass, _methodSignature);
      ABI18_0_0RCT_ARG_BLOCK(
        if (ABI18_0_0RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
          ABI18_0_0RCTLogArgumentError(weakSelf, index, json, "should be a promise resolver function");
          return NO;
        }

        __block BOOL didInvoke = NO;
        ABI18_0_0RCT_BLOCK_ARGUMENT(^(id result) {
          if (ABI18_0_0RCTCheckCallbackMultipleInvocations(&didInvoke)) {
            [bridge enqueueCallback:json args:result ? @[result] : @[]];
          }
        });
      )
    } else if ([typeName isEqualToString:@"ABI18_0_0RCTPromiseRejectBlock"]) {
      ABI18_0_0RCTAssert(i == numberOfArguments - 1,
                @"The ABI18_0_0RCTPromiseRejectBlock must be the last parameter in -[%@ %@]",
                _moduleClass, _methodSignature);
      ABI18_0_0RCT_ARG_BLOCK(
        if (ABI18_0_0RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
          ABI18_0_0RCTLogArgumentError(weakSelf, index, json, "should be a promise rejecter function");
          return NO;
        }

        __block BOOL didInvoke = NO;
        ABI18_0_0RCT_BLOCK_ARGUMENT(^(NSString *code, NSString *message, NSError *error) {
          if (ABI18_0_0RCTCheckCallbackMultipleInvocations(&didInvoke)) {
            NSDictionary *errorJSON = ABI18_0_0RCTJSErrorFromCodeMessageAndNSError(code, message, error);
            [bridge enqueueCallback:json args:@[errorJSON]];
          }
        });
      )
    } else {

      // Unknown argument type
      ABI18_0_0RCTLogError(@"Unknown argument type '%@' in method %@. Extend ABI18_0_0RCTConvert"
                  " to support this type.", typeName, [self methodName]);
    }

    if (ABI18_0_0RCT_DEBUG) {

      ABI18_0_0RCTNullability nullability = argument.nullability;
      if (!isNullableType) {
        if (nullability == ABI18_0_0RCTNullable) {
          ABI18_0_0RCTLogArgumentError(weakSelf, i - 2, typeName, "is marked as "
                              "nullable, but is not a nullable type.");
        }
        nullability = ABI18_0_0RCTNonnullable;
      }

      /**
       * Special case - Numbers are not nullable in Android, so we
       * don't support this for now. In future we may allow it.
       */
      if ([typeName isEqualToString:@"NSNumber"]) {
        BOOL unspecified = (nullability == ABI18_0_0RCTNullabilityUnspecified);
        if (!argument.unused && (nullability == ABI18_0_0RCTNullable || unspecified)) {
          ABI18_0_0RCTLogArgumentError(weakSelf, i - 2, typeName,
            [unspecified ? @"has unspecified nullability" : @"is marked as nullable"
             stringByAppendingString: @" but ReactABI18_0_0 requires that all NSNumber "
             "arguments are explicitly marked as `nonnull` to ensure "
             "compatibility with Android."].UTF8String);
        }
        nullability = ABI18_0_0RCTNonnullable;
      }

      if (nullability == ABI18_0_0RCTNonnullable) {
        ABI18_0_0RCTArgumentBlock oldBlock = argumentBlocks[i - 2];
        argumentBlocks[i - 2] = ^(ABI18_0_0RCTBridge *bridge, NSUInteger index, id json) {
          if (json != nil) {
            if (!oldBlock(bridge, index, json)) {
              return NO;
            }
            if (isNullableType) {
              // Check converted value wasn't null either, as method probably
              // won't gracefully handle a nil vallue for a nonull argument
              void *value;
              [invocation getArgument:&value atIndex:index + 2];
              if (value == NULL) {
                return NO;
              }
            }
            return YES;
          }
          ABI18_0_0RCTLogArgumentError(weakSelf, index, typeName, "must not be null");
          return NO;
        };
      }
    }
  }

  if (ABI18_0_0RCT_DEBUG) {
    const char *objcType = _invocation.methodSignature.methodReturnType;
    if (_isSync && objcType[0] != _C_ID)
      ABI18_0_0RCTLogError(@"Return type of %@.%@ should be (id) as the method is \"sync\"",
                  ABI18_0_0RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName);
  }

  _argumentBlocks = [argumentBlocks copy];
}

- (SEL)selector
{
  if (_selector == NULL) {
    ABI18_0_0RCT_PROFILE_BEGIN_EVENT(ABI18_0_0RCTProfileTagAlways, @"", (@{ @"module": NSStringFromClass(_moduleClass),
                                                          @"method": _methodSignature }));
    [self processMethodSignature];
    ABI18_0_0RCT_PROFILE_END_EVENT(ABI18_0_0RCTProfileTagAlways, @"");
  }
  return _selector;
}

- (NSString *)JSMethodName
{
  NSString *methodName = _JSMethodName;
  if (methodName.length == 0) {
    methodName = _methodSignature;
    NSRange colonRange = [methodName rangeOfString:@":"];
    if (colonRange.location != NSNotFound) {
      methodName = [methodName substringToIndex:colonRange.location];
    }
    methodName = [methodName stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    ABI18_0_0RCTAssert(methodName.length, @"%@ is not a valid JS function name, please"
              " supply an alternative using ABI18_0_0RCT_REMAP_METHOD()", _methodSignature);
  }
  return methodName;
}

- (ABI18_0_0RCTFunctionType)functionType
{
  if ([_methodSignature rangeOfString:@"ABI18_0_0RCTPromise"].length) {
    ABI18_0_0RCTAssert(!_isSync, @"Promises cannot be used in sync functions");

    return ABI18_0_0RCTFunctionTypePromise;
  } else if (_isSync) {
    return ABI18_0_0RCTFunctionTypeSync;
  } else {
    return ABI18_0_0RCTFunctionTypeNormal;
  }
}

- (id)invokeWithBridge:(ABI18_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments
{
  if (_argumentBlocks == nil) {
    [self processMethodSignature];
  }

  if (ABI18_0_0RCT_DEBUG) {
    // Sanity check
    ABI18_0_0RCTAssert([module class] == _moduleClass, @"Attempted to invoke method \
              %@ on a module of class %@", [self methodName], [module class]);

    // Safety check
    if (arguments.count != _argumentBlocks.count) {
      NSInteger actualCount = arguments.count;
      NSInteger expectedCount = _argumentBlocks.count;

      // Subtract the implicit Promise resolver and rejecter functions for implementations of async functions
      if (self.functionType == ABI18_0_0RCTFunctionTypePromise) {
        actualCount -= 2;
        expectedCount -= 2;
      }

      ABI18_0_0RCTLogError(@"%@.%@ was called with %zd arguments but expects %zd arguments. "
                  @"If you haven\'t changed this method yourself, this usually means that "
                  @"your versions of the native code and JavaScript code are out of sync. "
                  @"Updating both should make this error go away.",
                  ABI18_0_0RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName,
                  actualCount, expectedCount);
      return nil;
    }
  }

  // Set arguments
  NSUInteger index = 0;
  for (id json in arguments) {
    ABI18_0_0RCTArgumentBlock block = _argumentBlocks[index];
    if (!block(bridge, index, ABI18_0_0RCTNilIfNull(json))) {
      // Invalid argument, abort
      ABI18_0_0RCTLogArgumentError(self, index, json,
                          "could not be processed. Aborting method call.");
      return nil;
    }
    index++;
  }

  // Invoke method
  [_invocation invokeWithTarget:module];

  ABI18_0_0RCTAssert(
    @encode(ABI18_0_0RCTArgumentBlock)[0] == _C_ID,
    @"Block type encoding has changed, it won't be released. A check for the block"
     "type encoding (%s) has to be added below.",
    @encode(ABI18_0_0RCTArgumentBlock)
  );

  index = 2;
  for (NSUInteger length = _invocation.methodSignature.numberOfArguments; index < length; index++) {
    if ([_invocation.methodSignature getArgumentTypeAtIndex:index][0] == _C_ID) {
      __unsafe_unretained id value;
      [_invocation getArgument:&value atIndex:index];

      if (value) {
        CFRelease((__bridge CFTypeRef)value);
      }
    }
  }

  id result = nil;
  if (_isSync) {
    void *pointer;
    [_invocation getReturnValue:&pointer];
    result = (__bridge id)pointer;
  }

  return result;
}

- (NSString *)methodName
{
  if (_selector == NULL) {
    [self processMethodSignature];
  }
  return [NSString stringWithFormat:@"-[%@ %@]", _moduleClass,
          NSStringFromSelector(_selector)];
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; exports %@ as %@(); type: %s>",
          [self class], self, [self methodName], self.JSMethodName, ABI18_0_0RCTFunctionDescriptorFromType(self.functionType)];
}

@end
