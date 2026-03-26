#include "WorkletRuntimeInstaller.h"

#if WORKLETS_ENABLED

#include "../worklets/WorkletJSCallInvoker.h"
#include "../decorators/JSDecoratorsBridgingObject.h"
#include <worklets/WorkletRuntime/WorkletRuntime.h>

#include <unordered_map>

#endif

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

#if WORKLETS_ENABLED

/**
 * Installs `SharedObject.__resolveInWorklet(objectId)` on the worklet runtime.
 *
 * When a SharedObject is serialized into a worklet, only its ID crosses the
 * boundary.  On the worklet side this function reconstructs a proxy whose
 * property getters/setters call back into the same Kotlin lambdas that the
 * main-runtime class uses — no new native code is needed per property.
 *
 * Prototypes are built once per class type and cached in native memory.
 */
static void installResolveInWorklet(jsi::Runtime &runtime, JSIContext *jsiContext) {
  auto sharedObjectClass = SharedObject::getBaseClass(runtime);

  // Per-class prototype cache. We must also keep the decorators alive because
  // the JSI getter/setter host functions capture weak_ptr<MethodMetadata>.
  struct CachedClass {
    std::shared_ptr<jsi::Object> prototype;
    std::vector<std::unique_ptr<JSDecorator>> decorators;
  };
  auto cache = std::make_shared<std::unordered_map<std::string, CachedClass>>();

  auto resolveFunction = jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, "__resolveInWorklet"),
    1,
    [jsiContext, cache](
      jsi::Runtime &rt,
      const jsi::Value &,
      const jsi::Value *args,
      size_t count
    ) -> jsi::Value {
      if (count < 1 || !args[0].isNumber()) {
        return jsi::Value::undefined();
      }
      int objectId = static_cast<int>(args[0].asNumber());

      // 1. Ask Kotlin for the class name (via main runtime's SharedObjectRegistry).
      std::string className = jsiContext->getSharedObjectClassName(objectId);
      if (className.empty()) {
        return jsi::Value::undefined();
      }

      // 2. Build & cache the prototype for this class type.
      auto it = cache->find(className);
      if (it == cache->end()) {
        auto decoratorsObj = jsiContext->buildWorkletClassDecorators(objectId);
        if (decoratorsObj == nullptr) {
          return jsi::Value::undefined();
        }

        // Inherit from SharedObject.prototype so __expo_shared_object_id__ works.
        auto basePrototype = SharedObject::getBaseClass(rt)
          .getPropertyAsObject(rt, "prototype");

        auto prototype = std::make_shared<jsi::Object>(rt);
        prototype->setProperty(rt, "__proto__", basePrototype);

        // Reuse the existing property decorators built by exportProperties().
        auto bridgingObject = jni::static_ref_cast<
          jni::HybridClass<JSDecoratorsBridgingObject>::javaobject
        >(decoratorsObj);
        auto decorators = bridgingObject->cthis()->bridge();
        for (auto &decorator : decorators) {
          decorator->decorate(rt, *prototype);
        }

        // Store both prototype AND decorators — the JSI host functions hold
        // weak_ptr<MethodMetadata>, so the decorators must stay alive.
        CachedClass entry {
          .prototype = std::move(prototype),
          .decorators = std::move(decorators)
        };
        it = cache->emplace(className, std::move(entry)).first;
      }

      // 3. Create a proxy instance backed by the cached prototype.
      auto proxy = jsi::Object(rt);
      proxy.setProperty(rt, "__proto__", *(it->second.prototype));

      // No-op releaser: the worklet proxy does not own the SharedObject.
      auto nativeState = std::make_shared<SharedObject::NativeState>(
        objectId,
        [](const SharedObject::ObjectId) {}
      );
      proxy.setNativeState(rt, std::move(nativeState));

      return jsi::Value(rt, proxy);
    }
  );

  sharedObjectClass.setProperty(runtime, "__resolveInWorklet", std::move(resolveFunction));
}

#endif // WORKLETS_ENABLED

void WorkletRuntimeInstaller::registerNatives() {
  javaClassLocal()->registerNatives({
                                      makeNativeMethod("install", WorkletRuntimeInstaller::install)
                                    });
}

jni::local_ref<JSIContext::javaobject> WorkletRuntimeInstaller::install(
  jni::alias_ref<MainRuntimeInstaller::javaobject> self,
  jni::alias_ref<jni::JWeakReference<jobject>::javaobject> runtimeContextHolder,
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator
) noexcept {
#if WORKLETS_ENABLED
  auto *jsRuntime = reinterpret_cast<jsi::Runtime *>(jsRuntimePointer);
  auto workletRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*jsRuntime);

  auto jsiContext = MainRuntimeInstaller::createJSIContext(
    runtimeContextHolder,
    jsRuntimePointer,
    jniDeallocator,
    std::make_shared<WorkletJSCallInvoker>(workletRuntime)
  );

  WorkletRuntimeInstaller::prepareRuntime(jsiContext);

  return jsiContext;
#else
  return nullptr;
#endif
}

void WorkletRuntimeInstaller::prepareRuntime(
  jni::local_ref<JSIContext::javaobject> jsiContext
) noexcept {
#if WORKLETS_ENABLED
  auto cxxPart = jsiContext->cthis();
  auto runtimeHolder = cxxPart->runtimeHolder;
  jsi::Runtime &runtime = runtimeHolder->get();

  bindJSIContext(runtime, cxxPart);

  auto mainObject = std::make_shared<jsi::Object>(runtime);

  auto global = runtime.global();
  jsi::Object descriptor = JavaScriptObject::preparePropertyDescriptor(runtime, 1 << 1);
  descriptor.setProperty(runtime, "value", jsi::Value(runtime, *mainObject));
  common::defineProperty(
    runtime,
    &global,
    "expo",
    std::move(descriptor)
  );

  MainRuntimeInstaller::installClasses(
    runtime,
    cxxPart
  );

  installResolveInWorklet(runtime, cxxPart);

// TODO(@lukmccall): Re-enable module installation when iOS start supporting exporting native modules
//  MainRuntimeInstaller::installModules(
//    runtime,
//    cxxPart,
//    mainObject
//  );
#endif
}

} // namespace expo
