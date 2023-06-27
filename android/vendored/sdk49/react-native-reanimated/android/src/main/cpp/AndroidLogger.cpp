#include <android/log.h>
#include <memory>

#include "AndroidLogger.h"
#include "Logger.h"

#define APPNAME "NATIVE_REANIMATED"

namespace reanimated {

std::unique_ptr<LoggerInterface> Logger::instance =
    std::make_unique<AndroidLogger>();

void AndroidLogger::log(const char *str) {
  __android_log_print(ANDROID_LOG_VERBOSE, APPNAME, "%s", str);
}

void AndroidLogger::log(double d) {
  __android_log_print(ANDROID_LOG_VERBOSE, APPNAME, "%f", d);
}

void AndroidLogger::log(int i) {
  __android_log_print(ANDROID_LOG_VERBOSE, APPNAME, "%d", i);
}

void AndroidLogger::log(bool b) {
  __android_log_print(ANDROID_LOG_VERBOSE, APPNAME, "%s", b ? "true" : "false");
}

} // namespace reanimated
