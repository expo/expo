// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSOptimizedFunctionsDecorator.h"
#include "../JSIContext.h"

namespace expo {

JSOptimizedFunctionsDecorator::JSOptimizedFunctionsDecorator(jni::global_ref<jobject> moduleInstance)
    : moduleInstance_(std::move(moduleInstance)) {
}

void JSOptimizedFunctionsDecorator::registerOptimizedFunction(
    const std::string& name,
    OptimizedFunctionPtr functionPtr,
    size_t argCount,
    bool enumerable
) {
    OptimizedFunctionMetadata metadata{
        name,
        functionPtr,
        moduleInstance_,
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
        // Create JSI function that directly calls the optimized adapter
        jsi::Function jsiFunction = jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forUtf8(runtime, name),
            metadata.argCount,
            [env, metadata](
                jsi::Runtime& rt,
                const jsi::Value& thisVal,
                const jsi::Value* args,
                size_t count
            ) -> jsi::Value {
                // Direct call to generated adapter - NO BOXING
                try {
                    return metadata.functionPtr(
                        env,
                        metadata.moduleInstance.get(),
                        rt,
                        args,
                        count
                    );
                } catch (const std::exception& e) {
                    throw jsi::JSError(rt, std::string("OptimizedFunction error in ") +
                                      metadata.name + ": " + e.what());
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

} // namespace expo
