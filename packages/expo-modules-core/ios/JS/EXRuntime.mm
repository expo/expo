// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXJSIConversions.h>

#import <ExpoModulesCore/EXRuntime.h>
#import <ExpoModulesCore/EXJSUtils.h>
#import <ExpoModulesCore/SharedObject.h>
#import <ExpoModulesCore/SharedRef.h>

@implementation EXRuntime

typedef jsi::Function (^InstanceFactory)(jsi::Runtime &runtime, NSString *_Nonnull name, expo::common::ClassConstructor constructor);

- (nonnull EXJavaScriptObject *)createInstance:(nonnull NSString *)name
                               instanceFactory:(nonnull InstanceFactory)instanceFactory
                                   constructor:(nonnull ClassConstructorBlock)constructor
{
  expo::common::ClassConstructor jsConstructor = [self, constructor](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value {
    std::shared_ptr<jsi::Object> thisPtr = std::make_shared<jsi::Object>(thisValue.asObject(runtime));
    EXJavaScriptObject *caller = [[EXJavaScriptObject alloc] initWith:thisPtr runtime:self];
    NSArray<EXJavaScriptValue *> *arguments = expo::convertJSIValuesToNSArray(self, args, count);

    // Returning something else than `this` is not supported in native constructors.
    @try {
      constructor(caller, arguments);
    } @catch (NSException *exception) {
      jsi::String jsMessage = expo::convertNSStringToJSIString(runtime, exception.reason ?: @"Constructor failed");
      jsi::Value error = runtime
        .global()
        .getProperty(runtime, "Error")
        .asObject(runtime)
        .asFunction(runtime)
        .callAsConstructor(runtime, {
          jsi::Value(runtime, jsMessage)
        });

      if (exception.userInfo[@"code"]) {
        jsi::String jsCode = expo::convertNSStringToJSIString(runtime, exception.userInfo[@"code"]);
        error.asObject(runtime).setProperty(runtime, "code", jsi::Value(runtime, jsCode));
      }

      throw jsi::JSError(runtime, jsi::Value(runtime, error));
    }

    return jsi::Value(runtime, thisValue);
  };
  std::shared_ptr<jsi::Function> klass = std::make_shared<jsi::Function>(instanceFactory(*[self get], name, jsConstructor));
  return [[EXJavaScriptObject alloc] initWith:klass runtime:self];
}

#pragma mark - Shared objects

- (nonnull EXJavaScriptObject *)createSharedObjectClass:(nonnull NSString *)name
                                            constructor:(nonnull ClassConstructorBlock)constructor
{
  InstanceFactory instanceFactory = ^(jsi::Runtime& runtime, NSString * name, expo::common::ClassConstructor constructor){
    return expo::SharedObject::createClass(*[self get], [name UTF8String], constructor);
  };

  return [self createInstance:name instanceFactory:instanceFactory constructor:constructor];
}

#pragma mark - Shared refs

- (nonnull EXJavaScriptObject *)createSharedRefClass:(nonnull NSString *)name
                                         constructor:(nonnull ClassConstructorBlock)constructor
{
  InstanceFactory instanceFactory = ^(jsi::Runtime& runtime, NSString * name, expo::common::ClassConstructor constructor){
    return expo::SharedRef::createClass(*[self get], [name UTF8String], constructor);
  };

  return [self createInstance:name instanceFactory:instanceFactory constructor:constructor];
}

@end
