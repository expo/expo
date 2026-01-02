// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSOptimizedFunctionsDecorator.h"
#include "../JSIContext.h"

namespace expo {

JSOptimizedFunctionsDecorator::JSOptimizedFunctionsDecorator(jni::global_ref<jobject> moduleInstance)
    : moduleInstance_(std::move(moduleInstance)) {
}

void JSOptimizedFunctionsDecorator::registerOptimizedFunction(
    const std::string& name,
    const std::string& methodName,
    const std::string& jniSignature,
    const std::vector<JNIType>& paramTypes,
    JNIType returnType,
    size_t argCount,
    bool enumerable
) {
    OptimizedFunctionMetadata metadata{
        name,
        methodName,
        jniSignature,
        paramTypes,
        returnType,
        moduleInstance_,
        nullptr, // cachedMethodId will be initialized on first call
        argCount,
        enumerable
    };

    optimizedFunctions_[name] = metadata;
}

void JSOptimizedFunctionsDecorator::decorate(
    jsi::Runtime &runtime,
    jsi::Object &jsObject
) {
    JNIEnv* env = jni::Environment::current();

    for (auto& [name, metadata] : optimizedFunctions_) {
        // Capture metadata by reference - safe because optimizedFunctions_ lives as long as this decorator
        auto* metadataPtr = &metadata;

        // Create JSI function that uses the shared generic dispatcher
        jsi::Function jsiFunction = jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forUtf8(runtime, name),
            metadata.argCount,
            [this, env, metadataPtr](
                jsi::Runtime& rt,
                const jsi::Value& thisVal,
                const jsi::Value* args,
                size_t count
            ) -> jsi::Value {
                // Call shared generic dispatcher - NO GENERATED C++ CODE
                try {
                    return dispatchOptimizedCall(env, rt, args, count, *metadataPtr);
                } catch (const std::exception& e) {
                    throw jsi::JSError(rt, std::string("OptimizedFunction error in ") +
                                      metadataPtr->name + ": " + e.what());
                }
            }
        );

        // Set property on JS object
        jsObject.setProperty(
            runtime,
            name.c_str(),
            std::move(jsiFunction)
        );
    }
}

/**
 * Shared generic dispatcher that uses JNI reflection to call Kotlin methods.
 * This single function replaces all generated C++ adapter code.
 */
