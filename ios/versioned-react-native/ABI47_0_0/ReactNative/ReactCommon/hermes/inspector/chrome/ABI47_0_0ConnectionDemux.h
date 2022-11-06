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

#include <hermes/ABI47_0_0hermes.h>
#include <hermes/inspector/ABI47_0_0RuntimeAdapter.h>
#include <hermes/inspector/chrome/ABI47_0_0Connection.h>
#include <ABI47_0_0jsinspector/ABI47_0_0InspectorInterfaces.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0hermes {
namespace inspector {
namespace chrome {

/*
 * ConnectionDemux keeps track of all debuggable Hermes runtimes (called
 * "pages" in the higher-level ABI47_0_0React Native API) in this process. See
 * Registration.h for documentation of the public API.
 */
class ConnectionDemux {
 public:
  explicit ConnectionDemux(ABI47_0_0facebook::ABI47_0_0React::IInspector &inspector);
  ~ConnectionDemux();

  ConnectionDemux(const ConnectionDemux &) = delete;
  ConnectionDemux &operator=(const ConnectionDemux &) = delete;

  int enableDebugging(
      std::unique_ptr<RuntimeAdapter> adapter,
      const std::string &title);
  void disableDebugging(jsi::Runtime &runtime);

 private:
  int addPage(std::shared_ptr<Connection> conn);
  void removePage(int pageId);

  ABI47_0_0facebook::ABI47_0_0React::IInspector &globalInspector_;

  std::mutex mutex_;
  std::unordered_map<int, std::shared_ptr<Connection>> conns_;
  std::shared_ptr<std::unordered_set<std::string>> inspectedContexts_;
};

} // namespace chrome
} // namespace inspector
} // namespace ABI47_0_0hermes
} // namespace ABI47_0_0facebook
