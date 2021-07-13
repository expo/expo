//
// Created by Marc Rousavy on 13.07.21.
//


#include "JAVManager.h"

#include <jni.h>
#include <fbjni/fbjni.h>

#include <memory>
#include <string>

#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/CallInvoker.h>

namespace expo {

using namespace facebook;
using namespace jni;

using TSelf = local_ref<HybridClass<expo::JAVManager>::jhybriddata>;

TSelf JAVManager::initHybrid(alias_ref<HybridClass::jhybridobject> jThis,
                             jlong jsContext,
                             jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder) {

    return makeCxxInstance(jThis,
                           reinterpret_cast<jsi::Runtime *>(jsContext),
                           jsCallInvokerHolder->cthis()->getCallInvoker());
}

void JAVManager::registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", JAVManager::initHybrid),
        makeNativeMethod("installJSIBindings", JAVManager::installJSIBindings),
    });
}

void JAVManager::installJSIBindings() {
  // TODO: ...
}

} // namespace expo
