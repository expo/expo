#include "TypedArrayApi.h"

#include <unordered_map>

namespace expo {
namespace gl_cpp {

template <TypedArrayKind T>
using ContentType = typename typedArrayTypeMap<T>::type;

enum class Prop {
  Buffer, // "buffer"
  Constructor, // "constructor"
  Name, // "name"
  Proto, // "__proto__"
  Length, // "length"
  ByteLength, // "byteLength"
  ByteOffset, // "offset"
  IsView, // "isView"
  ArrayBuffer, // "ArrayBuffer"
  Int8Array, // "Int8Array"
  Int16Array, // "Int16Array"
  Int32Array, // "Int32Array"
  Uint8Array, // "Uint8Array"
  Uint8ClampedArray, // "Uint8ClampedArray"
  Uint16Array, // "Uint16Array"
  Uint32Array, // "Uint32Array"
  Float32Array, // "Float32Array"
  Float64Array, // "Float64Array"
};

class PropNameIDCache {
 public:
  const jsi::PropNameID &get(jsi::Runtime &runtime, Prop prop) {
    auto key = reinterpret_cast<uintptr_t>(&runtime);
    if (this->props.find(key) == this->props.end()) {
      this->props[key] = std::unordered_map<Prop, std::unique_ptr<jsi::PropNameID>>();
    }
    if (!this->props[key][prop]) {
      this->props[key][prop] = std::make_unique<jsi::PropNameID>(createProp(runtime, prop));
    }
    return *(this->props[key][prop]);
  }

  const jsi::PropNameID &getConstructorNameProp(jsi::Runtime &runtime, TypedArrayKind kind);

  void invalidate(uintptr_t key) {
    if (props.find(key) != props.end()) {
      props[key].clear();
    }
  }

 private:
  std::unordered_map<uintptr_t, std::unordered_map<Prop, std::unique_ptr<jsi::PropNameID>>> props;

