/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0ConnectionDemux.h"
#include "ABI49_0_0Connection.h"

#include <ABI49_0_0jsinspector/ABI49_0_0InspectorInterfaces.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0hermes {
namespace inspector {
namespace chrome {

using ::ABI49_0_0facebook::ABI49_0_0React::IInspector;
using ::ABI49_0_0facebook::ABI49_0_0React::ILocalConnection;
using ::ABI49_0_0facebook::ABI49_0_0React::IRemoteConnection;

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

ConnectionDemux::ConnectionDemux(ABI49_0_0facebook::ABI49_0_0React::IInspector &inspector)
    : globalInspector_(inspector),
      inspectedContexts_(std::make_shared<std::unordered_set<std::string>>()) {}

ConnectionDemux::~ConnectionDemux() = default;

DebugSessionToken ConnectionDemux::enableDebugging(
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

  auto waitForDebugger =
      (inspectedContexts_->find(title) != inspectedContexts_->end());
  return addPage(
      std::make_shared<Connection>(std::move(adapter), title, waitForDebugger));
}

void ConnectionDemux::disableDebugging(DebugSessionToken session) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (conns_.find(session) == conns_.end()) {
    return;
  }
  removePage(session);
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
  std::string title = conn->getTitle();
  inspectedContexts_->erase(title);
  conn->disconnect();
  conns_.erase(pageId);
}

} // namespace chrome
} // namespace inspector
} // namespace ABI49_0_0hermes
} // namespace ABI49_0_0facebook
