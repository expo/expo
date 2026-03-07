#pragma once

// Minimal JSI type stubs for standalone compilation (testing/CI).
// When building as part of React Native, the real jsi/jsi.h is used instead.
// This file is only included when EXPO_RUST_JSI_STANDALONE is defined.

#include <string>
#include <vector>
#include <memory>
#include <functional>

namespace facebook {
namespace jsi {

class Runtime;
class Value;
class Object;
class Array;
class String;
class PropNameID;
class Function;

class HostObject {
public:
  virtual ~HostObject() = default;
  virtual Value get(Runtime& rt, const PropNameID& name);
  virtual void set(Runtime& rt, const PropNameID& name, const Value& value);
  virtual std::vector<PropNameID> getPropertyNames(Runtime& rt);
};

} // namespace jsi
} // namespace facebook
