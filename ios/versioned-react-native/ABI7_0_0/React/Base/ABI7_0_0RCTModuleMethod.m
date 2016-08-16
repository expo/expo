/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTModuleMethod.h"

#import <objc/message.h>

#import "ABI7_0_0RCTAssert.h"
#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTBridge+Private.h"
#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTLog.h"
#import "ABI7_0_0RCTParserUtils.h"
#import "ABI7_0_0RCTUtils.h"

typedef BOOL (^ABI7_0_0RCTArgumentBlock)(ABI7_0_0RCTBridge *, NSUInteger, id);

@implementation ABI7_0_0RCTMethodArgument

- (instancetype)initWithType:(NSString *)type
                 nullability:(ABI7_0_0RCTNullability)nullability
                      unused:(BOOL)unused
{
  if ((self = [super init])) {
    _type = [type copy];
    _nullability = nullability;
    _unused = unused;
  }
  return self;
}

@end

@implementation ABI7_0_0RCTModuleMethod
{
  Class _moduleClass;
  NSInvocation *_invocation;
  NSArray<ABI7_0_0RCTArgumentBlock> *_argumentBlocks;
  NSString *_methodSignature;
  SEL _selector;
  NSDictionary *_profileArgs;
}

@synthesize JSMethodName = _JSMethodName;
@synthesize functionType = _functionType;

static void ABI7_0_0RCTLogArgumentError(ABI7_0_0RCTModuleMethod *method, NSUInteger index,
                                id valueOrType, const char *issue)
{
  ABI7_0_0RCTLogError(@"Argument %tu (%@) of %@.%@ %s", index, valueOrType,
              ABI7_0_0RCTBridgeModuleNameForClass(method->_moduleClass),
              method->_JSMethodName, issue);
}

ABI7_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

// returns YES if the selector ends in a colon (indicating that there is at
// least one argument, and maybe more selector parts) or NO if it doesn't.
static BOOL ABI7_0_0RCTParseSelectorPart(const char **input, NSMutableString *selector)
{
  NSString *selectorPart;
  if (ABI7_0_0RCTParseIdentifier(input, &selectorPart)) {
    [selector appendString:selectorPart];
  }
  ABI7_0_0RCTSkipWhitespace(input);
  if (ABI7_0_0RCTReadChar(input, ':')) {
    [selector appendString:@":"];
    ABI7_0_0RCTSkipWhitespace(input);
    return YES;
  }
  return NO;
}

static BOOL ABI7_0_0RCTParseUnused(const char **input)
{
  return ABI7_0_0RCTReadString(input, "__unused") ||
         ABI7_0_0RCTReadString(input, "__attribute__((unused))");
}

static ABI7_0_0RCTNullability ABI7_0_0RCTParseNullability(const char **input)
{
  if (ABI7_0_0RCTReadString(input, "nullable")) {
    return ABI7_0_0RCTNullable;
  } else if (ABI7_0_0RCTReadString(input, "nonnull")) {
    return ABI7_0_0RCTNonnullable;
  }
  return ABI7_0_0RCTNullabilityUnspecified;
}

static ABI7_0_0RCTNullability ABI7_0_0RCTParseNullabilityPostfix(const char **input)
{
  if (ABI7_0_0RCTReadString(input, "_Nullable")) {
    return ABI7_0_0RCTNullable;
  } else if (ABI7_0_0RCTReadString(input, "_Nonnull")) {
    return ABI7_0_0RCTNonnullable;
  }
  return ABI7_0_0RCTNullabilityUnspecified;
}

SEL ABI7_0_0RCTParseMethodSignature(NSString *, NSArray<ABI7_0_0RCTMethodArgument *> **);
SEL ABI7_0_0RCTParseMethodSignature(NSString *methodSignature, NSArray<ABI7_0_0RCTMethodArgument *> **arguments)
{
  const char *input = methodSignature.UTF8String;
  ABI7_0_0RCTSkipWhitespace(&input);

  NSMutableArray *args;
  NSMutableString *selector = [NSMutableString new];
  while (ABI7_0_0RCTParseSelectorPart(&input, selector)) {
    if (!args) {
      args = [NSMutableArray new];
    }

    // Parse type
    if (ABI7_0_0RCTReadChar(&input, '(')) {
      ABI7_0_0RCTSkipWhitespace(&input);

      BOOL unused = ABI7_0_0RCTParseUnused(&input);
      ABI7_0_0RCTSkipWhitespace(&input);

      ABI7_0_0RCTNullability nullability = ABI7_0_0RCTParseNullability(&input);
      ABI7_0_0RCTSkipWhitespace(&input);

      NSString *type = ABI7_0_0RCTParseType(&input);
      ABI7_0_0RCTSkipWhitespace(&input);
      if (nullability == ABI7_0_0RCTNullabilityUnspecified) {
        nullability = ABI7_0_0RCTParseNullabilityPostfix(&input);
      }
      [args addObject:[[ABI7_0_0RCTMethodArgument alloc] initWithType:type
                                                  nullability:nullability
                                                       unused:unused]];
      ABI7_0_0RCTSkipWhitespace(&input);
      ABI7_0_0RCTReadChar(&input, ')');
      ABI7_0_0RCTSkipWhitespace(&input);
    } else {
      // Type defaults to id if unspecified
      [args addObject:[[ABI7_0_0RCTMethodArgument alloc] initWithType:@"id"
                                                  nullability:ABI7_0_0RCTNullable
                                                       unused:NO]];
    }

    // Argument name
    ABI7_0_0RCTParseIdentifier(&input, NULL);
    ABI7_0_0RCTSkipWhitespace(&input);
  }

  *arguments = [args copy];
  return NSSelectorFromString(selector);
}

