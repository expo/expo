/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTCxxUtils.h"

#import <ReactABI34_0_0/ABI34_0_0RCTFollyConvert.h>
#import <ReactABI34_0_0/ABI34_0_0RCTModuleData.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUtils.h>
#import <cxxReactABI34_0_0/ABI34_0_0CxxNativeModule.h>
#import <ABI34_0_0jsi/ABI34_0_0jsi.h>

#import "ABI34_0_0DispatchMessageQueueThread.h"
#import "ABI34_0_0RCTCxxModule.h"
#import "ABI34_0_0RCTNativeModule.h"

namespace facebook {
namespace ReactABI34_0_0 {

using facebook::jsi::JSError;

std::vector<std::unique_ptr<NativeModule>> createNativeModules(NSArray<ABI34_0_0RCTModuleData *> *modules, ABI34_0_0RCTBridge *bridge, const std::shared_ptr<Instance> &instance)
{
  std::vector<std::unique_ptr<NativeModule>> nativeModules;
  for (ABI34_0_0RCTModuleData *moduleData in modules) {
    if ([moduleData.moduleClass isSubclassOfClass:[ABI34_0_0RCTCxxModule class]]) {
      nativeModules.emplace_back(std::make_unique<CxxNativeModule>(
        instance,
        [moduleData.name UTF8String],
        [moduleData] { return [(ABI34_0_0RCTCxxModule *)(moduleData.instance) createModule]; },
        std::make_shared<DispatchMessageQueueThread>(moduleData)));
    } else {
      nativeModules.emplace_back(std::make_unique<ABI34_0_0RCTNativeModule>(bridge, moduleData));
    }
  }
  return nativeModules;
}

static NSError *errorWithException(const std::exception &e)
{
  NSString *msg = @(e.what());
  NSMutableDictionary *errorInfo = [NSMutableDictionary dictionary];

  const auto *jsError = dynamic_cast<const JSError*>(&e);
  if (jsError) {
    errorInfo[ABI34_0_0RCTJSRawStackTraceKey] = @(jsError->getStack().c_str());
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
  return [NSError errorWithDomain:ABI34_0_0RCTErrorDomain code:1 userInfo:errorInfo];
}

NSError *tryAndReturnError(const std::function<void()>& func)
{
  try {
    @try {
      func();
      return nil;
    }
    @catch (NSException *exception) {
      NSString *message =
      [NSString stringWithFormat:@"Exception '%@' was thrown from JS thread", exception];
      return ABI34_0_0RCTErrorWithMessage(message);
    }
    @catch (id exception) {
      // This will catch any other ObjC exception, but no C++ exceptions
      return ABI34_0_0RCTErrorWithMessage(@"non-std ObjC Exception");
    }
  } catch (const std::exception &ex) {
    return errorWithException(ex);
  } catch (...) {
    // On a 64-bit platform, this would catch ObjC exceptions, too, but not on
    // 32-bit platforms, so we catch those with id exceptions above.
    return ABI34_0_0RCTErrorWithMessage(@"non-std C++ exception");
  }
}

NSString *deriveSourceURL(NSURL *url)
{
  NSString *sourceUrl;
  if (url.isFileURL) {
    // Url will contain only path to resource (i.g. file:// will be removed)
    sourceUrl = url.path;
  } else {
    // Url will include protocol (e.g. http://)
    sourceUrl = url.absoluteString;
  }
  return sourceUrl ?: @"";
}

} }
