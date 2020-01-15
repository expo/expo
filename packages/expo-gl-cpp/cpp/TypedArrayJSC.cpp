#include <stdint.h>
#include <stdlib.h>

#include <JavaScriptCore/JSValueRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSStringRef.h>
#include <JavaScriptCore/JSContextRef.h>

#include "TypedArrayJSI.h"

// CASE I
//
// Mock implementation for cases when JSC does not provide
// JSTypedArray.h (iOS < 10 or android with react-native < 0.59)
// and typed array hack is disabled. Implementaion is provided only
// to prevent linking errors
//
#include "TypedArrayJSCMock.h"

// CASE II (disabled)
//
// Inefficient implementation used when JSC does not provide
// JSTypedArray.h (iOS < 10 or android with react-native < 0.59)
// and typed array hack is enabled.
//
// #include "TypedArrayJSCHack.h"


// CASE III
// Use TypedArray api provided by JSC
//
#if __has_include(<JavaScriptCore/JSTypedArray.h>)
#include <JavaScriptCore/JSTypedArray.h>
#endif

using Type = TypedArray::Type;

template<Type T>
using ContentType = TypedArray::ContentType<T>;

template<Type> struct jscTypeMap;

template<> struct jscTypeMap<Type::Int8Array> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeInt8Array; };
template<> struct jscTypeMap<Type::Int16Array> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeInt16Array; };
template<> struct jscTypeMap<Type::Int32Array> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeInt32Array; };
template<> struct jscTypeMap<Type::Uint8Array> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeUint8Array; };
template<> struct jscTypeMap<Type::Uint8ClampedArray> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeUint8ClampedArray; };
template<> struct jscTypeMap<Type::Uint16Array> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeUint16Array; };
template<> struct jscTypeMap<Type::Uint32Array> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeUint32Array; };
template<> struct jscTypeMap<Type::Float32Array> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeFloat32Array; };
template<> struct jscTypeMap<Type::Float64Array> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeFloat64Array; };
template<> struct jscTypeMap<Type::ArrayBuffer> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeArrayBuffer; };
template<> struct jscTypeMap<Type::None> { static constexpr JSTypedArrayType type = kJSTypedArrayTypeNone; };

template<Type T>
JSTypedArrayType jscArrayType() { return jscTypeMap<T>::type; }

// fake class to extract jsc specific values from jsi::Runtime
class JSCRuntime : public jsi::Runtime{
public:
  JSGlobalContextRef ctx;
  std::atomic<bool> ctxInvalid;

  class JSCTypedArray final : public PointerValue {
  public:
    JSCTypedArray(JSGlobalContextRef ctx, const std::atomic<bool>& ctxInvalid, JSObjectRef obj):
        ctx_(ctx),
        ctxInvalid_(ctxInvalid),
        obj_(obj) {
      JSValueProtect(ctx_, obj_);
    }

    void invalidate() override {
      if (!ctxInvalid_) {
        JSValueUnprotect(ctx_, obj_);
      }
      delete this;
    }

    JSGlobalContextRef ctx_;
    const std::atomic<bool>& ctxInvalid_;
    JSObjectRef obj_;
  };

  // fakeVirtualMethod is forcing compiler to create
  // virtual method table that is necessary to keep ABI
  // compatiblity with real JSCRuntime implementation
  virtual void fakeVirtualMethod() { }
};

class Convert : public jsi::Runtime {
public:
  static jsi::Value toJSI(JSCRuntime* jsc, JSValueRef value) {
    JSObjectRef objRef = JSValueToObject(jsc->ctx, value, nullptr);
    if (!objRef) {
      objRef = JSObjectMake(jsc->ctx, nullptr, nullptr);
    }
    return jsi::Runtime::make<jsi::Object>(new JSCRuntime::JSCTypedArray(jsc->ctx, jsc->ctxInvalid, objRef));
  }

  static JSValueRef toJSC(jsi::Runtime& runtime, const jsi::Value& value) {
    return static_cast<const JSCRuntime::JSCTypedArray*>(
      jsi::Runtime::getPointerValue(value.asObject(runtime)))->obj_;
  }
};

JSCRuntime* getCtxRef(jsi::Runtime& runtime) {
  return reinterpret_cast<JSCRuntime*>(&runtime);
}

template <Type T>
jsi::Value TypedArray::create(jsi::Runtime& runtime, std::vector<ContentType<T>> data) {
  auto jsc = getCtxRef(runtime);
  int byteLength = data.size() * sizeof(ContentType<T>);
  JSTypedArrayType arrayType = jscArrayType<T>();
  if (data.size() != 0) {
    // if (usingTypedArrayHack) {
    //   return Convert::toJSI(
    //           jsc,
    //           JSObjectMakeTypedArrayWithData(jsc->ctx, arrayType, data.data(), byteLength));
    // } else {
    uint8_t *rawData = new uint8_t[byteLength];
    memcpy(rawData, data.data(), byteLength);
    return Convert::toJSI(jsc, JSObjectMakeTypedArrayWithBytesNoCopy(
            jsc->ctx,
            arrayType,
            rawData,
            byteLength,
            [](void *data, void *ctx) { delete[] reinterpret_cast<uint8_t*>(data); },
            nullptr,
            nullptr));

  } else {
    // if (usingTypedArrayHack) {
    //   return Convert::toJSI(jsc, JSObjectMakeTypedArrayWithHack(jsc->ctx, arrayType, 0));
    // } else {
    return Convert::toJSI(jsc, JSObjectMakeTypedArray(jsc->ctx, arrayType, 0, nullptr));
  }
}

