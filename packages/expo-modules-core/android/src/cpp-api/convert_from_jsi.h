#pragma once

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

template<typename T>
struct convert_from_jsi {
  static T convert(jsi::Runtime &, const jsi::Value &) {
    static_assert(false && "No convert_from_jsi specialization for this type");
  }
};

#define DECLARE_CONVERTER_FOR(Type) \
  template<> \
  struct convert_from_jsi<Type> { \
    static Type convert(jsi::Runtime &, const jsi::Value &value); \
  };

DECLARE_CONVERTER_FOR(bool)
DECLARE_CONVERTER_FOR(int)
DECLARE_CONVERTER_FOR(long)
DECLARE_CONVERTER_FOR(long long)
DECLARE_CONVERTER_FOR(float)
DECLARE_CONVERTER_FOR(double)
DECLARE_CONVERTER_FOR(std::string)

DECLARE_CONVERTER_FOR(jsi::String)
DECLARE_CONVERTER_FOR(jsi::Object)
DECLARE_CONVERTER_FOR(jsi::Function)
DECLARE_CONVERTER_FOR(jsi::Array)
DECLARE_CONVERTER_FOR(jsi::Value)

#undef DECLARE_CONVERTER_FOR

} // namespace expo
