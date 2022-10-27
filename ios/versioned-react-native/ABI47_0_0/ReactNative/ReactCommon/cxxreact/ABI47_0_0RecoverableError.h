/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <exception>
#include <functional>
#include <string>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/**
 * RecoverableError
 *
 * An exception that it is expected we should be able to recover from.
 */
struct RecoverableError : public std::exception {
  explicit RecoverableError(const std::string &what_)
      : m_what{"ABI47_0_0facebook::ABI47_0_0React::Recoverable: " + what_} {}

  virtual const char *what() const noexcept override {
    return m_what.c_str();
  }

  /**
   * runRethrowingAsRecoverable
   *
   * Helper function that converts any exception of type `E`, thrown within the
   * `act` routine into a recoverable error with the same message.
   */
  template <typename E>
  inline static void runRethrowingAsRecoverable(std::function<void()> act) {
    try {
      act();
    } catch (const E &err) {
      throw RecoverableError(err.what());
    }
  }

 private:
  std::string m_what;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
