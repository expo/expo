/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTCxxMethod.h"

#import <ABI42_0_0React/ABI42_0_0RCTBridge+Private.h>
#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTFollyConvert.h>
#import <ABI42_0_0cxxreact/ABI42_0_0JsArgumentHelpers.h>

#import "ABI42_0_0RCTCxxUtils.h"

#import <memory>

using ABI42_0_0facebook::xplat::module::CxxModule;
using namespace ABI42_0_0facebook::ABI42_0_0React;

@implementation ABI42_0_0RCTCxxMethod {
  std::unique_ptr<CxxModule::Method> _method;
}

- (instancetype)initWithCxxMethod:(const CxxModule::Method &)method
{
  if ((self = [super init])) {
    _method = std::make_unique<CxxModule::Method>(method);
  }
  return self;
}

- (const char *)JSMethodName
{
  return _method->name.c_str();
}

- (ABI42_0_0RCTFunctionType)functionType
{
  std::string type(_method->getType());
  if (type == "sync") {
    return ABI42_0_0RCTFunctionTypeSync;
  } else if (type == "async") {
    return ABI42_0_0RCTFunctionTypeNormal;
  } else {
    return ABI42_0_0RCTFunctionTypePromise;
  }
}

- (id)invokeWithBridge:(ABI42_0_0RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments
{
  // module is unused except for printing errors. The C++ object it represents
  // is also baked into _method.

  // the last N arguments are callbacks, according to the Method data.  The
  // preceding arguments are values which have already been parsed from JS: they
  // may be NSNumber (bool, int, double), NSString, NSArray, or NSObject.

  CxxModule::Callback first;
  CxxModule::Callback second;

  if (arguments.count < _method->callbacks) {
    ABI42_0_0RCTLogError(
        @"Method %@.%s expects at least %zu arguments, but got %tu",
        ABI42_0_0RCTBridgeModuleNameForClass([module class]),
        _method->name.c_str(),
        _method->callbacks,
        arguments.count);
    return nil;
  }

  if (_method->callbacks >= 1) {
    if (![arguments[arguments.count - 1] isKindOfClass:[NSNumber class]]) {
      ABI42_0_0RCTLogError(
          @"Argument %tu (%@) of %@.%s should be a function",
          arguments.count - 1,
          arguments[arguments.count - 1],
          ABI42_0_0RCTBridgeModuleNameForClass([module class]),
          _method->name.c_str());
      return nil;
    }

    NSNumber *id1;
    if (_method->callbacks == 2) {
      if (![arguments[arguments.count - 2] isKindOfClass:[NSNumber class]]) {
        ABI42_0_0RCTLogError(
            @"Argument %tu (%@) of %@.%s should be a function",
            arguments.count - 2,
            arguments[arguments.count - 2],
            ABI42_0_0RCTBridgeModuleNameForClass([module class]),
            _method->name.c_str());
        return nil;
      }

      id1 = arguments[arguments.count - 2];
      NSNumber *id2 = arguments[arguments.count - 1];

      second = ^(std::vector<folly::dynamic> args) {
        [bridge enqueueCallback:id2 args:convertFollyDynamicToId(folly::dynamic(args.begin(), args.end()))];
      };
    } else {
      id1 = arguments[arguments.count - 1];
    }

    first = ^(std::vector<folly::dynamic> args) {
      [bridge enqueueCallback:id1 args:convertFollyDynamicToId(folly::dynamic(args.begin(), args.end()))];
    };
  }

  folly::dynamic args = convertIdToFollyDynamic(arguments);
  args.resize(args.size() - _method->callbacks);

  try {
    if (_method->func) {
      _method->func(std::move(args), first, second);
      return nil;
    } else {
      auto result = _method->syncFunc(std::move(args));
      // TODO: we should convert this to JSValue directly
      return convertFollyDynamicToId(result);
    }
  } catch (const ABI42_0_0facebook::xplat::JsArgumentException &ex) {
    ABI42_0_0RCTLogError(
        @"Method %@.%s argument error: %s",
        ABI42_0_0RCTBridgeModuleNameForClass([module class]),
        _method->name.c_str(),
        ex.what());
    return nil;
  }
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; name = %s>", [self class], self, self.JSMethodName];
}

@end
