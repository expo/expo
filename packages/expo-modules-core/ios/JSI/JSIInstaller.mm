// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/JSIInstaller.h>
#import <ExpoModulesCore/ExpoModulesProxySpec.h>

using namespace facebook;
using namespace react;

//using PromiseInvocationBlock = void (^)(RCTPromiseResolveBlock resolveWrapper, RCTPromiseRejectBlock rejectWrapper);

namespace expo {

void installRuntimeObjects(jsi::Runtime &runtime, std::shared_ptr<CallInvoker> callInvoker, EXNativeModulesProxy *nativeModulesProxy)
{
  auto expoModulesProxyModule = std::make_shared<ExpoModulesProxySpec>(callInvoker, nativeModulesProxy);

  runtime
    .global()
    .setProperty(runtime, "ExpoModulesProxy", jsi::Object::createFromHostObject(runtime, expoModulesProxyModule));
}

} // namespace expo
