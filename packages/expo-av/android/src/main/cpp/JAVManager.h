//
// Created by Marc Rousavy on 13.07.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>

#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/CallInvoker.h>

namespace expo {

using namespace facebook;

class JAVManager : public jni::HybridClass<JAVManager> {
public:
    static auto constexpr kJavaDescriptor = "Lexpo/modules/av/AVManager;";
    static auto constexpr TAG = "JAVManager";
    static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis,
                                                  jlong jsContext,
                                                  jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder);
    static void registerNatives();

    void installJSIBindings();

private:
    friend HybridBase;
    jni::global_ref<JAVManager::javaobject> javaPart_;
    std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker_;
    jsi::Runtime* runtime_;

    explicit JAVManager(jni::alias_ref<JAVManager::jhybridobject> jThis,
                        jsi::Runtime* runtime,
                        std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker) :
            javaPart_(jni::make_global(jThis)),
            runtime_(runtime),
            jsCallInvoker_(jsCallInvoker)
    {}
};

} // namespace expo