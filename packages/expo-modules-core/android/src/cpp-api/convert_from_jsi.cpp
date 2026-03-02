#include "convert_from_jsi.h"

namespace expo {

bool convert_from_jsi<bool>::convert(jsi::Runtime &, const jsi::Value &value) {
  return value.asBool();
}

int convert_from_jsi<int>::convert(jsi::Runtime &, const jsi::Value &value) {
  return static_cast<int>(value.asNumber());
}

long convert_from_jsi<long>::convert(jsi::Runtime &, const jsi::Value &value) {
  return static_cast<long>(value.asNumber());
}

long long convert_from_jsi<long long>::convert(jsi::Runtime &, const jsi::Value &value) {
  return static_cast<long long>(value.asNumber());
}

float convert_from_jsi<float>::convert(jsi::Runtime &, const jsi::Value &value) {
  return static_cast<float>(value.asNumber());
}

double convert_from_jsi<double>::convert(jsi::Runtime &, const jsi::Value &value) {
  return static_cast<double>(value.asNumber());
}

std::string convert_from_jsi<std::string>::convert(jsi::Runtime &rt, const jsi::Value &value) {
  return value.asString(rt).utf8(rt);
}

jsi::String convert_from_jsi<jsi::String>::convert(jsi::Runtime &rt, const jsi::Value &value) {
  return value.asString(rt);
}

jsi::Object convert_from_jsi<jsi::Object>::convert(jsi::Runtime &rt, const jsi::Value &value) {
  return value.asObject(rt);
}

jsi::Function convert_from_jsi<jsi::Function>::convert(jsi::Runtime &rt, const jsi::Value &value) {
  return value.asObject(rt).asFunction(rt);
}

jsi::Array convert_from_jsi<jsi::Array>::convert(jsi::Runtime &rt, const jsi::Value &value) {
  return value.asObject(rt).asArray(rt);
}

jsi::Value convert_from_jsi<jsi::Value>::convert(jsi::Runtime &rt, const jsi::Value &value) {
  return {rt, value};
}

} // namespace expo
