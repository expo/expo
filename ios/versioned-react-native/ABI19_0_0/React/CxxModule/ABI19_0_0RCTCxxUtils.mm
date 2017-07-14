/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTCxxUtils.h"

#import <ReactABI19_0_0/ABI19_0_0RCTFollyConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTModuleData.h>
#import <ReactABI19_0_0/ABI19_0_0RCTUtils.h>
#include <cxxReactABI19_0_0/ABI19_0_0CxxNativeModule.h>
#include <ABI19_0_0jschelpers/ABI19_0_0Value.h>

#import "ABI19_0_0DispatchMessageQueueThread.h"
#import "ABI19_0_0RCTCxxModule.h"
#import "ABI19_0_0RCTNativeModule.h"

using namespace facebook::ReactABI19_0_0;

@implementation ABI19_0_0RCTConvert (folly)

+ (folly::dynamic)folly_dynamic:(id)json;
{
  if (json == nil || json == (id)kCFNull) {
    return nullptr;
  } else {
    folly::dynamic dyn = convertIdToFollyDynamic(json);
     if (dyn == nil) {
       ABI19_0_0RCTAssert(false, @"ABI19_0_0RCTConvert input json is of an impossible type");
     }
     return dyn;
  }
}

@end

namespace facebook {
namespace ReactABI19_0_0 {

std::vector<std::unique_ptr<NativeModule>> createNativeModules(NSArray<ABI19_0_0RCTModuleData *> *modules, ABI19_0_0RCTBridge *bridge, const std::shared_ptr<Instance> &instance)
{
  std::vector<std::unique_ptr<NativeModule>> nativeModules;
  for (ABI19_0_0RCTModuleData *moduleData in modules) {
    if ([moduleData.moduleClass isSubclassOfClass:[ABI19_0_0RCTCxxModule class]]) {
      nativeModules.emplace_back(std::make_unique<CxxNativeModule>(
        instance,
        [moduleData.name UTF8String],
        [moduleData] { return [(ABI19_0_0RCTCxxModule *)(moduleData.instance) createModule]; },
        std::make_shared<DispatchMessageQueueThread>(moduleData)));
    } else {
      nativeModules.emplace_back(std::make_unique<ABI19_0_0RCTNativeModule>(bridge, moduleData));
    }
  }
  return nativeModules;
}

JSContext *contextForGlobalContextRef(JSGlobalContextRef contextRef)
{
  static std::mutex s_mutex;
  static NSMapTable *s_contextCache;

  if (!contextRef) {
    return nil;
  }

  // Adding our own lock here, since JSC internal ones are insufficient
  std::lock_guard<std::mutex> lock(s_mutex);
  if (!s_contextCache) {
    NSPointerFunctionsOptions keyOptions = NSPointerFunctionsOpaqueMemory | NSPointerFunctionsOpaquePersonality;
    NSPointerFunctionsOptions valueOptions = NSPointerFunctionsWeakMemory | NSPointerFunctionsObjectPersonality;
    s_contextCache = [[NSMapTable alloc] initWithKeyOptions:keyOptions valueOptions:valueOptions capacity:0];
  }

  JSContext *ctx = [s_contextCache objectForKey:(__bridge id)contextRef];
  if (!ctx) {
    ctx = [JSC_JSContext(contextRef) contextWithJSGlobalContextRef:contextRef];
    [s_contextCache setObject:ctx forKey:(__bridge id)contextRef];
  }
  return ctx;
}

static NSError *errorWithException(const std::exception &e)
{
  NSString *msg = @(e.what());
  NSMutableDictionary *errorInfo = [NSMutableDictionary dictionary];

  const JSException *jsException = dynamic_cast<const JSException*>(&e);
  if (jsException) {
    errorInfo[ABI19_0_0RCTJSRawStackTraceKey] = @(jsException->getStack().c_str());
    msg = [@"Unhandled JS Exception: " stringByAppendingString:msg];
  }

  NSError *nestedError;
  try {
    std::rethrow_if_nested(e);
  } catch(const std::exception &e) {
    nestedError = errorWithException(e);
  } catch(...) {}

  if (nestedError) {
    msg = [NSString stringWithFormat:@"%@\n\n%@", msg, [nestedError localizedDescription]];
  }

  errorInfo[NSLocalizedDescriptionKey] = msg;
  return [NSError errorWithDomain:ABI19_0_0RCTErrorDomain code:1 userInfo:errorInfo];
}

NSError *tryAndReturnError(const std::function<void()>& func) {
  try {
    @try {
      func();
      return nil;
    }
    @catch (NSException *exception) {
      NSString *message =
      [NSString stringWithFormat:@"Exception '%@' was thrown from JS thread", exception];
      return ABI19_0_0RCTErrorWithMessage(message);
    }
    @catch (id exception) {
      // This will catch any other ObjC exception, but no C++ exceptions
      return ABI19_0_0RCTErrorWithMessage(@"non-std ObjC Exception");
    }
  } catch (const std::exception &ex) {
    return errorWithException(ex);
  } catch (...) {
    // On a 64-bit platform, this would catch ObjC exceptions, too, but not on
    // 32-bit platforms, so we catch those with id exceptions above.
    return ABI19_0_0RCTErrorWithMessage(@"non-std C++ exception");
  }
}

} }
