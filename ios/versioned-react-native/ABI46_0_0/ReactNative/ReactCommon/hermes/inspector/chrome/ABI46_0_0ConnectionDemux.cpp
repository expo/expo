/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI46_0_0ConnectionDemux.h"
#include "ABI46_0_0AutoAttachUtils.h"
#include "ABI46_0_0Connection.h"

#include <ABI46_0_0jsinspector/ABI46_0_0InspectorInterfaces.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0hermes {
namespace inspector {
namespace chrome {

using ::ABI46_0_0facebook::ABI46_0_0React::IInspector;
using ::ABI46_0_0facebook::ABI46_0_0React::ILocalConnection;
using ::ABI46_0_0facebook::ABI46_0_0React::IRemoteConnection;

namespace {

class LocalConnection : public ILocalConnection {
 public:
  LocalConnection(
      std::shared_ptr<Connection> conn,
      std::shared_ptr<std::unordered_set<std::string>> inspectedContexts);
  ~LocalConnection();

  void sendMessage(std::string message) override;
  void disconnect() override;

 private:
  std::shared_ptr<Connection> conn_;
  std::shared_ptr<std::unordered_set<std::string>> inspectedContexts_;
};

LocalConnection::LocalConnection(
    std::shared_ptr<Connection> conn,
    std::shared_ptr<std::unordered_set<std::string>> inspectedContexts)
    : conn_(conn), inspectedContexts_(inspectedContexts) {
  inspectedContexts_->insert(conn->getTitle());
}

LocalConnection::~LocalConnection() = default;

void LocalConnection::sendMessage(std::string str) {
  conn_->sendMessage(std::move(str));
}

void LocalConnection::disconnect() {
  inspectedContexts_->erase(conn_->getTitle());
  conn_->disconnect();
}

} // namespace

ConnectionDemux::ConnectionDemux(ABI46_0_0facebook::ABI46_0_0React::IInspector &inspector)
    : globalInspector_(inspector),
      inspectedContexts_(std::make_shared<std::unordered_set<std::string>>()) {}

ConnectionDemux::~ConnectionDemux() = default;

int ConnectionDemux::enableDebugging(
    std::unique_ptr<RuntimeAdapter> adapter,
    const std::string &title) {
  std::lock_guard<std::mutex> lock(mutex_);

  // TODO(#22976087): workaround for ComponentScript contexts never being
  // destroyed.
  //
  // After a reload, the old ComponentScript VM instance stays alive. When we
  // register the new CS VM instance, check for any previous CS VM (via strcmp
  // of title) and remove them.
  std::vector<int> pagesToDelete;
  for (auto it = conns_.begin(); it != conns_.end(); ++it) {
    if (it->second->getTitle() == title) {
      pagesToDelete.push_back(it->first);
    }
  }

  for (auto pageId : pagesToDelete) {
    removePage(pageId);
  }

  // TODO(hypuk): Provide real app and device names.
  auto waitForDebugger =
      (inspectedContexts_->find(title) != inspectedContexts_->end()) ||
      isNetworkInspected(title, "app_name", "device_name");

  return addPage(
      std::make_shared<Connection>(std::move(adapter), title, waitForDebugger));
}

void ConnectionDemux::disableDebugging(HermesRuntime &runtime) {
  std::lock_guard<std::mutex> lock(mutex_);

  for (auto &it : conns_) {
    int pageId = it.first;
    auto &conn = it.second;

    if (&(conn->getRuntime()) == &runtime) {
      removePage(pageId);

      // must break here. removePage mutates conns_, so range-for iterator is
      // now invalid.
      break;
    }
  }
}

int ConnectionDemux::addPage(std::shared_ptr<Connection> conn) {
  auto connectFunc = [conn, this](std::unique_ptr<IRemoteConnection> remoteConn)
      -> std::unique_ptr<ILocalConnection> {
    if (!conn->connect(std::move(remoteConn))) {
      return nullptr;
    }

    return std::make_unique<LocalConnection>(conn, inspectedContexts_);
  };

  int pageId = globalInspector_.addPage(
      conn->getTitle(), "Hermes", std::move(connectFunc));
  conns_[pageId] = std::move(conn);

  return pageId;
}

void ConnectionDemux::removePage(int pageId) {
  globalInspector_.removePage(pageId);

  auto conn = conns_.at(pageId);
  conn->disconnect();
  conns_.erase(pageId);
}

} // namespace chrome
} // namespace inspector
} // namespace ABI46_0_0hermes
} // namespace ABI46_0_0facebook
