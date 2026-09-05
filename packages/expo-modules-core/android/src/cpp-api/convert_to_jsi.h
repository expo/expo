#pragma once

#include <string>
#include <type_traits>

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

template<typename T>
struct convert_to_jsi {
  static jsi::Value convert(jsi::Runtime &, T value) {
    static_assert(false && "No convert_to_jsi specialization for this type");
  }
};

#define DECLARE_CONVERTER_FOR(Type, Arg) \
  template<> \
  struct convert_to_jsi<Type> { \
    static jsi::Value convert(jsi::Runtime &, Arg value); \
  };

DECLARE_CONVERTER_FOR(bool, bool)
DECLARE_CONVERTER_FOR(int, int)
DECLARE_CONVERTER_FOR(long, long)
DECLARE_CONVERTER_FOR(long long, long long)
DECLARE_CONVERTER_FOR(float, float)
DECLARE_CONVERTER_FOR(double, double)
DECLARE_CONVERTER_FOR(std::string, const std::string&)
DECLARE_CONVERTER_FOR(char *, char *)

DECLARE_CONVERTER_FOR(jsi::String, const jsi::String&)
DECLARE_CONVERTER_FOR(jsi::Object, const jsi::Object&)
DECLARE_CONVERTER_FOR(jsi::Array, const jsi::Array&)
DECLARE_CONVERTER_FOR(jsi::Function, const jsi::Function&)
DECLARE_CONVERTER_FOR(jsi::Value, const jsi::Value&)

#undef DECLARE_CONVERTER_FOR

} // namespace expo
