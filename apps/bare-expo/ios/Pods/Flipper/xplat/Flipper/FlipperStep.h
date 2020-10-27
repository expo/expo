/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

class FlipperState;

class FlipperStep {
 public:
  /* Mark this step as completed successfully
   * failing to call complete() will be registered as a failure
   * when the destructor is executed. */
  void complete();

  // Mark the step as failed, and provide a message.
  void fail(std::string message);

  FlipperStep(std::string name, FlipperState* state);
  ~FlipperStep();

 private:
  std::string name;
  bool isLogged = false;
  FlipperState* state;
};
