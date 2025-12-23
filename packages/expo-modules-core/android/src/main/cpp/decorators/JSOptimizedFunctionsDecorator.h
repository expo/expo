// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <unordered_map>
#include <memory>
#include <functional>

#include "JSDecorator.h"

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

// Function pointer type for optimized adapters
using OptimizedFunctionPtr = jsi::Value(*)(
    JNIEnv* env,
    jobject moduleInstance,
    jsi::Runtime& rt,
    const jsi::Value* args,
    size_t count
);

struct OptimizedFunctionMetadata {
    std::string name;
    OptimizedFunctionPtr functionPtr;
    jni::global_ref<jobject> moduleInstance;
    size_t argCount;
    bool enumerable;
};

class JSOptimizedFunctionsDecorator : public JSDecorator {
public:
    JSOptimizedFunctionsDecorator(jni::global_ref<jobject> moduleInstance);

    void registerOptimizedFunction(
        const std::string& name,
        OptimizedFunctionPtr functionPtr,
        size_t argCount,
        bool enumerable = true
    );

    void decorate(
        jsi::Runtime &runtime,
        jsi::Object &jsObject
    ) override;

private:
    jni::global_ref<jobject> moduleInstance_;
    std::unordered_map<std::string, OptimizedFunctionMetadata> optimizedFunctions_;
};

} // namespace expo
