// Copyright 2018-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <ABI45_0_0jsi/ABI45_0_0jsi.h>
#import <ABI45_0_0ReactCommon/ABI45_0_0RCTTurboModule.h>

using namespace ABI45_0_0facebook;
using namespace ABI45_0_0React;

namespace ABI45_0_0expo {

using PromiseInvocationBlock = void (^)(ABI45_0_0RCTPromiseResolveBlock resolveWrapper, ABI45_0_0RCTPromiseRejectBlock rejectWrapper);

void callPromiseSetupWithBlock(jsi::Runtime &runtime, std::shared_ptr<CallInvoker> jsInvoker, std::shared_ptr<Promise> promise, PromiseInvocationBlock setupBlock);

} // namespace ABI45_0_0expo

#endif
