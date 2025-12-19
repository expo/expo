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
    std::move(runtimeContextHolder),
    jsRuntimePointer,
    std::move(jniDeallocator),
    jsInvokerHolder->cthis()->getCallInvoker()
  );

  prepareRuntime(jsiContext);

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
    std::move(runtimeContextHolder),
    jsRuntimePointer,
    std::move(jniDeallocator),
    std::make_shared<BridgelessJSCallInvoker>(runtimeExecutor->cthis()->get())
  );

  prepareRuntime(jsiContext);

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
  jni::local_ref<JSIContext::javaobject> jsiContext
) noexcept {
  auto cxxPart = jsiContext->cthis();
  auto runtimeHolder = cxxPart->runtimeHolder;
  jsi::Runtime &runtime = runtimeHolder->get();

  bindJSIContext(runtime, cxxPart);

  runtimeHolder->installMainObject();

  installClasses(
    runtime,
    // We can't predict the order of deallocation of the JSIContext and the SharedObject.
    // So we need to pass a new ref to retain the JSIContext to make sure it's not deallocated before the SharedObject.
    [threadSafeRef = cxxPart->threadSafeJThis](const SharedObject::ObjectId objectId) {
      threadSafeRef->use([objectId](jni::alias_ref<JSIContext::javaobject> globalRef) {
        JSIContext::deleteSharedObject(globalRef, objectId);
      });
    }
  );

  auto expoModules = std::make_shared<ExpoModulesHostObject>(cxxPart);
  auto expoModulesObject = jsi::Object::createFromHostObject(
    runtime,
    expoModules
  );

  // Define the `global.expo.modules` object.
  runtimeHolder
    ->getMainObject()
    ->setProperty(
      runtime,
      "modules",
      expoModulesObject
    );
}

void MainRuntimeInstaller::installClasses(
  jsi::Runtime &runtime,
  expo::SharedObject::ObjectReleaser releaser
) noexcept {
  EventEmitter::installClass(runtime);
  SharedObject::installBaseClass(runtime, std::move(releaser));
  SharedRef::installBaseClass(runtime);
  NativeModule::installClass(runtime);
}

} // namespace expo
