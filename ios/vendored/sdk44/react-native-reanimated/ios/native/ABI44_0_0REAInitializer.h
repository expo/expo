//
//  ABI44_0_0REAInitializer.h
//  ABI44_0_0RNReanimated
//
//  Created by Szymon Kapala on 27/07/2021.
//

#import <Foundation/Foundation.h>
#import <ABI44_0_0RNReanimated/NativeProxy.h>
#import <ABI44_0_0RNReanimated/ABI44_0_0REAEventDispatcher.h>
#import <ABI44_0_0RNReanimated/ABI44_0_0REAModule.h>
#import <ABI44_0_0React/ABI44_0_0RCTBridge+Private.h>
#import <ABI44_0_0React/ABI44_0_0RCTCxxBridgeDelegate.h>
#import <ABI44_0_0ReactCommon/ABI44_0_0RCTTurboModuleManager.h>
#import <jsireact/JSIExecutor.h>

#if RNVERSION >= 64
#import <ABI44_0_0React/ABI44_0_0RCTJSIExecutorRuntimeInstaller.h>
#endif

#if RNVERSION < 63
#import <ABI44_0_0ReactCommon/ABI44_0_0BridgeJSCallInvoker.h>
#endif

NS_ASSUME_NONNULL_BEGIN

namespace ABI44_0_0reanimated {

using namespace ABI44_0_0facebook;
using namespace ABI44_0_0React;

JSIExecutor::RuntimeInstaller ABI44_0_0REAJSIExecutorRuntimeInstaller(
    ABI44_0_0RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);

} // namespace reanimated
NS_ASSUME_NONNULL_END
