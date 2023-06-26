/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0EventLogger.h"

namespace ABI49_0_0facebook::ABI49_0_0React {

EventLogger *eventLogger;

void setEventLogger(EventLogger *logger) {
  eventLogger = logger;
}

EventLogger *getEventLogger() {
  return eventLogger;
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
