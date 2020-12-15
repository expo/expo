/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include "FlipperConnection.h"

namespace facebook {
namespace flipper {

class FlipperPlugin {
 public:
  virtual ~FlipperPlugin() {}

  /**
  The plugin's identifier. This should map to a javascript plugin
  with the same identifier to ensure messages are sent correctly.
  */
  virtual std::string identifier() const = 0;

  /**
  Called when a connection has been established between this plugin
  and the corresponding plugin on the Flipper desktop app. The provided
  connection can be used to register method receivers as well as send
  messages back to the desktop app.
  */
  virtual void didConnect(std::shared_ptr<FlipperConnection> conn) = 0;

  /**
  Called when a plugin has been disconnected and the FlipperConnection
  provided in didConnect is no longer valid to use.
  */
  virtual void didDisconnect() = 0;

  /**
   Returns true if the plugin is meant to be run in background too, otherwise it
   returns false.
   */
  virtual bool runInBackground() {
    return false;
  }
};

} // namespace flipper
} // namespace facebook
