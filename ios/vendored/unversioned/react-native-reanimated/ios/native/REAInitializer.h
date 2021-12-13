//
//  REAInitializer.h
//  RNReanimated
//
//  Created by Szymon Kapala on 27/07/2021.
//

#import <Foundation/Foundation.h>
#import <RNReanimated/NativeProxy.h>
#import <RNReanimated/REAEventDispatcher.h>
#import <RNReanimated/REAModule.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <jsireact/JSIExecutor.h>

#if RNVERSION >= 64
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#endif

#if RNVERSION < 63
#import <ReactCommon/BridgeJSCallInvoker.h>
#endif

NS_ASSUME_NONNULL_BEGIN

namespace reanimated {

using namespace facebook;
using namespace react;

JSIExecutor::RuntimeInstaller REAJSIExecutorRuntimeInstaller(
    RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);

} // namespace reanimated
NS_ASSUME_NONNULL_END
