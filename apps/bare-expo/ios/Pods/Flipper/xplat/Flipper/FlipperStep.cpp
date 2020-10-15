/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FlipperStep.h"
#include "FlipperState.h"
#include "Log.h"

using facebook::flipper::log;

void FlipperStep::complete() {
  isLogged = true;
  state->success(name);
}

void FlipperStep::fail(std::string message) {
  isLogged = true;
  state->failed(name, message);
}

FlipperStep::FlipperStep(std::string step, FlipperState* s) {
  state = s;
  name = step;
}

FlipperStep::~FlipperStep() {
  if (!isLogged) {
    try {
      state->failed(name, "");
    } catch (std::exception& e) {
      log(std::string("Exception occurred in FlipperStep destructor: ") +
          e.what());
    } catch (...) {
      log("Exception occurred in FlipperStep destructor");
    }
  }
}
