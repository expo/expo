/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>
#include <string>
#include <vector>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

class IDestructible {
 public:
  virtual ~IDestructible() = 0;
};

struct InspectorPage {
  const int id;
  const std::string title;
  const std::string vm;
};

/// IRemoteConnection allows the VM to send debugger messages to the client.
class IRemoteConnection : public IDestructible {
 public:
  virtual ~IRemoteConnection() = 0;
  virtual void onMessage(std::string message) = 0;
  virtual void onDisconnect() = 0;
};

/// ILocalConnection allows the client to send debugger messages to the VM.
class ILocalConnection : public IDestructible {
 public:
  virtual ~ILocalConnection() = 0;
  virtual void sendMessage(std::string message) = 0;
  virtual void disconnect() = 0;
};

/// IInspector tracks debuggable JavaScript targets (pages).
class IInspector : public IDestructible {
 public:
  using ConnectFunc = std::function<std::unique_ptr<ILocalConnection>(
      std::unique_ptr<IRemoteConnection>)>;

  virtual ~IInspector() = 0;

  /// addPage is called by the VM to add a page to the list of debuggable pages.
  virtual int addPage(
      const std::string &title,
      const std::string &vm,
      ConnectFunc connectFunc) = 0;

  /// removePage is called by the VM to remove a page from the list of
  /// debuggable pages.
  virtual void removePage(int pageId) = 0;

  /// getPages is called by the client to list all debuggable pages.
  virtual std::vector<InspectorPage> getPages() const = 0;

  /// connect is called by the client to initiate a debugging session on the
  /// given page.
  virtual std::unique_ptr<ILocalConnection> connect(
      int pageId,
      std::unique_ptr<IRemoteConnection> remote) = 0;
};

/// getInspectorInstance retrieves the singleton inspector that tracks all
/// debuggable pages in this process.
extern IInspector &getInspectorInstance();

/// makeTestInspectorInstance creates an independent inspector instance that
/// should only be used in tests.
extern std::unique_ptr<IInspector> makeTestInspectorInstance();

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
