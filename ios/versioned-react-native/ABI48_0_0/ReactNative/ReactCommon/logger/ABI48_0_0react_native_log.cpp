/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0React_native_log.h"
#include <glog/logging.h>

static ABI48_0_0Reactnativelogfunctype _ABI48_0_0Reactnativelogfunc = NULL;

void set_ABI48_0_0React_native_logfunc(ABI48_0_0Reactnativelogfunctype newlogfunc) {
  _ABI48_0_0Reactnativelogfunc = newlogfunc;
}
void ABI48_0_0React_native_log_info(const char *message) {
  _ABI48_0_0React_native_log(ABI48_0_0ReactNativeLogLevelInfo, message);
}
void ABI48_0_0React_native_log_warn(const char *message) {
  _ABI48_0_0React_native_log(ABI48_0_0ReactNativeLogLevelWarning, message);
}
void ABI48_0_0React_native_log_error(const char *message) {
  _ABI48_0_0React_native_log(ABI48_0_0ReactNativeLogLevelError, message);
}
void ABI48_0_0React_native_log_fatal(const char *message) {
  _ABI48_0_0React_native_log(ABI48_0_0ReactNativeLogLevelFatal, message);
}

void _ABI48_0_0React_native_log(ABI48_0_0ReactNativeLogLevel level, const char *message) {
  if (_ABI48_0_0Reactnativelogfunc == NULL) {
    _ABI48_0_0React_native_log_default(level, message);
  } else {
    _ABI48_0_0Reactnativelogfunc(level, message);
  }
}

void _ABI48_0_0React_native_log_default(ABI48_0_0ReactNativeLogLevel level, const char *message) {
  switch (level) {
    case ABI48_0_0ReactNativeLogLevelInfo:
      LOG(INFO) << message;
      break;
    case ABI48_0_0ReactNativeLogLevelWarning:
      LOG(WARNING) << message;
      break;
    case ABI48_0_0ReactNativeLogLevelError:
      LOG(ERROR) << message;
      break;
    case ABI48_0_0ReactNativeLogLevelFatal:
      LOG(FATAL) << message;
      break;
  }
}