- (instancetype)initWithMethodSignature:(NSString *)methodSignature
                           JSMethodName:(NSString *)JSMethodName
                            moduleClass:(Class)moduleClass
{
  if ((self = [super init])) {

    _moduleClass = moduleClass;
    _methodSignature = [methodSignature copy];
    _JSMethodName = JSMethodName.length > 0 ? JSMethodName : ({
      NSString *methodName = methodSignature;
      NSRange colonRange = [methodName rangeOfString:@":"];
      if (colonRange.location != NSNotFound) {
        methodName = [methodName substringToIndex:colonRange.location];
      }
      methodName = [methodName stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
      ABI7_0_0RCTAssert(methodName.length, @"%@ is not a valid JS function name, please"
                " supply an alternative using ABI7_0_0RCT_REMAP_METHOD()", methodSignature);
      methodName;
    });

    if ([_methodSignature rangeOfString:@"ABI7_0_0RCTPromise"].length) {
      _functionType = ABI7_0_0RCTFunctionTypePromise;
    } else {
      _functionType = ABI7_0_0RCTFunctionTypeNormal;
    }
  }

  return self;
}

- (void)processMethodSignature
{
  NSArray<ABI7_0_0RCTMethodArgument *> *arguments;
  _selector = ABI7_0_0RCTParseMethodSignature(_methodSignature, &arguments);
  ABI7_0_0RCTAssert(_selector, @"%@ is not a valid selector", _methodSignature);

  // Create method invocation
  NSMethodSignature *methodSignature = [_moduleClass instanceMethodSignatureForSelector:_selector];
  ABI7_0_0RCTAssert(methodSignature, @"%@ is not a recognized Objective-C method.", _methodSignature);
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
  invocation.selector = _selector;
  _invocation = invocation;

  // Process arguments
  NSUInteger numberOfArguments = methodSignature.numberOfArguments;
  NSMutableArray<ABI7_0_0RCTArgumentBlock> *argumentBlocks =
    [[NSMutableArray alloc] initWithCapacity:numberOfArguments - 2];

#define ABI7_0_0RCT_ARG_BLOCK(_logic) \
[argumentBlocks addObject:^(__unused ABI7_0_0RCTBridge *bridge, NSUInteger index, id json) { \
  _logic \
  [invocation setArgument:&value atIndex:(index) + 2]; \
  return YES; \
}];

/**
 * Explicitly copy the block and retain it, since NSInvocation doesn't retain them.
 */
#define ABI7_0_0RCT_BLOCK_ARGUMENT(block...) \
  id value = json ? [block copy] : (id)^(__unused NSArray *_){}; \
  CFBridgingRetain(value)

  __weak ABI7_0_0RCTModuleMethod *weakSelf = self;
  void (^addBlockArgument)(void) = ^{
    ABI7_0_0RCT_ARG_BLOCK(

      if (ABI7_0_0RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
        ABI7_0_0RCTLogArgumentError(weakSelf, index, json, "should be a function");
        return NO;
      }

      ABI7_0_0RCT_BLOCK_ARGUMENT(^(NSArray *args) {
        [bridge enqueueCallback:json args:args];
      });
    )
  };

  for (NSUInteger i = 2; i < numberOfArguments; i++) {
    const char *objcType = [methodSignature getArgumentTypeAtIndex:i];
    BOOL isNullableType = NO;
    ABI7_0_0RCTMethodArgument *argument = arguments[i - 2];
    NSString *typeName = argument.type;
    SEL selector = ABI7_0_0RCTConvertSelectorForType(typeName);
    if ([ABI7_0_0RCTConvert respondsToSelector:selector]) {
      switch (objcType[0]) {

#define ABI7_0_0RCT_CASE(_value, _type) \
        case _value: { \
          _type (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend; \
          ABI7_0_0RCT_ARG_BLOCK( _type value = convert([ABI7_0_0RCTConvert class], selector, json); ) \
          break; \
        }

        ABI7_0_0RCT_CASE(_C_CHR, char)
        ABI7_0_0RCT_CASE(_C_UCHR, unsigned char)
        ABI7_0_0RCT_CASE(_C_SHT, short)
        ABI7_0_0RCT_CASE(_C_USHT, unsigned short)
        ABI7_0_0RCT_CASE(_C_INT, int)
        ABI7_0_0RCT_CASE(_C_UINT, unsigned int)
        ABI7_0_0RCT_CASE(_C_LNG, long)
        ABI7_0_0RCT_CASE(_C_ULNG, unsigned long)
        ABI7_0_0RCT_CASE(_C_LNG_LNG, long long)
        ABI7_0_0RCT_CASE(_C_ULNG_LNG, unsigned long long)
        ABI7_0_0RCT_CASE(_C_FLT, float)
        ABI7_0_0RCT_CASE(_C_DBL, double)
        ABI7_0_0RCT_CASE(_C_BOOL, BOOL)

#define ABI7_0_0RCT_NULLABLE_CASE(_value, _type) \
        case _value: { \
          isNullableType = YES; \
          _type (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend; \
          ABI7_0_0RCT_ARG_BLOCK( _type value = convert([ABI7_0_0RCTConvert class], selector, json); ) \
          break; \
        }

        ABI7_0_0RCT_NULLABLE_CASE(_C_SEL, SEL)
        ABI7_0_0RCT_NULLABLE_CASE(_C_CHARPTR, const char *)
        ABI7_0_0RCT_NULLABLE_CASE(_C_PTR, void *)

        case _C_ID: {
          isNullableType = YES;
          id (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend;
          ABI7_0_0RCT_ARG_BLOCK(
            id value = convert([ABI7_0_0RCTConvert class], selector, json);
            CFBridgingRetain(value);
          )
          break;
        }

        case _C_STRUCT_B: {

          NSMethodSignature *typeSignature = [ABI7_0_0RCTConvert methodSignatureForSelector:selector];
          NSInvocation *typeInvocation = [NSInvocation invocationWithMethodSignature:typeSignature];
          typeInvocation.selector = selector;
          typeInvocation.target = [ABI7_0_0RCTConvert class];

          [argumentBlocks addObject:^(__unused ABI7_0_0RCTBridge *bridge, NSUInteger index, id json) {
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
            ABI7_0_0RCTLogError(@"Unsupported argument type '%@' in method %@.",
                        typeName, [self methodName]);
          }
        }
      }
    } else if ([typeName isEqualToString:@"ABI7_0_0RCTResponseSenderBlock"]) {
      addBlockArgument();
    } else if ([typeName isEqualToString:@"ABI7_0_0RCTResponseErrorBlock"]) {
      ABI7_0_0RCT_ARG_BLOCK(

        if (ABI7_0_0RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
          ABI7_0_0RCTLogArgumentError(weakSelf, index, json, "should be a function");
          return NO;
        }

        ABI7_0_0RCT_BLOCK_ARGUMENT(^(NSError *error) {
          [bridge enqueueCallback:json args:@[ABI7_0_0RCTJSErrorFromNSError(error)]];
        });
      )
    } else if ([typeName isEqualToString:@"ABI7_0_0RCTPromiseResolveBlock"]) {
      ABI7_0_0RCTAssert(i == numberOfArguments - 2,
                @"The ABI7_0_0RCTPromiseResolveBlock must be the second to last parameter in -[%@ %@]",
                _moduleClass, _methodSignature);
      ABI7_0_0RCT_ARG_BLOCK(
        if (ABI7_0_0RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
          ABI7_0_0RCTLogArgumentError(weakSelf, index, json, "should be a promise resolver function");
          return NO;
        }

        ABI7_0_0RCT_BLOCK_ARGUMENT(^(id result) {
          [bridge enqueueCallback:json args:result ? @[result] : @[]];
        });
      )
    } else if ([typeName isEqualToString:@"ABI7_0_0RCTPromiseRejectBlock"]) {
      ABI7_0_0RCTAssert(i == numberOfArguments - 1,
                @"The ABI7_0_0RCTPromiseRejectBlock must be the last parameter in -[%@ %@]",
                _moduleClass, _methodSignature);
      ABI7_0_0RCT_ARG_BLOCK(
        if (ABI7_0_0RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
          ABI7_0_0RCTLogArgumentError(weakSelf, index, json, "should be a promise rejecter function");
          return NO;
        }

        ABI7_0_0RCT_BLOCK_ARGUMENT(^(NSString *code, NSString *message, NSError *error) {
          NSDictionary *errorJSON = ABI7_0_0RCTJSErrorFromCodeMessageAndNSError(code, message, error);
          [bridge enqueueCallback:json args:@[errorJSON]];
        });
      )
    } else {

      // Unknown argument type
      ABI7_0_0RCTLogError(@"Unknown argument type '%@' in method %@. Extend ABI7_0_0RCTConvert"
                  " to support this type.", typeName, [self methodName]);
    }

    if (ABI7_0_0RCT_DEBUG) {

      ABI7_0_0RCTNullability nullability = argument.nullability;
      if (!isNullableType) {
        if (nullability == ABI7_0_0RCTNullable) {
          ABI7_0_0RCTLogArgumentError(weakSelf, i - 2, typeName, "is marked as "
                              "nullable, but is not a nullable type.");
        }
        nullability = ABI7_0_0RCTNonnullable;
      }

      /**
       * Special case - Numbers are not nullable in Android, so we
       * don't support this for now. In future we may allow it.
       */
      if ([typeName isEqualToString:@"NSNumber"]) {
        BOOL unspecified = (nullability == ABI7_0_0RCTNullabilityUnspecified);
        if (!argument.unused && (nullability == ABI7_0_0RCTNullable || unspecified)) {
          ABI7_0_0RCTLogArgumentError(weakSelf, i - 2, typeName,
            [unspecified ? @"has unspecified nullability" : @"is marked as nullable"
             stringByAppendingString: @" but ReactABI7_0_0 requires that all NSNumber "
             "arguments are explicitly marked as `nonnull` to ensure "
             "compatibility with Android."].UTF8String);
        }
        nullability = ABI7_0_0RCTNonnullable;
      }

      if (nullability == ABI7_0_0RCTNonnullable) {
        ABI7_0_0RCTArgumentBlock oldBlock = argumentBlocks[i - 2];
        argumentBlocks[i - 2] = ^(ABI7_0_0RCTBridge *bridge, NSUInteger index, id json) {
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
          ABI7_0_0RCTLogArgumentError(weakSelf, index, typeName, "must not be null");
          return NO;
        };
      }
    }
  }

  _argumentBlocks = [argumentBlocks copy];
}

- (SEL)selector
{
  if (_selector == NULL) {
    [self processMethodSignature];
  }
  return _selector;
}

- (NSDictionary *)profileArgs
{
  if (_profileArgs) {
    // This sets _selector
    [self processMethodSignature];
    _profileArgs = @{
      @"module": NSStringFromClass(_moduleClass),
      @"selector": NSStringFromSelector(_selector),
    };
  }
  return _profileArgs;
}

- (void)invokeWithBridge:(ABI7_0_0RCTBridge *)bridge
                  module:(id)module
               arguments:(NSArray *)arguments
{
  if (_argumentBlocks == nil) {
    [self processMethodSignature];
  }

  if (ABI7_0_0RCT_DEBUG) {

    // Sanity check
    ABI7_0_0RCTAssert([module class] == _moduleClass, @"Attempted to invoke method \
              %@ on a module of class %@", [self methodName], [module class]);

    // Safety check
    if (arguments.count != _argumentBlocks.count) {
      NSInteger actualCount = arguments.count;
      NSInteger expectedCount = _argumentBlocks.count;

      // Subtract the implicit Promise resolver and rejecter functions for implementations of async functions
      if (_functionType == ABI7_0_0RCTFunctionTypePromise) {
        actualCount -= 2;
        expectedCount -= 2;
      }

      ABI7_0_0RCTLogError(@"%@.%@ was called with %zd arguments, but expects %zd. \
                  If you haven\'t changed this method yourself, this usually means that \
                  your versions of the native code and JavaScript code are out of sync. \
                  Updating both should make this error go away.",
                  ABI7_0_0RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName,
                  actualCount, expectedCount);
      return;
    }
  }

  // Set arguments
  NSUInteger index = 0;
  for (id json in arguments) {
    ABI7_0_0RCTArgumentBlock block = _argumentBlocks[index];
    if (!block(bridge, index, ABI7_0_0RCTNilIfNull(json))) {
      // Invalid argument, abort
      ABI7_0_0RCTLogArgumentError(self, index, json,
                          "could not be processed. Aborting method call.");
      return;
    }
    index++;
  }

  // Invoke method
  [_invocation invokeWithTarget:module];

  ABI7_0_0RCTAssert(
    @encode(ABI7_0_0RCTArgumentBlock)[0] == _C_ID,
    @"Block type encoding has changed, it won't be released. A check for the block"
     "type encoding (%s) has to be added below.",
    @encode(ABI7_0_0RCTArgumentBlock)
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
  return [NSString stringWithFormat:@"<%@: %p; exports %@ as %@();>",
          [self class], self, [self methodName], _JSMethodName];
}

@end
