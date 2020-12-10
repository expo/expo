/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Log.h"

#ifdef __ANDROID__
#include <android/log.h>
#endif

namespace facebook {
namespace flipper {

void log(const std::string& message) {
#ifdef __ANDROID__
  __android_log_print(
      ANDROID_LOG_INFO, "flipper", "flipper: %s", message.c_str());
#else
  printf("flipper: %s\n", message.c_str());
#endif
}

} // namespace flipper
} // namespace facebook
