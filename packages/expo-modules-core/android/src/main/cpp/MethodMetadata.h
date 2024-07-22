// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "types/CppType.h"
#include "types/ExpectedType.h"
#include "types/AnyType.h"

#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <react/jni/ReadableNativeArray.h>
#include <memory>
#include <vector>
#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {
class JSIContext;

/**
 * A class that holds information about the exported function.
 */
class MethodMetadata : public std::enable_shared_from_this<MethodMetadata> {
public:
  /**
   * Function name
   */
  std::string name;
  /**
   * Whether this function takes owner
   */
  bool takesOwner;
  /**
   * Whether this function is async
   */
  bool isAsync;
  /**
   * Representation of expected argument types.
   */
  std::vector<std::unique_ptr<AnyType>> argTypes;

  MethodMetadata(
    std::string name,
    bool takesOwner,
    bool isAsync,
    jni::local_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::global_ref<jobject> &&jBodyReference
  );

  MethodMetadata(
    std::string name,
    bool takesOwner,
    bool isAsync,
    std::vector<std::unique_ptr<AnyType>> &&expectedArgTypes,
    jni::global_ref<jobject> &&jBodyReference
  );

  // We deleted the copy contractor to not deal with transforming the ownership of the `jBodyReference`.
  MethodMetadata(const MethodMetadata &) = delete;

  MethodMetadata(MethodMetadata &&other) = default;

  /**
   * Transforms metadata to a jsi::Function.
   *
   * @param runtime
   * @return shared ptr to the jsi::Function that wrapped the underlying Kotlin's function.
   */
  std::shared_ptr<jsi::Function> toJSFunction(
    jsi::Runtime &runtime
  );

  /**
   * Calls the underlying Kotlin function.
   */
  jsi::Value callSync(
    jsi::Runtime &rt,
    const jsi::Value &thisValue,
    const jsi::Value *args,
    size_t count
  );

  jni::local_ref<jobject> callJNISync(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jsi::Value &thisValue,
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

  jsi::Function toSyncFunction(jsi::Runtime &runtime);

  jsi::Function toAsyncFunction(jsi::Runtime &runtime);

  jsi::Function createPromiseBody(
    jsi::Runtime &runtime,
    jobjectArray globalArgs
  );

  jobjectArray convertJSIArgsToJNI(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jsi::Value &thisValue,
    const jsi::Value *args,
    size_t count
  );
};
} // namespace expo
