#include "Logger.h"
#include "AndroidLogger.h"
#include <android/log.h>
#define APPNAME "NATIVE_REANIMATED"

std::unique_ptr<LoggerInterface> Logger::instance = std::unique_ptr<AndroidLogger>(new AndroidLogger());

void AndroidLogger::log(const char* str) {
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