jsi::Value JSOptimizedFunctionsDecorator::dispatchOptimizedCall(
    JNIEnv* env,
    jsi::Runtime& rt,
    const jsi::Value* args,
    size_t count,
    const OptimizedFunctionMetadata& metadata
) const {
    // Validate argument count
    if (count != metadata.argCount) {
        throw std::runtime_error(
            metadata.name + ": Expected " + std::to_string(metadata.argCount) +
            " args, got " + std::to_string(count)
        );
    }

    // Lazy initialization of method ID (cached after first call)
    if (metadata.cachedMethodId == nullptr) {
        jclass clazz = env->GetObjectClass(metadata.moduleInstance.get());
        metadata.cachedMethodId = env->GetMethodID(
            clazz,
            metadata.methodName.c_str(),
            metadata.jniSignature.c_str()
        );

        if (metadata.cachedMethodId == nullptr) {
            throw std::runtime_error(
                "Method not found: " + metadata.methodName +
                " with signature " + metadata.jniSignature
            );
        }

        env->DeleteLocalRef(clazz);
    }

    // Call the method based on return type
    // This switch replaces all the generated adapter code
    switch (metadata.returnType) {
        case JNIType::Double: {
            // Extract parameters
            std::vector<jvalue> jargs(metadata.paramTypes.size());
            for (size_t i = 0; i < metadata.paramTypes.size(); i++) {
                switch (metadata.paramTypes[i]) {
                    case JNIType::Double:
                        jargs[i].d = args[i].asNumber();
                        break;
                    case JNIType::Int:
                        jargs[i].i = static_cast<jint>(args[i].asNumber());
                        break;
                    case JNIType::Boolean:
                        jargs[i].z = args[i].asBool();
                        break;
                    case JNIType::Long:
                        jargs[i].j = static_cast<jlong>(args[i].asNumber());
                        break;
                    case JNIType::Float:
                        jargs[i].f = static_cast<jfloat>(args[i].asNumber());
                        break;
                    default:
                        throw std::runtime_error("Unsupported parameter type");
                }
            }

            // Call method
            jdouble result = env->CallDoubleMethodA(
                metadata.moduleInstance.get(),
                metadata.cachedMethodId,
                jargs.data()
            );

            return jsi::Value(static_cast<double>(result));
        }

        case JNIType::Int: {
            std::vector<jvalue> jargs(metadata.paramTypes.size());
            for (size_t i = 0; i < metadata.paramTypes.size(); i++) {
                switch (metadata.paramTypes[i]) {
                    case JNIType::Double:
                        jargs[i].d = args[i].asNumber();
                        break;
                    case JNIType::Int:
                        jargs[i].i = static_cast<jint>(args[i].asNumber());
                        break;
                    case JNIType::Boolean:
                        jargs[i].z = args[i].asBool();
                        break;
                    case JNIType::Long:
                        jargs[i].j = static_cast<jlong>(args[i].asNumber());
                        break;
                    case JNIType::Float:
                        jargs[i].f = static_cast<jfloat>(args[i].asNumber());
                        break;
                    default:
                        throw std::runtime_error("Unsupported parameter type");
                }
            }

            jint result = env->CallIntMethodA(
                metadata.moduleInstance.get(),
                metadata.cachedMethodId,
                jargs.data()
            );

            return jsi::Value(static_cast<double>(result));
        }

        case JNIType::Boolean: {
            std::vector<jvalue> jargs(metadata.paramTypes.size());
            for (size_t i = 0; i < metadata.paramTypes.size(); i++) {
                switch (metadata.paramTypes[i]) {
                    case JNIType::Double:
                        jargs[i].d = args[i].asNumber();
                        break;
                    case JNIType::Int:
                        jargs[i].i = static_cast<jint>(args[i].asNumber());
                        break;
                    case JNIType::Boolean:
                        jargs[i].z = args[i].asBool();
                        break;
                    case JNIType::Long:
                        jargs[i].j = static_cast<jlong>(args[i].asNumber());
                        break;
                    case JNIType::Float:
                        jargs[i].f = static_cast<jfloat>(args[i].asNumber());
                        break;
                    default:
                        throw std::runtime_error("Unsupported parameter type");
                }
            }

            jboolean result = env->CallBooleanMethodA(
                metadata.moduleInstance.get(),
                metadata.cachedMethodId,
                jargs.data()
            );

            return jsi::Value(static_cast<bool>(result));
        }

        case JNIType::Void: {
            std::vector<jvalue> jargs(metadata.paramTypes.size());
            for (size_t i = 0; i < metadata.paramTypes.size(); i++) {
                switch (metadata.paramTypes[i]) {
                    case JNIType::Double:
                        jargs[i].d = args[i].asNumber();
                        break;
                    case JNIType::Int:
                        jargs[i].i = static_cast<jint>(args[i].asNumber());
                        break;
                    case JNIType::Boolean:
                        jargs[i].z = args[i].asBool();
                        break;
                    case JNIType::Long:
                        jargs[i].j = static_cast<jlong>(args[i].asNumber());
                        break;
                    case JNIType::Float:
                        jargs[i].f = static_cast<jfloat>(args[i].asNumber());
                        break;
                    default:
                        throw std::runtime_error("Unsupported parameter type");
                }
            }

            env->CallVoidMethodA(
                metadata.moduleInstance.get(),
                metadata.cachedMethodId,
                jargs.data()
            );

            return jsi::Value::undefined();
        }

        default:
            throw std::runtime_error("Unsupported return type");
    }
}

} // namespace expo
