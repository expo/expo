// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <react/jni/ReadableNativeArray.h>
#include <memory>
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

  MethodMetadata(
    std::string name,
    int args,
    bool isAsync,
    jni::global_ref<jobject> &&jBodyReference
  );

  // We deleted the copy contractor to not deal with transforming the ownership of the `jBodyReference`.
  MethodMetadata(const MethodMetadata &) = delete;

  /**
   * MethodMetadata owns the only reference to the Kotlin function.
   * We have to clean that, cause it's a `global_ref`.
   */
  ~MethodMetadata() {
    jBodyReference.release();
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

  jsi::Function toSyncFunction(jsi::Runtime &runtime);

  jsi::Function toAsyncFunction(jsi::Runtime &runtime, JSIInteropModuleRegistry *moduleRegistry);

  jsi::Function createPromiseBody(
    jsi::Runtime &runtime,
    JSIInteropModuleRegistry *moduleRegistry,
    folly::dynamic &&args
  );
};
} // namespace expo
