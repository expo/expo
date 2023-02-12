#import <Foundation/Foundation.h>
#import "NativeProxy.h"
#import "DevMenuREAEventDispatcher.h"
#import "DevMenuREAModule.h"
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

namespace devmenureanimated {

using namespace facebook;
using namespace react;

JSIExecutor::RuntimeInstaller DevMenuREAJSIExecutorRuntimeInstaller(
    RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);

} // namespace devmenureanimated
NS_ASSUME_NONNULL_END
