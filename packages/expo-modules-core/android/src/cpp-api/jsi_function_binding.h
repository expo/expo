#pragma once

#include <tuple>
#include <type_traits>
#include <utility>
#include <memory>

#include <jsi/jsi.h>

#include "callable_traits.h"
#include "convert_to_jsi.h"
#include "convert_args.h"

namespace jsi = facebook::jsi;

namespace expo {

template<typename F>
class jsi_function_binding {
public:
  using Callable = callable_traits<std::remove_cvref_t<F>>;
  using ReturnType = typename Callable::return_type;
  using ArgsTuple = typename Callable::args_tuple;

  explicit jsi_function_binding(F fn) : fn_(std::move(fn)) {}

  static constexpr std::size_t arity = Callable::arity;

  /**
   * Convert raw JSI arguments, invoke the stored callable, and return
   * the result as a jsi::Value.
   */
  jsi::Value call(
    jsi::Runtime &rt,
    const jsi::Value *args,
    std::size_t count
  ) {
    return dispatcher<ArgsTuple>::call(*this, rt, args, count);
  }

  /**
   * Produce a jsi::Function (host function) that can be installed on a
   * JavaScript object. Calling it from JS will automatically convert
   * the arguments, invoke the C++ lambda, and return the result.
   */
  jsi::Function toJSFunction(jsi::Runtime &rt, const char *name) {
    return jsi::Function::createFromHostFunction(
      rt,
      jsi::PropNameID::forAscii(rt, name),
      arity,
      [this](
        jsi::Runtime &rt,
        const jsi::Value &self,
        const jsi::Value *args,
        std::size_t count
      ) -> jsi::Value {
        return this->call(rt, args, count);
      }
    );
  }

private:
  F fn_;

  template<typename... Args>
  jsi::Value dispatch(
    jsi::Runtime &rt,
    std::tuple<Args...> &args
  ) {
    constexpr bool isVoid = std::is_void<ReturnType>::value;

    if constexpr (!isVoid) {
      ReturnType result = std::apply(fn_, args);
      return convert_to_jsi<ReturnType>::convert(rt, std::move(result));
    } else {
      std::apply(fn_, args);
      return jsi::Value::undefined();
    }
  }

  template<typename Tuple>
  struct dispatcher;

  template<typename... Args>
  struct dispatcher<std::tuple<Args...>> {
    static jsi::Value call(
      jsi_function_binding &binding,
      jsi::Runtime &rt,
      const jsi::Value *args,
      std::size_t count
    ) {
      auto converted = convert_args<Args...>(rt, args, count);
      return binding.dispatch(
        rt,
        converted
      );
    }
  };
};

template<typename F>
using jsi_function_binding_t = jsi_function_binding<std::remove_cvref_t<F>>;

template<typename F>
std::shared_ptr<jsi_function_binding_t<F>> make_jsi_function_binding(F &&fn) {
  return std::make_shared<jsi_function_binding_t<F>>(std::forward<F>(fn));
}

} // namespace expo
