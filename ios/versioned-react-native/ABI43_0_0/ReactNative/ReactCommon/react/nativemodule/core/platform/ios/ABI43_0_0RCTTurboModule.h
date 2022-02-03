/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <memory>

#import <Foundation/Foundation.h>

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>
#import <ABI43_0_0React/ABI43_0_0RCTModuleMethod.h>
#import <ABI43_0_0ReactCommon/ABI43_0_0CallInvoker.h>
#import <ABI43_0_0ReactCommon/ABI43_0_0TurboModule.h>
#import <ABI43_0_0ReactCommon/ABI43_0_0TurboModuleUtils.h>
#import <string>
#import <unordered_map>

#define ABI43_0_0RCT_IS_TURBO_MODULE_CLASS(klass) \
  ((ABI43_0_0RCTTurboModuleEnabled() && [(klass) conformsToProtocol:@protocol(ABI43_0_0RCTTurboModule)]))
#define ABI43_0_0RCT_IS_TURBO_MODULE_INSTANCE(module) ABI43_0_0RCT_IS_TURBO_MODULE_CLASS([(module) class])

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class Instance;

/**
 * ObjC++ specific TurboModule base class.
 */
class JSI_EXPORT ObjCTurboModule : public TurboModule {
 public:
  // TODO(T65603471): Should we unify this with a Fabric abstraction?
  struct InitParams {
    std::string moduleName;
    id<ABI43_0_0RCTTurboModule> instance;
    std::shared_ptr<CallInvoker> jsInvoker;
    std::shared_ptr<CallInvoker> nativeInvoker;
    bool isSyncModule;
  };

  ObjCTurboModule(const InitParams &params);

  jsi::Value invokeObjCMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count);

  id<ABI43_0_0RCTTurboModule> instance_;
  std::shared_ptr<CallInvoker> nativeInvoker_;

 protected:
  void setMethodArgConversionSelector(NSString *methodName, int argIndex, NSString *fnName);

 private:
  // Does the NativeModule dispatch async methods to the JS thread?
  const bool isSyncModule_;

  /**
   * TODO(ramanpreet):
   * Investigate an optimization that'll let us get rid of this NSMutableDictionary.
   */
  NSMutableDictionary<NSString *, NSMutableArray *> *methodArgConversionSelectors_;
  NSDictionary<NSString *, NSArray<NSString *> *> *methodArgumentTypeNames_;

  bool isMethodSync(TurboModuleMethodValueKind returnType);
  BOOL hasMethodArgConversionSelector(NSString *methodName, int argIndex);
  SEL getMethodArgConversionSelector(NSString *methodName, int argIndex);
  NSString *getArgumentTypeName(NSString *methodName, int argIndex);
  NSInvocation *getMethodInvocation(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind returnType,
      const char *methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count,
      NSMutableArray *retainedObjectsForInvocation);
  jsi::Value performMethodInvocation(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind returnType,
      const char *methodName,
      NSInvocation *inv,
      NSMutableArray *retainedObjectsForInvocation);

  using PromiseInvocationBlock = void (^)(ABI43_0_0RCTPromiseResolveBlock resolveWrapper, ABI43_0_0RCTPromiseRejectBlock rejectWrapper);
  jsi::Value
  createPromise(jsi::Runtime &runtime, std::shared_ptr<ABI43_0_0React::CallInvoker> jsInvoker, PromiseInvocationBlock invoke);
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook

@protocol ABI43_0_0RCTTurboModule <NSObject>
@optional
/**
 * Used by TurboModules to get access to other TurboModules.
 *
 * Usage:
 * Place `@synthesize turboModuleRegistry = _turboModuleRegistry`
 * in the @implementation section of your TurboModule.
 */
@property (nonatomic, weak) id<ABI43_0_0RCTTurboModuleRegistry> turboModuleRegistry;

@optional
// This should be required, after migration is done.
- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::TurboModule>)getTurboModule:
    (const ABI43_0_0facebook::ABI43_0_0React::ObjCTurboModule::InitParams &)params;

@end

/**
 * These methods are all implemented by ABI43_0_0RCTCxxBridge, which subclasses ABI43_0_0RCTBridge. Hence, they must only be used in
 * contexts where the concrete class of an ABI43_0_0RCTBridge instance is ABI43_0_0RCTCxxBridge. This happens, for example, when
 * [ABI43_0_0RCTCxxBridgeDelegate jsExecutorFactoryForBridge:(ABI43_0_0RCTBridge *)] is invoked by ABI43_0_0RCTCxxBridge.
 *
 * TODO: Consolidate this extension with the one in ABI43_0_0RCTSurfacePresenter.
 */
@interface ABI43_0_0RCTBridge (ABI43_0_0RCTTurboModule)
- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::CallInvoker>)jsCallInvoker;
- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::CallInvoker>)decorateNativeCallInvoker:
    (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::CallInvoker>)nativeInvoker;
@end
