#pragma once

#include <string>
#include <unordered_map>
#include <functional>
#include <memory>

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

class ModuleDefinition;

namespace details {

struct FunctionEntry {
  std::string name;
  std::size_t paramCount;
  jsi::HostFunctionType hostFn;
  bool enumerable = true;
};

struct PropertyEntry {
  std::string name;
  jsi::HostFunctionType getter;
  jsi::HostFunctionType setter;
};

} // namespace details

class ModuleDefinitionData {
public:
  [[nodiscard]] std::string_view name() const;

  void decorate(jsi::Runtime &rt, jsi::Object &object) const;

private:
  friend class ModuleDefinition;

  std::string name_;
  std::vector<details::FunctionEntry> functions_;
  std::vector<details::PropertyEntry> properties_;
};



} // namespace expo