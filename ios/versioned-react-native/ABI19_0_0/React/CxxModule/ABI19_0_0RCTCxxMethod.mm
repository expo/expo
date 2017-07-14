/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTCxxMethod.h"

#import <ReactABI19_0_0/ABI19_0_0RCTBridge+Private.h>
#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTFollyConvert.h>
#import <cxxReactABI19_0_0/ABI19_0_0JsArgumentHelpers.h>
#import <folly/Memory.h>

#import "ABI19_0_0RCTCxxUtils.h"

using facebook::xplat::module::CxxModule;
using namespace facebook::ReactABI19_0_0;

@implementation ABI19_0_0RCTCxxMethod
{
  std::unique_ptr<CxxModule::Method> _method;
}

@synthesize JSMethodName = _JSMethodName;

- (instancetype)initWithCxxMethod:(const CxxModule::Method &)method
{
  if ((self = [super init])) {
    _JSMethodName = @(method.name.c_str());
    _method = folly::make_unique<CxxModule::Method>(method);
  }
  return self;
}

- (id)invokeWithBridge:(ABI19_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments
{
  // module is unused except for printing errors. The C++ object it represents
  // is also baked into _method.

  // the last N arguments are callbacks, according to the Method data.  The
  // preceding arguments are values whic have already been parsed from JS: they
  // may be NSNumber (bool, int, double), NSString, NSArray, or NSObject.

  CxxModule::Callback first;
  CxxModule::Callback second;

  if (arguments.count < _method->callbacks) {
    ABI19_0_0RCTLogError(@"Method %@.%s expects at least %lu arguments, but got %tu",
                ABI19_0_0RCTBridgeModuleNameForClass([module class]), _method->name.c_str(),
                _method->callbacks, arguments.count);
    return nil;
  }

  if (_method->callbacks >= 1) {
    if (![arguments[arguments.count - 1] isKindOfClass:[NSNumber class]]) {
      ABI19_0_0RCTLogError(@"Argument %tu (%@) of %@.%s should be a function",
                  arguments.count - 1, arguments[arguments.count - 1],
                  ABI19_0_0RCTBridgeModuleNameForClass([module class]), _method->name.c_str());
      return nil;
    }

    NSNumber *id1;
    if (_method->callbacks == 2) {
      if (![arguments[arguments.count - 2] isKindOfClass:[NSNumber class]]) {
        ABI19_0_0RCTLogError(@"Argument %tu (%@) of %@.%s should be a function",
                    arguments.count - 2, arguments[arguments.count - 2],
                    ABI19_0_0RCTBridgeModuleNameForClass([module class]), _method->name.c_str());
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

  folly::dynamic args = [ABI19_0_0RCTConvert folly_dynamic:arguments];
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
  } catch (const facebook::xplat::JsArgumentException &ex) {
    ABI19_0_0RCTLogError(@"Method %@.%s argument error: %s",
                ABI19_0_0RCTBridgeModuleNameForClass([module class]), _method->name.c_str(),
                ex.what());
    return nil;
  }
}

- (ABI19_0_0RCTFunctionType)functionType
{
  // TODO: support promise-style APIs
  return _method->syncFunc ? ABI19_0_0RCTFunctionTypeSync : ABI19_0_0RCTFunctionTypeNormal;
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; name = %@>",
          [self class], self, self.JSMethodName];
}

@end
