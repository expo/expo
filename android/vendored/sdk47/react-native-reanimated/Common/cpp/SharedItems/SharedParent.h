#pragma once

namespace reanimated {

enum class ValueType {
  UndefinedType,
  NullType,
  BoolType,
  NumberType,
  StringType,
  RemoteObjectType, // object that can be instantiated on host side and modified
                    // on the remote (worklet) side
  MutableValueType, // object with 'value' property that can be updated and read
                    // from any thread
  HostFunctionType, // function that will be executed asynchronously on the host
                    // runtime
  WorkletFunctionType, // function that gets run on the UI thread
  FrozenObjectType, // frozen object, can only be set and never modified
  FrozenArrayType, // frozen array, can only be set and never modified
};

class ShareableValue;
class MutableValue;
class RemoteObject;
class NativeReanimatedModule;

} // namespace reanimated
