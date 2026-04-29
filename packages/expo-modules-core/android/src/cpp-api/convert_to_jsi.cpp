#include "convert_to_jsi.h"

namespace expo {

jsi::Value convert_to_jsi<bool>::convert(jsi::Runtime &, bool v) {
  return {v};
}

jsi::Value convert_to_jsi<int>::convert(jsi::Runtime &, int v) {
  return {v};
}

jsi::Value convert_to_jsi<long>::convert(jsi::Runtime &, long v) {
  return {static_cast<double>(v)};
}

jsi::Value convert_to_jsi<long long>::convert(jsi::Runtime &, long long v) {
  return {static_cast<double>(v)};
}

jsi::Value convert_to_jsi<float>::convert(jsi::Runtime &, float v) {
  return {v};
}

jsi::Value convert_to_jsi<double>::convert(jsi::Runtime &, double v) {
  return {v};
}

jsi::Value convert_to_jsi<std::string>::convert(jsi::Runtime &rt, const std::string &v) {
  return {rt, jsi::String::createFromUtf8(rt, v)};
}

jsi::Value convert_to_jsi<char *>::convert(jsi::Runtime &rt, char *v) {
  return {rt, jsi::String::createFromUtf8(rt, v)};
}

jsi::Value convert_to_jsi<jsi::String>::convert(jsi::Runtime &rt, const jsi::String &v) {
  return {rt, v};
}

jsi::Value convert_to_jsi<jsi::Object>::convert(jsi::Runtime &rt, const jsi::Object &v) {
  return {rt, v};
}

jsi::Value convert_to_jsi<jsi::Array>::convert(jsi::Runtime &rt, const jsi::Array &v) {
  return {rt, v};
}

jsi::Value convert_to_jsi<jsi::Function>::convert(jsi::Runtime &rt, const jsi::Function &v) {
  return {rt, v};
}

jsi::Value convert_to_jsi<jsi::Value>::convert(jsi::Runtime &rt, const jsi::Value &v) {
  return {rt, v};
}

} // namespace expo
