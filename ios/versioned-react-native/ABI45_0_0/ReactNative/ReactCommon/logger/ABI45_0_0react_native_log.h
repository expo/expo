/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

enum ABI45_0_0ReactNativeLogLevel {
  ABI45_0_0ReactNativeLogLevelInfo = 1,
  ABI45_0_0ReactNativeLogLevelWarning = 2,
  ABI45_0_0ReactNativeLogLevelError = 3,
  ABI45_0_0ReactNativeLogLevelFatal = 4
};

typedef void (*ABI45_0_0Reactnativelogfunctype)(ABI45_0_0ReactNativeLogLevel, const char *);

#ifdef __cplusplus
extern "C" {
#endif // __cplusplus
void set_ABI45_0_0React_native_logfunc(ABI45_0_0Reactnativelogfunctype newlogfunc);

void ABI45_0_0React_native_log_info(const char *text);
void ABI45_0_0React_native_log_warn(const char *text);
void ABI45_0_0React_native_log_error(const char *text);
void ABI45_0_0React_native_log_fatal(const char *text);

void _ABI45_0_0React_native_log(ABI45_0_0ReactNativeLogLevel level, const char *text);
void _ABI45_0_0React_native_log_default(ABI45_0_0ReactNativeLogLevel level, const char *text);
#ifdef __cplusplus
}
#endif // __cpusplus
