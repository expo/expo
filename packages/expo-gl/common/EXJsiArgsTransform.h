#pragma once

#include "pch.h"

#include <type_traits>

#include "EXJsiUtils.h"
#include "EXWebGLRenderer.h"
#include "EXTypedArrayApi.h"

namespace expo {
namespace gl_cpp {

//
// unpackArg function is set of function overload and explicit specialization used to convert
// raw jsi::Value into specified (at compile time) type.
//
// Why we need to mix explicit specializations and function overloads?
// On the one hand we need to provide implementations for a range of types (e.g. all integers,
// all floats) so we can't do this with explicit specializations only, on the other hand we can't
// use only function overloads because only difference in signature is caused by return type which
// does not affect overloading.
//
// To prevent ambiguity all specializations should be directly under first unimplemented declaration
// of this function, and all new function overloads should be implemented under specializations
//

template<typename T>
inline constexpr bool is_integral_v =
  std::is_integral_v<T> && !std::is_same_v<bool, T> && !std::is_same_v<GLboolean, T>;

template<typename T>
inline constexpr bool is_supported_vector = std::is_same_v<std::vector<uint32_t>, T> ||
                                            std::is_same_v<std::vector<int32_t>, T> ||
                                            std::is_same_v<std::vector<float>, T>;

// if T = EXWebGLClass then return_type = EXGLObjectId else return_type = T
template<typename T>
using type_map = typename std::conditional<std::is_same_v<EXWebGLClass, T>, EXGLObjectId, T>::type;

template<typename T>
inline std::enable_if_t<
  !(is_integral_v<T> || std::is_floating_point_v<T> || is_supported_vector<T>),
  type_map<T>>
unpackArg(jsi::Runtime &runtime, const jsi::Value *jsArgv);

//
// unpackArgs explicit specializations
//

template<>
inline bool unpackArg<bool>(jsi::Runtime &runtime, const jsi::Value *jsArgv) {
  if (jsArgv->isBool()) {
    return jsArgv->getBool();
  } else if (jsArgv->isNull() || jsArgv->isUndefined()) {
    return false;
  } else if (jsArgv->isNumber()) {
    return jsArgv->getNumber() != 0;
  }
  throw std::runtime_error("value is not a boolean");
}

template<>
inline const void *unpackArg<const void *>(jsi::Runtime &runtime, const jsi::Value *jsArgv) {
  if (jsArgv->isNumber()) {
    return reinterpret_cast<const void *>(static_cast<uint64_t>(jsArgv->getNumber()));
  } else if (jsArgv->isNull() || jsArgv->isUndefined()) {
    return nullptr;
  }
  throw std::runtime_error("value is not a correct offset");
}

template<>
inline GLboolean unpackArg<GLboolean>(jsi::Runtime &runtime, const jsi::Value *jsArgv) {
  return unpackArg<bool>(runtime, jsArgv) ? GL_TRUE : GL_FALSE;
}

template<>
inline const jsi::Value &unpackArg<const jsi::Value &>(
  jsi::Runtime &runtime,
  const jsi::Value *jsArgv) {
  return *jsArgv;
}

template<>
inline std::string unpackArg<std::string>(jsi::Runtime &runtime, const jsi::Value *jsArgv) {
  return jsArgv->asString(runtime).utf8(runtime);
}

template<>
inline jsi::Object unpackArg<jsi::Object>(jsi::Runtime &runtime, const jsi::Value *jsArgv) {
  return jsArgv->asObject(runtime);
}

template<>
inline jsi::Array unpackArg<jsi::Array>(jsi::Runtime &runtime, const jsi::Value *jsArgv) {
  return jsArgv->asObject(runtime).asArray(runtime);
}

template<>
inline TypedArrayBase unpackArg<TypedArrayBase>(jsi::Runtime &runtime, const jsi::Value *jsArgv) {
  return getTypedArray(runtime, jsArgv->asObject(runtime));
}

template<>
inline jsi::ArrayBuffer unpackArg<jsi::ArrayBuffer>(
  jsi::Runtime &runtime,
  const jsi::Value *jsArgv) {
  if (!jsArgv->isObject() || !jsArgv->asObject(runtime).isArrayBuffer(runtime)) {
    throw std::runtime_error("value is not an ArrayBuffer");
  }
  return jsArgv->asObject(runtime).getArrayBuffer(runtime);
}

template<>
inline EXGLObjectId unpackArg<EXWebGLClass>(jsi::Runtime &runtime, const jsi::Value *jsArgv) {
  if (!jsArgv->isObject() || !jsArgv->asObject(runtime).hasProperty(runtime, "id")) {
    return 0;
  }
  return static_cast<EXGLObjectId>(
    jsArgv->asObject(runtime).getProperty(runtime, "id").asNumber());
}

//
// unpackArgs function overloads
//

template<typename T>
inline std::enable_if_t<is_integral_v<T>, T> unpackArg(
  jsi::Runtime &runtime,
  const jsi::Value *jsArgv) {
  if (jsArgv->isNumber()) {
    return jsArgv->getNumber(); // TODO: add api to jsi to handle integers more efficiently
  } else if (jsArgv->isNull() || jsArgv->isUndefined()) {
    return 0;
  } else if (jsArgv->isBool()) {
    // this case should not be necessary but one of the ncl threejs examples relies on this
    // behaviour
    return jsArgv->getBool() ? GL_TRUE : GL_FALSE;
  }
  return jsArgv->asNumber();
}

template<typename T>
inline std::enable_if_t<std::is_floating_point_v<T>, T> unpackArg(
  jsi::Runtime &runtime,
  const jsi::Value *jsArgv) {
  if (jsArgv->isNumber()) {
    return jsArgv->getNumber();
  } else if (jsArgv->isNull() || jsArgv->isUndefined()) {
    return 0;
  }
  return jsArgv->asNumber();
}

template<typename T>
inline std::enable_if_t<is_supported_vector<T>, T> unpackArg(
  jsi::Runtime &runtime,
  const jsi::Value *jsArgv) {
  auto jsObj = jsArgv->asObject(runtime);
  if (jsObj.isArray(runtime)) {
    return jsArrayToVector<typename T::value_type>(runtime, jsObj.asArray(runtime));
  } else if (isTypedArray(runtime, jsObj)) {
    if constexpr (std::is_same_v<typename T::value_type, uint32_t>) {
      return getTypedArray(runtime, std::move(jsObj))
        .as<TypedArrayKind::Uint32Array>(runtime)
        .toVector(runtime);
    } else if constexpr (std::is_same_v<typename T::value_type, int32_t>) {
      return getTypedArray(runtime, std::move(jsObj))
        .as<TypedArrayKind::Int32Array>(runtime)
        .toVector(runtime);
    } else if constexpr (std::is_same_v<typename T::value_type, float>) {
      return getTypedArray(runtime, std::move(jsObj))
        .as<TypedArrayKind::Float32Array>(runtime)
        .toVector(runtime);
    }
  }
  throw std::runtime_error("unsupported type");
}

template<TypedArrayKind T>
inline TypedArray<T> unpackArg(jsi::Runtime &runtime, const jsi::Value *jsArgv) {
  return getTypedArray(runtime, jsArgv->asObject(runtime)).as<T>(runtime);
}

namespace methodHelper {

template<typename... T, size_t... I>
inline std::tuple<T...> unpackArgsDirect(
  jsi::Runtime &runtime,
  const jsi::Value *jsArgv,
  std::index_sequence<I...>) {
  return std::tuple<T...>{unpackArg<T>(runtime, jsArgv + I)...};
}

} // namespace methodHelper

template<typename... T>
inline std::tuple<T...> unpackArgs(jsi::Runtime &runtime, const jsi::Value *jsArgv, size_t argc) {
  if (argc < sizeof...(T)) {
    throw std::runtime_error("EXGL: Too few arguments");
  }
  return methodHelper::unpackArgsDirect<T...>(
    runtime, jsArgv, std::make_index_sequence<sizeof...(T)>());
}

template<>
inline std::tuple<> unpackArgs(jsi::Runtime &, const jsi::Value *, size_t) {
  return std::tuple<>();
}

template<typename... T>
auto generateNativeMethod(
  jsi::Runtime &runtime,
  void fn(T...),
  const jsi::Value *jsArgv,
  size_t argc) {
  auto args = unpackArgs<T...>(runtime, jsArgv, argc);
  return [fn, args = std::move(args)]() mutable { std::apply(fn, std::move(args)); };
}
} // namespace gl_cpp
} // namespace expo
