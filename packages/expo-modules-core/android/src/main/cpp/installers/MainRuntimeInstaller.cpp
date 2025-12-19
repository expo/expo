#include "MainRuntimeInstaller.h"

#include "EventEmitter.h"
#include "SharedRef.h"
#include "NativeModule.h"
#include "../ExpoModulesHostObject.h"

#if IS_NEW_ARCHITECTURE_ENABLED

#include "BridgelessJSCallInvoker.h"

#endif

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

void MainRuntimeInstaller::registerNatives() {
  javaClassLocal()->registerNatives({
                                      makeNativeMethod("install",
                                                       MainRuntimeInstaller::installLegacy),
                                      makeNativeMethod("install", MainRuntimeInstaller::install),
                                    });
}

jni::local_ref<JSIContext::javaobject> MainRuntimeInstaller::installLegacy(
  jni::alias_ref<MainRuntimeInstaller::javaobject> self,
  jni::alias_ref<jni::JWeakReference<jobject>::javaobject> runtimeContextHolder,
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
  jni::alias_ref<react::CallInvokerHolder::javaobject> jsInvokerHolder
) noexcept {
  auto jsiContext = createJSIContext(
    runtimeContextHolder,
    jsRuntimePointer,
    jniDeallocator,
    jsInvokerHolder->cthis()->getCallInvoker()
  );

  prepareRuntime(
    self,
    jsiContext
  );

  return jsiContext;
}

jni::local_ref<JSIContext::javaobject> MainRuntimeInstaller::install(
  jni::alias_ref<MainRuntimeInstaller::javaobject> self,
  jni::alias_ref<jni::JWeakReference<jobject>::javaobject> runtimeContextHolder,
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
  jni::alias_ref<react::JRuntimeExecutor::javaobject> runtimeExecutor
) noexcept {
  auto jsiContext = createJSIContext(
    runtimeContextHolder,
    jsRuntimePointer,
    jniDeallocator,
    std::make_shared<BridgelessJSCallInvoker>(runtimeExecutor->cthis()->get())
  );

  prepareRuntime(
    self,
    jsiContext
  );

  return jsiContext;
}

jni::local_ref<JSIContext::javaobject> MainRuntimeInstaller::createJSIContext(
  jni::alias_ref<jni::JWeakReference<jobject>::javaobject> runtimeContextHolder,
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
  std::shared_ptr<react::CallInvoker> callInvoker
) noexcept {
  auto cxxPart = std::make_unique<JSIContext>(
    jsRuntimePointer,
    std::move(jniDeallocator),
    std::move(callInvoker)
  );

  auto hybridData = jni::detail::HybridData::create();
  auto javaPart = JSIContext::newJavaInstance(
    hybridData,
    runtimeContextHolder
  );
  cxxPart->bindToJavaPart(javaPart);

  jni::detail::setNativePointer(hybridData, std::move(cxxPart));

  return javaPart;
}

void MainRuntimeInstaller::prepareRuntime(
  jni::alias_ref<MainRuntimeInstaller::javaobject> self,
  jni::local_ref<JSIContext::javaobject> jsiContext
) noexcept {
  auto cxxPart = jsiContext->cthis();
  auto runtimeHolder = cxxPart->runtimeHolder;
  jsi::Runtime &runtime = runtimeHolder->get();

  bindJSIContext(runtime, cxxPart);


  std::shared_ptr<jsi::Object> mainObject = installMainObject(
    runtime, MainRuntimeInstaller::getCoreModule(self)->cthis()->decorators
  );

  installClasses(
    runtime,
    cxxPart
  );

  installModules(
    runtime,
    cxxPart,
    mainObject
  );
}

std::shared_ptr<jsi::Object> MainRuntimeInstaller::installMainObject(
  jsi::Runtime &runtime,
  std::vector<std::unique_ptr<JSDecorator>> &decorators
) noexcept {
  auto mainObject = std::make_shared<jsi::Object>(runtime);

  for (const auto &decorator: decorators) {
    decorator->decorate(runtime, *mainObject);
  }

  auto global = runtime.global();

  jsi::Object descriptor = JavaScriptObject::preparePropertyDescriptor(runtime, 1 << 1);

  descriptor.setProperty(runtime, "value", jsi::Value(runtime, *mainObject));

  common::defineProperty(
    runtime,
    &global,
    "expo",
    std::move(descriptor)
  );


  return mainObject;
}

void MainRuntimeInstaller::installClasses(
  jsi::Runtime &runtime,
  JSIContext *jsiContext
) noexcept {
  // We can't predict the order of deallocation of the JSIContext and the SharedObject.
  // So we need to pass a new ref to retain the JSIContext to make sure it's not deallocated before the SharedObject.
  const auto releaser = [threadSafeRef = jsiContext->threadSafeJThis](
    const SharedObject::ObjectId objectId) {
    threadSafeRef->use([objectId](jni::alias_ref<JSIContext::javaobject> globalRef) {
      JSIContext::deleteSharedObject(globalRef, objectId);
    });
  };

  EventEmitter::installClass(runtime);
  SharedObject::installBaseClass(runtime, releaser);
  SharedRef::installBaseClass(runtime);
  NativeModule::installClass(runtime);
}

void MainRuntimeInstaller::installModules(
  jsi::Runtime &runtime,
  JSIContext *jsiContext,
  const std::shared_ptr<jsi::Object> &hostObject
) noexcept {
  auto expoModules = std::make_shared<ExpoModulesHostObject>(jsiContext);
  auto expoModulesObject = jsi::Object::createFromHostObject(
    runtime,
    expoModules
  );

  // Define the `global.expo.modules` object.
  hostObject
    ->setProperty(
      runtime,
      "modules",
      expoModulesObject
    );
}

jni::local_ref<JavaScriptModuleObject::javaobject> MainRuntimeInstaller::getCoreModule(
  jni::alias_ref<MainRuntimeInstaller::javaobject> self
) {
  const static auto method = MainRuntimeInstaller::javaClassLocal()
    ->getMethod<jni::local_ref<JavaScriptModuleObject::javaobject>()>(
      "getCoreModuleObject"
    );
  return method(self);
}

} // namespace expo
