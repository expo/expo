// Copyright 2018-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <jsi/jsi.h>
#import <ReactCommon/RCTTurboModule.h>

#import <ExpoModulesCore/EXNativeModulesProxy.h>

using namespace facebook;
using namespace react;

namespace expo {

void installRuntimeObjects(jsi::Runtime &runtime, std::shared_ptr<CallInvoker> callInvoker, EXNativeModulesProxy *nativeModulesProxy);

} // namespace expo

#endif
