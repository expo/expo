#include "Serializable.h"

#if WORKLETS_ENABLED

namespace expo {

constexpr jint toStableId(worklets::Serializable::ValueType type) {
  switch (type) {
    case worklets::Serializable::ValueType::UndefinedType:
      return 1;
    case worklets::Serializable::ValueType::NullType:
      return 2;
    case worklets::Serializable::ValueType::BooleanType:
      return 3;
    case worklets::Serializable::ValueType::NumberType:
      return 4;
    case worklets::Serializable::ValueType::BigIntType:
      return 5;
    case worklets::Serializable::ValueType::StringType:
      return 6;
    case worklets::Serializable::ValueType::ObjectType:
      return 7;
    case worklets::Serializable::ValueType::ArrayType:
      return 8;
    case worklets::Serializable::ValueType::MapType:
      return 9;
    case worklets::Serializable::ValueType::SetType:
      return 10;
    case worklets::Serializable::ValueType::WorkletType:
      return 11;
    case worklets::Serializable::ValueType::RemoteFunctionType:
      return 12;
    case worklets::Serializable::ValueType::HandleType:
      return 13;
    case worklets::Serializable::ValueType::HostObjectType:
      return 14;
    case worklets::Serializable::ValueType::HostFunctionType:
      return 15;
    case worklets::Serializable::ValueType::ArrayBufferType:
      return 16;
    case worklets::Serializable::ValueType::TurboModuleLikeType:
      return 17;
    case worklets::Serializable::ValueType::ImportType:
      return 18;
    case worklets::Serializable::ValueType::SynchronizableType:
      return 19;
    case worklets::Serializable::ValueType::CustomType:
      return 20;
    default:
      return 0; // Handle unknown cases
  }
}

jni::local_ref<Serializable::javaobject> Serializable::newJavaInstance(
  jni::local_ref<jni::detail::HybridData> hybridData,
  worklets::Serializable::ValueType valueType
) {
  jint jValueType = toStableId(valueType);
  return Serializable::newObjectJavaArgs(
    std::move(hybridData),
    jValueType
  );
}

Serializable::Serializable(
  const std::shared_ptr<worklets::Serializable> &serializable
) : serializable_(serializable) {}

jni::local_ref<Serializable::javaobject> Serializable::newInstance(
  JSIContext *jsiContext,
  const std::shared_ptr<worklets::Serializable> &serializable
) {
  auto cxxPart = std::make_unique<Serializable>(
    serializable
  );

  auto hybridData = jni::detail::HybridData::create();
  auto javaPart = Serializable::newJavaInstance(
    hybridData,
    serializable->valueType()
  );


  jni::detail::setNativePointer(hybridData, std::move(cxxPart));

  return javaPart;
}

std::shared_ptr<worklets::Serializable> Serializable::getSerializable() {
  return serializable_;
}

} // namespace expo

#endif
