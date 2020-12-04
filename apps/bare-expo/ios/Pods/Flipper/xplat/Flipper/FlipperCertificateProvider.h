/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>
#include "FlipperCertificateExchangeMedium.h"
#include "FlipperState.h"
#include "FlipperStep.h"
namespace facebook {
namespace flipper {

/**
 * Represents a FlipperCertificateProvider which is responsible for obtaining
 * Flipper TLS certificates.
 */
class FlipperCertificateProvider {
 public:
  virtual ~FlipperCertificateProvider() {}

  /**
   * Gets certificates downloaded at a path, which is passed as an argument.
   */
  virtual void getCertificates(
      const std::string& path,
      const std::string& deviceID) = 0;

  /**
   * Sets certificate exchange medium
   */
  virtual void setCertificateExchangeMedium(
      const FlipperCertificateExchangeMedium medium) = 0;

  /**
   * Gets certificate exchange medium
   */
  virtual FlipperCertificateExchangeMedium getCertificateExchangeMedium() = 0;

  /**
   * This lets the Client know if it should reset the connection folder when
   * `stop` is called.
   */
  virtual bool shouldResetCertificateFolder() = 0;

  /**
   * Sets the FlipperState, so that Cert Provider can send debuggin information
   * to troubleshoot screen.
   */
  virtual void setFlipperState(std::shared_ptr<FlipperState> state) = 0;
};

} // namespace flipper
} // namespace facebook
