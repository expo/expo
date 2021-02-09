/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <folly/io/async/AsyncTransportCertificate.h>
#include <memory>

namespace folly {
namespace ssl {

class BasicTransportCertificate : public folly::AsyncTransportCertificate {
 public:
  // Create a basic transport cert from an existing one.  Returns nullptr
  // if cert is null.
  static std::unique_ptr<BasicTransportCertificate> create(
      const folly::AsyncTransportCertificate* cert) {
    if (!cert) {
      return nullptr;
    }
    return std::make_unique<BasicTransportCertificate>(
        cert->getIdentity(), cert->getX509());
  }

  BasicTransportCertificate(
      std::string identity,
      folly::ssl::X509UniquePtr x509)
      : identity_(std::move(identity)), x509_(std::move(x509)) {}

  std::string getIdentity() const override {
    return identity_;
  }

  folly::ssl::X509UniquePtr getX509() const override {
    if (!x509_) {
      return nullptr;
    }
    auto x509raw = x509_.get();
    X509_up_ref(x509raw);
    return folly::ssl::X509UniquePtr(x509raw);
  }

 private:
  std::string identity_;
  folly::ssl::X509UniquePtr x509_;
};

} // namespace ssl
} // namespace folly