  jsi::PropNameID createProp(jsi::Runtime &runtime, Prop prop);
};

PropNameIDCache propNameIDCache;

InvalidateCacheOnDestroy::InvalidateCacheOnDestroy(jsi::Runtime &runtime) {
  key = reinterpret_cast<uintptr_t>(&runtime);
}
InvalidateCacheOnDestroy::~InvalidateCacheOnDestroy() {
  propNameIDCache.invalidate(key);
}

TypedArrayKind getTypedArrayKindForName(const std::string &name);

TypedArrayBase::TypedArrayBase(jsi::Runtime &runtime, size_t size, TypedArrayKind kind)
    : TypedArrayBase(
          runtime,
          runtime.global()
              .getProperty(runtime, propNameIDCache.getConstructorNameProp(runtime, kind))
              .asObject(runtime)
              .asFunction(runtime)
              .callAsConstructor(runtime, {static_cast<double>(size)})
              .asObject(runtime)) {}

TypedArrayBase::TypedArrayBase(jsi::Runtime &runtime, const jsi::Object &obj)
    : jsi::Object(jsi::Value(runtime, obj).asObject(runtime)) {}

TypedArrayKind TypedArrayBase::getKind(jsi::Runtime &runtime) const {
  auto constructorName = this->getProperty(runtime, propNameIDCache.get(runtime, Prop::Constructor))
                             .asObject(runtime)
                             .getProperty(runtime, propNameIDCache.get(runtime, Prop::Name))
                             .asString(runtime)
                             .utf8(runtime);
  return getTypedArrayKindForName(constructorName);
};

size_t TypedArrayBase::size(jsi::Runtime &runtime) const {
  return getProperty(runtime, propNameIDCache.get(runtime, Prop::Length)).asNumber();
}

size_t TypedArrayBase::length(jsi::Runtime &runtime) const {
  return getProperty(runtime, propNameIDCache.get(runtime, Prop::Length)).asNumber();
}

size_t TypedArrayBase::byteLength(jsi::Runtime &runtime) const {
  return getProperty(runtime, propNameIDCache.get(runtime, Prop::ByteLength)).asNumber();
}

size_t TypedArrayBase::byteOffset(jsi::Runtime &runtime) const {
  return getProperty(runtime, propNameIDCache.get(runtime, Prop::ByteOffset)).asNumber();
}

bool TypedArrayBase::hasBuffer(jsi::Runtime &runtime) const {
  auto buffer = getProperty(runtime, propNameIDCache.get(runtime, Prop::Buffer));
  return buffer.isObject() && buffer.asObject(runtime).isArrayBuffer(runtime);
}

std::vector<uint8_t> TypedArrayBase::toVector(jsi::Runtime &runtime) {
  auto start = reinterpret_cast<uint8_t *>(getBuffer(runtime).data(runtime) + byteOffset(runtime));
  auto end = start + byteLength(runtime);
  return std::vector<uint8_t>(start, end);
}

jsi::ArrayBuffer TypedArrayBase::getBuffer(jsi::Runtime &runtime) const {
  auto buffer = getProperty(runtime, propNameIDCache.get(runtime, Prop::Buffer));
  if (buffer.isObject() && buffer.asObject(runtime).isArrayBuffer(runtime)) {
    return buffer.asObject(runtime).getArrayBuffer(runtime);
  } else {
    throw std::runtime_error("no ArrayBuffer attached");
  }
}

bool isTypedArray(jsi::Runtime &runtime, const jsi::Object &jsObj) {
  auto jsVal = runtime.global()
                   .getProperty(runtime, propNameIDCache.get(runtime, Prop::ArrayBuffer))
                   .asObject(runtime)
                   .getProperty(runtime, propNameIDCache.get(runtime, Prop::IsView))
                   .asObject(runtime)
                   .asFunction(runtime)
                   .callWithThis(runtime, runtime.global(), {jsi::Value(runtime, jsObj)});
  if (jsVal.isBool()) {
    return jsVal.getBool();
  } else {
    throw std::runtime_error("value is not a boolean");
  }
}

TypedArrayBase getTypedArray(jsi::Runtime &runtime, const jsi::Object &jsObj) {
  auto jsVal = runtime.global()
                   .getProperty(runtime, propNameIDCache.get(runtime, Prop::ArrayBuffer))
                   .asObject(runtime)
                   .getProperty(runtime, propNameIDCache.get(runtime, Prop::IsView))
                   .asObject(runtime)
                   .asFunction(runtime)
                   .callWithThis(runtime, runtime.global(), {jsi::Value(runtime, jsObj)});
  if (jsVal.isBool()) {
    return TypedArrayBase(runtime, jsObj);
  } else {
    throw std::runtime_error("value is not a boolean");
  }
}

std::vector<uint8_t> arrayBufferToVector(jsi::Runtime &runtime, jsi::Object &jsObj) {
  if (!jsObj.isArrayBuffer(runtime)) {
    throw std::runtime_error("Object is not an ArrayBuffer");
  }
  auto jsArrayBuffer = jsObj.getArrayBuffer(runtime);

  uint8_t *dataBlock = jsArrayBuffer.data(runtime);
  size_t blockSize =
      jsArrayBuffer.getProperty(runtime, propNameIDCache.get(runtime, Prop::ByteLength)).asNumber();
  return std::vector<uint8_t>(dataBlock, dataBlock + blockSize);
}

void arrayBufferUpdate(
    jsi::Runtime &runtime,
    jsi::ArrayBuffer &buffer,
    std::vector<uint8_t> data,
    size_t offset) {
  uint8_t *dataBlock = buffer.data(runtime);
  size_t blockSize = buffer.size(runtime);
  if (data.size() > blockSize) {
    throw jsi::JSError(runtime, "ArrayBuffer is to small to fit data");
  }
  std::copy(data.begin(), data.end(), dataBlock + offset);
}

template <TypedArrayKind T>
TypedArray<T>::TypedArray(jsi::Runtime &runtime, size_t size) : TypedArrayBase(runtime, size, T){};

template <TypedArrayKind T>
TypedArray<T>::TypedArray(jsi::Runtime &runtime, std::vector<ContentType<T>> data)
    : TypedArrayBase(runtime, data.size(), T) {
  update(runtime, data);
};

template <TypedArrayKind T>
TypedArray<T>::TypedArray(TypedArrayBase &&base) : TypedArrayBase(std::move(base)) {}

template <TypedArrayKind T>
std::vector<ContentType<T>> TypedArray<T>::toVector(jsi::Runtime &runtime) {
  auto start =
      reinterpret_cast<ContentType<T> *>(getBuffer(runtime).data(runtime) + byteOffset(runtime));
  auto end = start + size(runtime);
  return std::vector<ContentType<T>>(start, end);
}

template <TypedArrayKind T>
void TypedArray<T>::update(jsi::Runtime &runtime, const std::vector<ContentType<T>> &data) {
  if (data.size() != size(runtime)) {
    throw jsi::JSError(runtime, "TypedArray can only be updated with a vector of the same size");
  }
  uint8_t *rawData = getBuffer(runtime).data(runtime) + byteOffset(runtime);
  std::copy(data.begin(), data.end(), reinterpret_cast<ContentType<T> *>(rawData));
}

const jsi::PropNameID &PropNameIDCache::getConstructorNameProp(
    jsi::Runtime &runtime,
    TypedArrayKind kind) {
  switch (kind) {
    case TypedArrayKind::Int8Array:
      return get(runtime, Prop::Int8Array);
    case TypedArrayKind::Int16Array:
      return get(runtime, Prop::Int16Array);
    case TypedArrayKind::Int32Array:
      return get(runtime, Prop::Int32Array);
    case TypedArrayKind::Uint8Array:
      return get(runtime, Prop::Uint8Array);
    case TypedArrayKind::Uint8ClampedArray:
      return get(runtime, Prop::Uint8ClampedArray);
    case TypedArrayKind::Uint16Array:
      return get(runtime, Prop::Uint16Array);
    case TypedArrayKind::Uint32Array:
      return get(runtime, Prop::Uint32Array);
    case TypedArrayKind::Float32Array:
      return get(runtime, Prop::Float32Array);
    case TypedArrayKind::Float64Array:
      return get(runtime, Prop::Float64Array);
  }
}

jsi::PropNameID PropNameIDCache::createProp(jsi::Runtime &runtime, Prop prop) {
  auto create = [&](const std::string &propName) {
    return jsi::PropNameID::forUtf8(runtime, propName);
  };
  switch (prop) {
    case Prop::Buffer:
      return create("buffer");
    case Prop::Constructor:
      return create("constructor");
    case Prop::Name:
      return create("name");
    case Prop::Proto:
      return create("__proto__");
    case Prop::Length:
      return create("length");
    case Prop::ByteLength:
      return create("byteLength");
    case Prop::ByteOffset:
      return create("byteOffset");
    case Prop::IsView:
      return create("isView");
    case Prop::ArrayBuffer:
      return create("ArrayBuffer");
    case Prop::Int8Array:
      return create("Int8Array");
    case Prop::Int16Array:
      return create("Int16Array");
    case Prop::Int32Array:
      return create("Int32Array");
    case Prop::Uint8Array:
      return create("Uint8Array");
    case Prop::Uint8ClampedArray:
      return create("Uint8ClampedArray");
    case Prop::Uint16Array:
      return create("Uint16Array");
    case Prop::Uint32Array:
      return create("Uint32Array");
    case Prop::Float32Array:
      return create("Float32Array");
    case Prop::Float64Array:
      return create("Float64Array");
  }
}

std::unordered_map<std::string, TypedArrayKind> nameToKindMap = {
    {"Int8Array", TypedArrayKind::Int8Array},
    {"Int16Array", TypedArrayKind::Int16Array},
    {"Int32Array", TypedArrayKind::Int32Array},
    {"Uint8Array", TypedArrayKind::Uint8Array},
    {"Uint8ClampedArray", TypedArrayKind::Uint8ClampedArray},
    {"Uint16Array", TypedArrayKind::Uint16Array},
    {"Uint32Array", TypedArrayKind::Uint32Array},
    {"Float32Array", TypedArrayKind::Float32Array},
    {"Float64Array", TypedArrayKind::Float64Array},
};

TypedArrayKind getTypedArrayKindForName(const std::string &name) {
  return nameToKindMap.at(name);
}

template class TypedArray<TypedArrayKind::Int8Array>;
template class TypedArray<TypedArrayKind::Int16Array>;
template class TypedArray<TypedArrayKind::Int32Array>;
template class TypedArray<TypedArrayKind::Uint8Array>;
template class TypedArray<TypedArrayKind::Uint8ClampedArray>;
template class TypedArray<TypedArrayKind::Uint16Array>;
template class TypedArray<TypedArrayKind::Uint32Array>;
template class TypedArray<TypedArrayKind::Float32Array>;
template class TypedArray<TypedArrayKind::Float64Array>;

} // namespace gl_cpp
} // namespace expo
