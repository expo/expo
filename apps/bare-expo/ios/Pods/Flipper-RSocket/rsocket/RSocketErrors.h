// Copyright (c) Facebook, Inc. and its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#pragma once

#include <stdexcept>
#include <string>

namespace rsocket {

/*
 * Error Codes from
 * https://github.com/ReactiveSocket/reactivesocket/blob/master/Protocol.md#error-codes
 */
class RSocketError : public std::runtime_error {
 public:
  using std::runtime_error::runtime_error;

  /**
   * Get the error code for inclusion in an RSocket ERROR frame as per
   * https://github.com/ReactiveSocket/reactivesocket/blob/master/Protocol.md#error-codes
   * @return
   */
  virtual int getErrorCode() const = 0;
};

/**
 * Error Code: INVALID_SETUP 0x00000001
 */
class InvalidSetupError : public RSocketError {
 public:
  using RSocketError::RSocketError;

  int getErrorCode() const override {
    return 0x00000001;
  }

  const char* what() const noexcept override {
    return "INVALID_SETUP";
  }
};

/**
 * Error Code: UNSUPPORTED_SETUP 0x00000002
 */
class UnsupportedSetupError : public RSocketError {
 public:
  using RSocketError::RSocketError;

  int getErrorCode() const override {
    return 0x00000002;
  }

  const char* what() const noexcept override {
    return "UNSUPPORTED_SETUP";
  }
};

/**
 * Error Code: REJECTED_SETUP 0x00000003
 */
class RejectedSetupError : public RSocketError {
 public:
  using RSocketError::RSocketError;

  int getErrorCode() const override {
    return 0x00000003;
  }

  const char* what() const noexcept override {
    return "REJECTED_SETUP";
  }
};

/**
 * Error Code: REJECTED_RESUME 0x00000004
 */
class RejectedResumeError : public RSocketError {
 public:
  using RSocketError::RSocketError;

  int getErrorCode() const override {
    return 0x00000004;
  }

  const char* what() const noexcept override {
    return "REJECTED_RESUME";
  }
};

/**
 * Error Code: CONNECTION_ERROR 0x00000101
 */
class ConnectionError : public RSocketError {
 public:
  using RSocketError::RSocketError;

  int getErrorCode() const override {
    return 0x00000101;
  }

  const char* what() const noexcept override {
    return "CONNECTION_ERROR";
  }
};

/**
 * Error Code: CONNECTION_CLOSE 0x00000102
 */
class ConnectionCloseError : public RSocketError {
 public:
  using RSocketError::RSocketError;

  int getErrorCode() const override {
    return 0x00000102;
  }

  const char* what() const noexcept override {
    return "CONNECTION_CLOSE";
  }
};
} // namespace rsocket
