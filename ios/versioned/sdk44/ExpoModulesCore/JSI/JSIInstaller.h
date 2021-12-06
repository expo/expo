// Copyright 2018-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <ABI44_0_0jsi/ABI44_0_0jsi.h>
#import <ABI44_0_0ReactCommon/ABI44_0_0RCTTurboModule.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXNativeModulesProxy.h>

using namespace ABI44_0_0facebook;
using namespace ABI44_0_0React;

namespace ABI44_0_0expo {

void installRuntimeObjects(jsi::Runtime &runtime, std::shared_ptr<CallInvoker> callInvoker, ABI44_0_0EXNativeModulesProxy *nativeModulesProxy);

} // namespace ABI44_0_0expo

#endif
