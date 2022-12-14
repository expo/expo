// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "types/CppType.h"
#include "types/ExpectedType.h"
#include "types/AnyType.h"

#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <react/bridging/LongLivedObject.h>
#include <react/jni/ReadableNativeArray.h>
#include <memory>
#include <vector>
#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {
class JSIInteropModuleRegistry;

/**
 * A class that holds information about the exported function.
 */
class MethodMetadata {
public:
  /**
   * Function name
   */
  std::string name;
  /**
   * Number of arguments
   */
  int args;
  /*
   * Whether this function is async
   */
  bool isAsync;
  /**
   * Representation of expected argument types.
   */
  std::vector<std::unique_ptr<AnyType>> argTypes;

  MethodMetadata(
    std::weak_ptr<react::LongLivedObjectCollection> longLivedObjectCollection,
    std::string name,
    int args,
    bool isAsync,
    jni::local_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::global_ref<jobject> &&jBodyReference
  );

  MethodMetadata(
    std::weak_ptr<react::LongLivedObjectCollection> longLivedObjectCollection,
    std::string name,
    int args,
    bool isAsync,
    std::vector<std::unique_ptr<AnyType>> &&expectedArgTypes,
    jni::global_ref<jobject> &&jBodyReference
  );

  // We deleted the copy contractor to not deal with transforming the ownership of the `jBodyReference`.
  MethodMetadata(const MethodMetadata &) = delete;

  MethodMetadata(MethodMetadata &&other) = default;

  /**
   * MethodMetadata owns the only reference to the Kotlin function.
   * We have to clean that, cause it's a `global_ref`.
   */
  ~MethodMetadata() {
    if (jBodyReference != nullptr) {
      jBodyReference.release();
    }
  }

  /**
   * Transforms metadata to a jsi::Function.
   *
   * @param runtime
   * @param moduleRegistry
   * @return shared ptr to the jsi::Function that wrapped the underlying Kotlin's function.
   */
  std::shared_ptr<jsi::Function> toJSFunction(
    jsi::Runtime &runtime,
    JSIInteropModuleRegistry *moduleRegistry
  );

  /**
   * Calls the underlying Kotlin function.
   */
  jsi::Value callSync(
    jsi::Runtime &rt,
    JSIInteropModuleRegistry *moduleRegistry,
    const jsi::Value *args,
    size_t count
  );

private:
  /**
   * Reference to one of two java objects - `JNIFunctionBody` or `JNIAsyncFunctionBody`.
   *
   * In case when `isAsync` is `true`, this variable will point to `JNIAsyncFunctionBody`.
   * Otherwise to `JNIFunctionBody`
   */
  jni::global_ref<jobject> jBodyReference;

  /**
   * To not create a jsi::Function always when we need it, we cached that value.
   */
  std::shared_ptr<jsi::Function> body = nullptr;

  std::weak_ptr<react::LongLivedObjectCollection> longLivedObjectCollection_;

  jsi::Function toSyncFunction(jsi::Runtime &runtime, JSIInteropModuleRegistry *moduleRegistry);

  jsi::Function toAsyncFunction(jsi::Runtime &runtime, JSIInteropModuleRegistry *moduleRegistry);

  jsi::Function createPromiseBody(
    jsi::Runtime &runtime,
    JSIInteropModuleRegistry *moduleRegistry,
    jobjectArray globalArgs
  );

  jobjectArray convertJSIArgsToJNI(
    JSIInteropModuleRegistry *moduleRegistry,
    JNIEnv *env,
    jsi::Runtime &rt,
    const jsi::Value *args,
    size_t count
  );
};
} // namespace expo
