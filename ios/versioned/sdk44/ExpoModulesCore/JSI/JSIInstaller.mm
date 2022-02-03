// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/JSIInstaller.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0ExpoModulesProxySpec.h>

using namespace ABI44_0_0facebook;
using namespace ABI44_0_0React;

//using PromiseInvocationBlock = void (^)(ABI44_0_0RCTPromiseResolveBlock resolveWrapper, ABI44_0_0RCTPromiseRejectBlock rejectWrapper);

namespace ABI44_0_0expo {

void installRuntimeObjects(jsi::Runtime &runtime, std::shared_ptr<CallInvoker> callInvoker, ABI44_0_0EXNativeModulesProxy *nativeModulesProxy)
{
  auto expoModulesProxyModule = std::make_shared<ExpoModulesProxySpec>(callInvoker, nativeModulesProxy);

  runtime
    .global()
    .setProperty(runtime, "ExpoModulesProxy", jsi::Object::createFromHostObject(runtime, expoModulesProxyModule));
}

} // namespace ABI44_0_0expo