void TypedArray::updateWithData(jsi::Runtime& runtime, const jsi::Value& jsValue, std::vector<uint8_t> data) {
  auto jsc = getCtxRef(runtime);
  JSObjectRef jsObjectRef = const_cast<JSObjectRef>(Convert::toJSC(runtime, jsValue));
  size_t byteLength = JSObjectGetTypedArrayByteLength(jsc->ctx, jsObjectRef, nullptr);
  if (byteLength < data.size()) {
    throw std::runtime_error("TypedArray to small to fit provided data");
  }
  void* ptr = JSObjectGetTypedArrayBytesPtr(jsc->ctx, jsObjectRef, nullptr);
  std::copy(data.begin(), data.end(), reinterpret_cast<uint8_t*>(ptr));
}

template <Type T>
std::vector<ContentType<T>> TypedArray::fromJSValue(jsi::Runtime& runtime, const jsi::Value& jsVal) {
  auto jsc = getCtxRef(runtime);
  // if (usingTypedArrayHack) {
  //   size_t byteLength;
  //   uint8_t* data = reinterpret_cast<uint8_t*>(
  //           JSObjectGetTypedArrayDataMalloc(
  //             jsc->ctx, const_cast<JSObjectRef>(Convert::toJSC(runtime, jsVal)),
  //             &byteLength));
  //   auto start = reinterpret_cast<ContentType<T>*>(data);
  //   auto end = reinterpret_cast<ContentType<T>*>(data + byteLength);
  //   std::vector<ContentType<T>> result(start, end);
  //   free(data);
  //   return result;
  // } else {
  uint8_t *data = nullptr;
  size_t byteLength = 0;
  size_t byteOffset = 0;

  JSObjectRef jsObject = const_cast<JSObjectRef>(Convert::toJSC(runtime, jsVal));
  JSTypedArrayType type = JSValueGetTypedArrayType(jsc->ctx, Convert::toJSC(runtime, jsVal), nullptr);
  if (type == kJSTypedArrayTypeArrayBuffer) {
    byteLength = JSObjectGetArrayBufferByteLength(jsc->ctx, jsObject, nullptr);
    data = reinterpret_cast<uint8_t*>(JSObjectGetArrayBufferBytesPtr(jsc->ctx, jsObject, nullptr));
    byteOffset = 0;
  } else if (type != kJSTypedArrayTypeNone) {
    byteLength = JSObjectGetTypedArrayByteLength(jsc->ctx, jsObject, nullptr);
    data = reinterpret_cast<uint8_t*>(JSObjectGetTypedArrayBytesPtr(jsc->ctx, jsObject, nullptr));
    byteOffset = JSObjectGetTypedArrayByteOffset(jsc->ctx, jsObject, nullptr);
  }

  if (!data) {
    throw std::runtime_error("Invalid typed array data");
  }
  assert(byteLength % sizeof(ContentType<T>) == 0);
  auto start = reinterpret_cast<ContentType<T>*>(data + byteOffset);
  auto end = reinterpret_cast<ContentType<T>*>(data + byteOffset + byteLength);
  return std::vector<ContentType<T>>(start, end);
}

std::vector<uint8_t> TypedArray::rawFromJSValue(jsi::Runtime& runtime, const jsi::Value& val) {
  return fromJSValue<Type::Uint8Array>(runtime, val);
}

Type TypedArray::typeFromJSValue(jsi::Runtime& runtime, const jsi::Value& jsVal) {
  auto jsc = getCtxRef(runtime);
  JSTypedArrayType type = JSValueGetTypedArrayType(jsc->ctx, Convert::toJSC(runtime, jsVal), nullptr);
  switch (type) {
    case kJSTypedArrayTypeInt8Array: return Type::Int8Array;
    case kJSTypedArrayTypeInt16Array: return Type::Int16Array;
    case kJSTypedArrayTypeInt32Array: return Type::Int32Array;
    case kJSTypedArrayTypeUint8Array: return Type::Uint8Array;
    case kJSTypedArrayTypeUint8ClampedArray: return Type::Uint8ClampedArray;
    case kJSTypedArrayTypeUint16Array: return Type::Uint16Array;
    case kJSTypedArrayTypeUint32Array: return Type::Uint32Array;
    case kJSTypedArrayTypeFloat32Array: return Type::Float32Array;
    case kJSTypedArrayTypeFloat64Array: return Type::Float64Array;
    case kJSTypedArrayTypeArrayBuffer: return Type::ArrayBuffer;
    default: return Type::None;
  }

}

// If templates are defined inside cpp file they need to be explicitly instantiated
template jsi::Value TypedArray::create<TypedArray::Int32Array>(jsi::Runtime&, std::vector<int32_t>);
template jsi::Value TypedArray::create<TypedArray::Uint32Array>(jsi::Runtime&, std::vector<uint32_t>);
template jsi::Value TypedArray::create<TypedArray::Float32Array>(jsi::Runtime&, std::vector<float>);

template std::vector<int32_t> TypedArray::fromJSValue<TypedArray::Int32Array>(jsi::Runtime&, const jsi::Value& jsVal);
template std::vector<uint32_t> TypedArray::fromJSValue<TypedArray::Uint32Array>(jsi::Runtime&, const jsi::Value& jsVal);
template std::vector<float> TypedArray::fromJSValue<TypedArray::Float32Array>(jsi::Runtime&, const jsi::Value& jsVal);
