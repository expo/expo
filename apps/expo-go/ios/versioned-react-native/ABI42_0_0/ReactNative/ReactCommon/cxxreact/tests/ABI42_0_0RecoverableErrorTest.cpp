/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <exception>
#include <stdexcept>

#include <ABI42_0_0cxxreact/ABI42_0_0RecoverableError.h>

using namespace ABI42_0_0facebook::ABI42_0_0React;

TEST(RecoverableError, RunRethrowingAsRecoverableRecoverTest) {
  try {
    RecoverableError::runRethrowingAsRecoverable<std::runtime_error>(
        []() { throw std::runtime_error("catch me"); });
    FAIL() << "Unthrown exception";
  } catch (const RecoverableError &err) {
    ASSERT_STREQ(err.what(), "ABI42_0_0facebook::ABI42_0_0React::Recoverable: catch me");
  } catch (...) {
    FAIL() << "Uncaught exception";
  }
}

TEST(RecoverableError, RunRethrowingAsRecoverableFallthroughTest) {
  try {
    RecoverableError::runRethrowingAsRecoverable<std::runtime_error>(
        []() { throw std::logic_error("catch me"); });
    FAIL() << "Unthrown exception";
  } catch (const RecoverableError &err) {
    FAIL() << "Recovered exception that should have fallen through";
  } catch (const std::exception &err) {
    ASSERT_STREQ(err.what(), "catch me");
  }
}
