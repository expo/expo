/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/io/async/EventBase.h>
#include <map>

namespace facebook {
namespace flipper {

struct DeviceData {
  std::string host;
  std::string os;
  std::string device;
  std::string deviceId;
  std::string app;
  std::string appId;
  std::string privateAppDirectory;
};

struct FlipperInitConfig {
  /**
  Map of client specific configuration data such as app name, device name, etc.
  */
  DeviceData deviceData;

  /**
  EventBase on which client callbacks should be called.
  */
  folly::EventBase* callbackWorker;

  /**
  EventBase to be used to maintain the network connection.
  */
  folly::EventBase* connectionWorker;

  int insecurePort = 8089;
  int securePort = 8088;
};

} // namespace flipper
} // namespace facebook
