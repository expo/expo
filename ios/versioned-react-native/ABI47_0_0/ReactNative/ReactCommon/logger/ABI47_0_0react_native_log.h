/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

enum ABI47_0_0ReactNativeLogLevel {
  ABI47_0_0ReactNativeLogLevelInfo = 1,
  ABI47_0_0ReactNativeLogLevelWarning = 2,
  ABI47_0_0ReactNativeLogLevelError = 3,
  ABI47_0_0ReactNativeLogLevelFatal = 4
};

typedef void (*ABI47_0_0Reactnativelogfunctype)(ABI47_0_0ReactNativeLogLevel, const char *);

#ifdef __cplusplus
extern "C" {
#endif // __cplusplus
void set_ABI47_0_0React_native_logfunc(ABI47_0_0Reactnativelogfunctype newlogfunc);

void ABI47_0_0React_native_log_info(const char *text);
void ABI47_0_0React_native_log_warn(const char *text);
void ABI47_0_0React_native_log_error(const char *text);
void ABI47_0_0React_native_log_fatal(const char *text);

void _ABI47_0_0React_native_log(ABI47_0_0ReactNativeLogLevel level, const char *text);
void _ABI47_0_0React_native_log_default(ABI47_0_0ReactNativeLogLevel level, const char *text);
#ifdef __cplusplus
}
#endif // __cpusplus
