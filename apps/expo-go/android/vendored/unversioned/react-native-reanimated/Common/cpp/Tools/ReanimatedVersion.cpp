#include "ReanimatedVersion.h"
#include <memory>
#include <regex>
#include <string>
#include "JSLogger.h"

#ifdef REANIMATED_VERSION
#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)
#define REANIMATED_VERSION_STRING STRINGIZE2(REANIMATED_VERSION)
#endif // REANIMATED_VERSION

using namespace facebook;

namespace reanimated {

std::string getReanimatedCppVersion() {
  return std::string(REANIMATED_VERSION_STRING);
}

// This function is pretty much a copy of
// `src/reanimated2/platform-specific/checkVersion.ts`.
#ifndef NDEBUG
bool matchVersion(const std::string &version1, const std::string &version2) {
  std::regex pattern("^\\d+\\.\\d+\\.\\d+$");
  if (std::regex_match(version1, pattern) &&
      std::regex_match(version2, pattern)) {
    auto majorPattern = std::regex("^\\d+");
    auto major1 = std::regex_search(version1, majorPattern);
    auto major2 = std::regex_search(version2, majorPattern);
    if (major1 != major2) {
      return false;
    }
    auto minorPattern = std::regex("\\.\\d+\\.");
    auto minor1 = std::regex_search(version1, minorPattern);
    auto minor2 = std::regex_search(version2, minorPattern);
    if (minor1 != minor2) {
      return false;
    }
    return true;
  } else {
    return version1 == version2;
  }
}

void checkJSVersion(
    jsi::Runtime &rnRuntime,
    const std::shared_ptr<JSLogger> &jsLogger) {
  auto cppVersion = getReanimatedCppVersion();

  auto maybeJSVersion =
      rnRuntime.global().getProperty(rnRuntime, "_REANIMATED_VERSION_JS");
  if (maybeJSVersion.isUndefined()) {
    jsLogger->warnOnJS(
        std::string(
            "[Reanimated] C++ side failed to resolve JavaScript code version\n") +
        "See `https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting#c-side-failed-to-resolve-javascript-code-version` for more details.");
    return;
  }

  auto jsVersion = maybeJSVersion.asString(rnRuntime).utf8(rnRuntime);

  if (!matchVersion(cppVersion, jsVersion)) {
    jsLogger->warnOnJS(
        std::string(
            "[Reanimated] Mismatch between C++ code version and JavaScript code version (") +
        cppVersion + " vs. " + jsVersion + " respectively).\n" +
        "See `https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting#mismatch-between-c-code-version-and-javascript-code-version` for more details.");
    return;
  }

  rnRuntime.global().setProperty(
      rnRuntime,
      "_REANIMATED_VERSION_CPP",
      jsi::String::createFromUtf8(rnRuntime, cppVersion));
}
#endif // NDEBUG

}; // namespace reanimated
