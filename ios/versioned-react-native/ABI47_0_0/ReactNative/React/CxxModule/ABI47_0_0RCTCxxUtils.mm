/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTCxxUtils.h"

#import <ABI47_0_0React/ABI47_0_0RCTFollyConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTModuleData.h>
#import <ABI47_0_0React/ABI47_0_0RCTUtils.h>
#import <ABI47_0_0cxxreact/ABI47_0_0CxxNativeModule.h>
#import <ABI47_0_0jsi/ABI47_0_0jsi.h>

#import "ABI47_0_0DispatchMessageQueueThread.h"
#import "ABI47_0_0RCTCxxModule.h"
#import "ABI47_0_0RCTNativeModule.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

using ABI47_0_0facebook::jsi::JSError;

std::vector<std::unique_ptr<NativeModule>>
createNativeModules(NSArray<ABI47_0_0RCTModuleData *> *modules, ABI47_0_0RCTBridge *bridge, const std::shared_ptr<Instance> &instance)
{
  std::vector<std::unique_ptr<NativeModule>> nativeModules;
  for (ABI47_0_0RCTModuleData *moduleData in modules) {
    if ([moduleData.moduleClass isSubclassOfClass:[ABI47_0_0RCTCxxModule class]]) {
      nativeModules.emplace_back(std::make_unique<CxxNativeModule>(
          instance,
          [moduleData.name UTF8String],
          [moduleData] { return [(ABI47_0_0RCTCxxModule *)(moduleData.instance) createModule]; },
          std::make_shared<DispatchMessageQueueThread>(moduleData)));
    } else {
      nativeModules.emplace_back(std::make_unique<ABI47_0_0RCTNativeModule>(bridge, moduleData));
    }
  }
  return nativeModules;
}

static NSError *errorWithException(const std::exception &e)
{
  NSString *msg = @(e.what());
  NSMutableDictionary *errorInfo = [NSMutableDictionary dictionary];

  const auto *jsError = dynamic_cast<const JSError *>(&e);
  if (jsError) {
    errorInfo[ABI47_0_0RCTJSRawStackTraceKey] = @(jsError->getStack().c_str());
    msg = [@"Unhandled JS Exception: " stringByAppendingString:msg];
  }

  NSError *nestedError;
  try {
    std::rethrow_if_nested(e);
  } catch (const std::exception &e) {
    nestedError = errorWithException(e);
  } catch (...) {
  }

  if (nestedError) {
    msg = [NSString stringWithFormat:@"%@\n\n%@", msg, [nestedError localizedDescription]];
  }

  errorInfo[NSLocalizedDescriptionKey] = msg;
  return [NSError errorWithDomain:ABI47_0_0RCTErrorDomain code:1 userInfo:errorInfo];
}

NSError *tryAndReturnError(const std::function<void()> &func)
{
  try {
    @try {
      func();
      return nil;
    } @catch (NSException *exception) {
      return ABI47_0_0RCTErrorWithNSException(exception);
    } @catch (id exception) {
      // This will catch any other ObjC exception, but no C++ exceptions
      return ABI47_0_0RCTErrorWithMessage(@"non-std ObjC Exception");
    }
  } catch (const std::exception &ex) {
    return errorWithException(ex);
  } catch (...) {
    // On a 64-bit platform, this would catch ObjC exceptions, too, but not on
    // 32-bit platforms, so we catch those with id exceptions above.
    return ABI47_0_0RCTErrorWithMessage(@"non-std C++ exception");
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

}
}
