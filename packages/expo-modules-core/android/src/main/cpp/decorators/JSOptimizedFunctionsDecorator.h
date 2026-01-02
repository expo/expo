// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <unordered_map>
#include <memory>
#include <string>
#include <vector>

#include "JSDecorator.h"

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

// Type descriptors for parameter and return types
enum class JNIType {
    Double,
    Int,
    Boolean,
    Long,
    Float,
    String,
    Void,
    Object
};

/**
 * Metadata for an optimized function, including its JNI signature
 * and parameter/return type information for runtime dispatch.
 */
struct OptimizedFunctionMetadata {
    std::string name;
    std::string methodName;          // Kotlin method name
    std::string jniSignature;        // e.g., "(DD)D"
    std::vector<JNIType> paramTypes; // e.g., [Double, Double]
    JNIType returnType;              // e.g., Double
    jni::global_ref<jobject> moduleInstance;
    mutable jmethodID cachedMethodId = nullptr; // Lazy-initialized
    size_t argCount;
    bool enumerable;
};

/**
 * Decorator that provides optimized function calling using JNI reflection.
 * Instead of generating C++ adapters for each function, this uses a shared
 * generic dispatcher that calls Kotlin methods via cached JNI method IDs.
 */
class JSOptimizedFunctionsDecorator : public JSDecorator {
public:
    JSOptimizedFunctionsDecorator(jni::global_ref<jobject> moduleInstance);

    /**
     * Register an optimized function with metadata for JNI reflection.
     * No function pointer needed - we'll use JNI GetMethodID at runtime.
     */
    void registerOptimizedFunction(
        const std::string& name,
        const std::string& methodName,
        const std::string& jniSignature,
        const std::vector<JNIType>& paramTypes,
        JNIType returnType,
        size_t argCount,
        bool enumerable = true
    );

    void decorate(
        jsi::Runtime &runtime,
        jsi::Object &jsObject
    ) override;

private:
    /**
     * Generic dispatcher that uses JNI reflection to call Kotlin methods.
     * This replaces the need for generated C++ adapter functions.
     */
    jsi::Value dispatchOptimizedCall(
        JNIEnv* env,
        jsi::Runtime& rt,
        const jsi::Value* args,
        size_t count,
        const OptimizedFunctionMetadata& metadata
    ) const;

    jni::global_ref<jobject> moduleInstance_;
    std::unordered_map<std::string, OptimizedFunctionMetadata> optimizedFunctions_;
};

} // namespace expo
