/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <unordered_set>

#include <hermes/ABI48_0_0hermes.h>
#include <hermes/inspector/ABI48_0_0RuntimeAdapter.h>
#include <hermes/inspector/chrome/ABI48_0_0Connection.h>
#include <hermes/inspector/chrome/ABI48_0_0Registration.h>
#include <ABI48_0_0jsinspector/ABI48_0_0InspectorInterfaces.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0hermes {
namespace inspector {
namespace chrome {

/*
 * ConnectionDemux keeps track of all debuggable Hermes runtimes (called
 * "pages" in the higher-level ABI48_0_0React Native API) in this process. See
 * Registration.h for documentation of the public API.
 */
class ConnectionDemux {
 public:
  explicit ConnectionDemux(ABI48_0_0facebook::ABI48_0_0React::IInspector &inspector);
  ~ConnectionDemux();

  ConnectionDemux(const ConnectionDemux &) = delete;
  ConnectionDemux &operator=(const ConnectionDemux &) = delete;

  DebugSessionToken enableDebugging(
      std::unique_ptr<RuntimeAdapter> adapter,
      const std::string &title);
  void disableDebugging(DebugSessionToken session);

 private:
  int addPage(std::shared_ptr<Connection> conn);
  void removePage(int pageId);

  ABI48_0_0facebook::ABI48_0_0React::IInspector &globalInspector_;

  std::mutex mutex_;
  std::unordered_map<int, std::shared_ptr<Connection>> conns_;
  std::shared_ptr<std::unordered_set<std::string>> inspectedContexts_;
};

} // namespace chrome
} // namespace inspector
} // namespace ABI48_0_0hermes
} // namespace ABI48_0_0facebook
