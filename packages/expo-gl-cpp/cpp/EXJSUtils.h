#pragma once

#include <stdint.h>
#include <jsi/jsi.h>

#ifdef __APPLE__
#include <EXGL_CPP/EXiOSUtils.h>
#endif

#ifdef __ANDROID__
#include <android/log.h>
#endif

void EXJSConsoleLog(facebook::jsi::Runtime& runtime, const std::string& msg);

#define EXGL_DEBUG     // Whether debugging is on

#ifdef EXGL_DEBUG
#ifdef __ANDROID__
#define EXGLSysLog(fmt, ...) __android_log_print(ANDROID_LOG_DEBUG, "EXGL", fmt, ##__VA_ARGS__)
#endif
#ifdef __APPLE__
#define EXGLSysLog(fmt, ...) EXiOSLog("EXGL: " fmt, ##__VA_ARGS__)
#endif
#else
#define EXGLSysLog(...)
#endif
