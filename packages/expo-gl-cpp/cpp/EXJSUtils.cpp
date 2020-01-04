#include "EXJSUtils.h"

namespace jsi = facebook::jsi;

void EXJSConsoleLog(jsi::Runtime& runtime, const std::string& msg) {
  runtime
    .global()
    .getProperty(runtime, "console")
    .asObject(runtime)
    .getProperty(runtime, "log")
    .asObject(runtime)
    .asFunction(runtime)
    .call(runtime, { jsi::String::createFromUtf8(runtime, msg) });
}
