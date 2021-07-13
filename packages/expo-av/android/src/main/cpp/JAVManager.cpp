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

TSelf JAVManager::initHybrid(alias_ref<jhybridobject> jThis) {
    return makeCxxInstance(jThis);
}

void JAVManager::registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", JAVManager::initHybrid),
        makeNativeMethod("installJSIBindings", JAVManager::installJSIBindings),
    });
}

void JAVManager::installJSIBindings(jlong jsRuntimePointer,
                                    jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder) {
    auto& runtime = *reinterpret_cast<jsi::Runtime*>(jsRuntimePointer);

    auto function = [](jsi::Runtime &runtime,
                       const jsi::Value &thisValue,
                       const jsi::Value *args,
                       size_t argsCount) -> jsi::Value {


        return jsi::Value::undefined();
    };
    runtime.global().setProperty(runtime,
                                 "__av_sound_setOnAudioSampleReceivedCallback",
                                 jsi::Function::createFromHostFunction(runtime,
                                                                       jsi::PropNameID::forAscii(runtime, "__av_sound_setOnAudioSampleReceivedCallback"),
                                                                       2,
                                                                       function));
}

} // namespace expo
