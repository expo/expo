#pragma once

namespace reanimated {

enum class ValueType {
  UndefinedType,
  NullType,
  BoolType,
  NumberType,
  StringType,
  ObjectType, /* frozen object, can only be set and never modified */
  ArrayType, /* frozen array, can only be set and never modified */
  RemoteObjectType, /* object that can be instantiated on host side and modified on the remote (worklet) side */
  MutableValueType, /* object with 'value' property that can be updated and read from any thread */
  HostFunctionType, /* function that will be executed asynchronously on the host runtime */
  WorkletFunctionType, /* function that gets run on the UI thread */
};

class ShareableValue;
class MutableValue;
class RemoteObject;
class RemoteObjectInitializer;
class NativeReanimatedModule;

}
