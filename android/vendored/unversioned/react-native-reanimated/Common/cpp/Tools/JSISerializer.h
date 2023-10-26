#pragma once

#include <jsi/jsi.h>
#include <string>
#include <vector>

using namespace facebook;

namespace {
class JSISerializer {
 public:
  explicit JSISerializer(jsi::Runtime &rt);
  std::string stringifyJSIValueRecursively(
      const jsi::Value &value,
      bool isTopLevel = false);

 private:
  std::string stringifyArray(const jsi::Array &arr);
  std::string stringifyFunction(const jsi::Function &func);
  std::string stringifyHostObject(jsi::HostObject &hostObject);
  std::string stringifyObject(const jsi::Object &object);
  std::string stringifyError(const jsi::Object &object);
  std::string stringifySet(const jsi::Object &object);
  std::string stringifyMap(const jsi::Object &object);
  std::string stringifyWithName(const jsi::Object &object);
  std::string stringifyWithToString(const jsi::Object &object);
  std::string stringifyRecursiveType(const jsi::Object &object);

  bool hasBeenVisited(const jsi::Object &object) {
    return visitedNodes_.getPropertyAsFunction(rt_, "has")
        .callWithThis(rt_, visitedNodes_, object)
        .getBool();
  }

  void markAsVisited(const jsi::Object &object) {
    visitedNodes_.getPropertyAsFunction(rt_, "add")
        .callWithThis(rt_, visitedNodes_, object);
  }

  jsi::Runtime &rt_;
  jsi::Object visitedNodes_;
};
} // namespace

std::string stringifyJSIValue(jsi::Runtime &rt, const jsi::Value &value);
