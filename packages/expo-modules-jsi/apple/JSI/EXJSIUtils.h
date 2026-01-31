// Copyright 2018-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <functional>

#import "jsi.h"
#import <React/RCTBridgeModule.h>
#import <ReactCommon/TurboModuleUtils.h>
#import <ReactCommon/CallInvoker.h>
#import <react/bridging/CallbackWrapper.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <reacthermes/HermesExecutorFactory.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo
{

#pragma mark - Promises

    using PromiseInvocationBlock = void (^)(RCTPromiseResolveBlock resolveWrapper, RCTPromiseRejectBlock rejectWrapper);

    void callPromiseSetupWithBlock(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> jsInvoker, std::shared_ptr<react::Promise> promise, PromiseInvocationBlock setupBlock);

#pragma mark - Weak objects

    /**
     Checks whether the `WeakRef` class is available in the given runtime.
     According to the docs, it is unimplemented in JSC prior to iOS 14.5.
     As of the time of writing this comment it's also unimplemented in Hermes
     where you should use `jsi::WeakObject` instead.
     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef
     */
    bool isWeakRefSupported(jsi::Runtime &runtime);

    /**
     Creates the `WeakRef` with given JSI object. You should first use `isWeakRefSupported`
     to check whether this feature is supported by the runtime.
     */
    std::shared_ptr<jsi::Object> createWeakRef(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object);

    /**
     Returns the `WeakRef` object's target object, or an empty pointer if the target object has been reclaimed.
     */
    std::shared_ptr<jsi::Object> derefWeakRef(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object);

#pragma mark - Errors

    jsi::Value makeCodedError(jsi::Runtime &runtime, NSString *code, NSString *message);

#pragma mark - Runtime

jsi::Runtime &createHermesRuntime();

std::shared_ptr<react::RuntimeScheduler> runtimeSchedulerFromRuntime(jsi::Runtime &runtime);

/**
 Wrapper for RuntimeScheduler from React which for some reason cannot be constructed from Swift.
 */
class RuntimeScheduler {
private:
  std::shared_ptr<react::RuntimeScheduler> reactRuntimeScheduler;

public:
  RuntimeScheduler(jsi::Runtime &runtime) : reactRuntimeScheduler(runtimeSchedulerFromRuntime(runtime)) {}

  using ScheduleTaskCallback = void (^_Nonnull)();

  void scheduleTask(react::SchedulerPriority priority, ScheduleTaskCallback callback) noexcept {
    reactRuntimeScheduler->scheduleTask(priority, [callback = std::move(callback)](jsi::Runtime &runtime) {
      callback();
    });
  }
} SWIFT_UNSAFE_REFERENCE;

#pragma mark - Host functions

typedef jsi::Value (^_Nonnull HostFunctionBlock)(jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *_Nonnull args, size_t argsCount);

jsi::Function createHostFunction(jsi::Runtime &runtime, const char *_Nonnull name, HostFunctionBlock block);

#pragma mark - Other helpers

jsi::Value valueFromFunction(jsi::Runtime &runtime, const jsi::Function &function);

std::shared_ptr<const jsi::Buffer> makeSharedStringBuffer(const std::string &source) noexcept;

} // namespace expo

#endif
