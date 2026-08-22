#pragma once

#include <string>
#include <unordered_map>
#include <functional>
#include <memory>

#include <jsi/jsi.h>

#include "ModuleDefinitionData.h"

namespace jsi = facebook::jsi;

namespace expo {

class ModuleDefinition {
public:
  void Name(std::string name);

  template<typename F>
  void Function(std::string name, F &&fn) {
    auto binding = make_jsi_function_binding(std::forward<F>(fn));

    details::FunctionEntry entry{
      .name = std::move(name),
      .paramCount = binding->arity,
      .hostFn = [binding = std::move(binding)](
        jsi::Runtime &rt,
        const jsi::Value &,
        const jsi::Value *args,
        std::size_t count
      ) -> jsi::Value {
        return binding->call(rt, args, count);
      }
    };

    data_.functions_.push_back(std::move(entry));
  }

  template<typename Getter>
  void Property(
    std::string name,
    Getter &&getter
  ) {
    Property(std::move(name), std::forward<Getter>(getter), nullptr);
  }

  template<typename Getter, typename Setter>
  void Property(
    std::string name,
    Getter &&getter,
    Setter &&setter
  ) {
    auto getBinding = make_jsi_function_binding(std::forward<Getter>(getter));
    auto setBinding = make_jsi_function_binding(std::forward<Setter>(setter));

    details::PropertyEntry entry{
      .name = std::move(name),
      .getter = [getBinding = std::move(getBinding)](
        jsi::Runtime &rt,
        const jsi::Value &,
        const jsi::Value *,
        std::size_t
      ) -> jsi::Value {
        return getBinding->call(rt, nullptr, 0);
      },
      .setter = [setBinding = std::move(setBinding)](
        jsi::Runtime &rt,
        const jsi::Value &,
        const jsi::Value *args,
        std::size_t count
      ) -> jsi::Value {
        setBinding->call(rt, args, count);
        return jsi::Value::undefined();
      }
    };

    data_.properties_.push_back(std::move(entry));
  }

  ModuleDefinitionData build();

private:
  ModuleDefinitionData data_;
};

} // namespace expo
