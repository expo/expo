// Copyright 2018-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <ABI45_0_0jsi/ABI45_0_0jsi.h>
#import <ABI45_0_0ReactCommon/ABI45_0_0RCTTurboModule.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXNativeModulesProxy.h>

using namespace ABI45_0_0facebook;
using namespace ABI45_0_0React;

namespace ABI45_0_0expo {

void installRuntimeObjects(jsi::Runtime &runtime, std::shared_ptr<CallInvoker> callInvoker, ABI45_0_0EXNativeModulesProxy *nativeModulesProxy);

} // namespace ABI45_0_0expo

#endif

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXJavaScriptRuntime.h>

@class SwiftInteropBridge;

@interface ABI45_0_0EXJavaScriptRuntimeManager : NSObject

+ (void)installExpoModulesToRuntime:(nonnull ABI45_0_0EXJavaScriptRuntime *)runtime withSwiftInterop:(nonnull SwiftInteropBridge *)swiftInterop;

@end
