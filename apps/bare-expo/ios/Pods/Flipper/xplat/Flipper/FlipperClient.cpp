/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FlipperClient.h"
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <vector>
#include "ConnectionContextStore.h"
#include "FireAndForgetBasedFlipperResponder.h"
#include "FlipperConnectionImpl.h"
#include "FlipperConnectionManagerImpl.h"
#include "FlipperResponderImpl.h"
#include "FlipperState.h"
#include "FlipperStep.h"
#include "Log.h"
#if __ANDROID__
#include "utils/CallstackHelper.h"
#endif
#if __APPLE__
#include <execinfo.h>
#endif

#if FB_SONARKIT_ENABLED

namespace facebook {
namespace flipper {

static FlipperClient* kInstance{nullptr};

using folly::dynamic;

void FlipperClient::init(FlipperInitConfig config) {
  auto state = std::make_shared<FlipperState>();
  auto context = std::make_shared<ConnectionContextStore>(config.deviceData);
  kInstance = new FlipperClient(
      std::make_unique<FlipperConnectionManagerImpl>(
          std::move(config), state, context),
      state);
}

FlipperClient* FlipperClient::instance() {
  return kInstance;
}

void FlipperClient::setStateListener(
    std::shared_ptr<FlipperStateUpdateListener> stateListener) {
  performAndReportError([this, &stateListener]() {
    log("Setting state listener");
    flipperState_->setUpdateListener(stateListener);
  });
}

void FlipperClient::addPlugin(std::shared_ptr<FlipperPlugin> plugin) {
  performAndReportError([this, plugin]() {
    log("FlipperClient::addPlugin " + plugin->identifier());
    auto step = flipperState_->start("Add plugin " + plugin->identifier());

    std::lock_guard<std::mutex> lock(mutex_);
    if (plugins_.find(plugin->identifier()) != plugins_.end()) {
      throw std::out_of_range(
          "plugin " + plugin->identifier() + " already added.");
    }
    plugins_[plugin->identifier()] = plugin;
    step->complete();
    if (connected_) {
      refreshPlugins();
    }
  });
}

void FlipperClient::setCertificateProvider(
    const std::shared_ptr<FlipperCertificateProvider> provider) {
  socket_->setCertificateProvider(provider);
  log("cpp setCertificateProvider called");
}

std::shared_ptr<FlipperCertificateProvider>
FlipperClient::getCertificateProvider() {
  return socket_->getCertificateProvider();
}

void FlipperClient::removePlugin(std::shared_ptr<FlipperPlugin> plugin) {
  performAndReportError([this, plugin]() {
    log("FlipperClient::removePlugin " + plugin->identifier());

    std::lock_guard<std::mutex> lock(mutex_);
    if (plugins_.find(plugin->identifier()) == plugins_.end()) {
      throw std::out_of_range("plugin " + plugin->identifier() + " not added.");
    }
    disconnect(plugin);
    plugins_.erase(plugin->identifier());
    if (connected_) {
      refreshPlugins();
    }
  });
}

std::shared_ptr<FlipperPlugin> FlipperClient::getPlugin(
    const std::string& identifier) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (plugins_.find(identifier) == plugins_.end()) {
    return nullptr;
  }
  return plugins_.at(identifier);
}

bool FlipperClient::hasPlugin(const std::string& identifier) {
  std::lock_guard<std::mutex> lock(mutex_);
  return plugins_.find(identifier) != plugins_.end();
}

void FlipperClient::connect(std::shared_ptr<FlipperPlugin> plugin) {
  if (connections_.find(plugin->identifier()) == connections_.end()) {
    auto& conn = connections_[plugin->identifier()];
    conn = std::make_shared<FlipperConnectionImpl>(
        socket_.get(), plugin->identifier());
    plugin->didConnect(conn);
  }
}

void FlipperClient::disconnect(std::shared_ptr<FlipperPlugin> plugin) {
  const auto& conn = connections_.find(plugin->identifier());
  if (conn != connections_.end()) {
    connections_.erase(plugin->identifier());
    plugin->didDisconnect();
  }
}

void FlipperClient::refreshPlugins() {
  performAndReportError([this]() {
    dynamic message = dynamic::object("method", "refreshPlugins");
    socket_->sendMessage(message);
  });
}

void FlipperClient::onConnected() {
  performAndReportError([this]() {
    log("FlipperClient::onConnected");

    std::lock_guard<std::mutex> lock(mutex_);
    connected_ = true;
  });
}

void FlipperClient::onDisconnected() {
  performAndReportError([this]() {
    log("FlipperClient::onDisconnected");
    auto step = flipperState_->start("Trigger onDisconnected callbacks");
    std::lock_guard<std::mutex> lock(mutex_);
    connected_ = false;
    for (const auto& iter : plugins_) {
      disconnect(iter.second);
    }
    step->complete();
  });
}

void FlipperClient::onMessageReceived(
    const dynamic& message,
    std::unique_ptr<FlipperResponder> uniqueResponder) {
  // Convert to shared pointer so we can hold on to it while passing it to the
  // plugin, and still use it to respond with an error if we catch an exception.
  std::shared_ptr<FlipperResponder> responder = std::move(uniqueResponder);
  try {
    std::lock_guard<std::mutex> lock(mutex_);
    const auto& method = message["method"];
    const auto& params = message.getDefault("params");

    if (method == "getPlugins") {
      dynamic identifiers = dynamic::array();
      for (const auto& elem : plugins_) {
        identifiers.push_back(elem.first);
      }
      dynamic response = dynamic::object("plugins", identifiers);
      responder->success(response);
      return;
    }

    if (method == "getBackgroundPlugins") {
      dynamic identifiers = dynamic::array();
      for (const auto& elem : plugins_) {
        if (elem.second->runInBackground()) {
          identifiers.push_back(elem.first);
        }
      }
      dynamic response = dynamic::object("plugins", identifiers);
      responder->success(response);
      return;
    }

    if (method == "init") {
      const auto identifier = params["plugin"].getString();
      if (plugins_.find(identifier) == plugins_.end()) {
        std::string errorMessage = "Plugin " + identifier +
            " not found for method " + method.getString();
        log(errorMessage);
        responder->error(folly::dynamic::object("message", errorMessage)(
            "name", "PluginNotFound"));
        return;
      }
      const auto plugin = plugins_.at(identifier);
      connect(plugin);
      return;
    }

    if (method == "deinit") {
      const auto identifier = params["plugin"].getString();
      if (plugins_.find(identifier) == plugins_.end()) {
        std::string errorMessage = "Plugin " + identifier +
            " not found for method " + method.getString();
        log(errorMessage);
        responder->error(folly::dynamic::object("message", errorMessage)(
            "name", "PluginNotFound"));
        return;
      }
      const auto plugin = plugins_.at(identifier);
      disconnect(plugin);
      return;
    }

    if (method == "execute") {
      const auto identifier = params["api"].getString();
      if (connections_.find(identifier) == connections_.end()) {
        std::string errorMessage = "Connection " + identifier +
            " not found for method " + method.getString();
        log(errorMessage);
        responder->error(folly::dynamic::object("message", errorMessage)(
            "name", "ConnectionNotFound"));
        return;
      }
      const auto& conn = connections_.at(params["api"].getString());
      conn->call(
          params["method"].getString(), params.getDefault("params"), responder);
      return;
    }

    if (method == "isMethodSupported") {
      const auto identifier = params["api"].getString();
      if (connections_.find(identifier) == connections_.end()) {
        std::string errorMessage = "Connection " + identifier +
            " not found for method " + method.getString();
        log(errorMessage);
        responder->error(folly::dynamic::object("message", errorMessage)(
            "name", "ConnectionNotFound"));
        return;
      }
      const auto& conn = connections_.at(params["api"].getString());
      bool isSupported = conn->hasReceiver(params["method"].getString());
      responder->success(dynamic::object("isSupported", isSupported));
      return;
    }

    dynamic response =
        dynamic::object("message", "Received unknown method: " + method);
    responder->error(response);
  } catch (std::exception& e) {
    log(std::string("Error: ") + e.what());
    if (responder) {
      responder->error(dynamic::object("message", e.what())(
          "stacktrace", callstack())("name", e.what()));
    }
  } catch (...) {
    log("Unknown error suppressed in FlipperClient");
    if (responder) {
      responder->error(dynamic::object(
          "message",
          "Unknown error during " + message["method"] + ". " +
              folly::toJson(message))("stacktrace", callstack())(
          "name", "Unknown"));
    }
  }
}

std::string FlipperClient::callstack() {
#if __APPLE__
  // For some iOS apps, __Unwind_Backtrace symbol wasn't found in sandcastle
  // builds, thus, for iOS apps, using backtrace c function.
  void* callstack[2048];
  int frames = backtrace(callstack, 2048);
  char** strs = backtrace_symbols(callstack, frames);
  std::string output = "";
  for (int i = 0; i < frames; ++i) {
    output.append(strs[i]);
    output.append("\n");
  }
  return output;
#elif __ANDROID__
  const size_t max = 2048;
  void* buffer[max];
  std::ostringstream oss;

  dumpBacktrace(oss, buffer, captureBacktrace(buffer, max));
  std::string output = std::string(oss.str().c_str());
  return output;
#else
  return "";
#endif
}
void FlipperClient::performAndReportError(const std::function<void()>& func) {
#if FLIPPER_ENABLE_CRASH
  // To debug the stack trace and an exception turn on the compiler flag
  // FLIPPER_ENABLE_CRASH
  func();
#else
  try {
    func();
  } catch (std::exception& e) {
    handleError(e);
  } catch (std::exception* e) {
    if (e) {
      handleError(*e);
    }
  } catch (...) {
    // Generic catch block for the exception of type not belonging to
    // std::exception
    log("Unknown error suppressed in FlipperClient");
  }
#endif
}

void FlipperClient::handleError(std::exception& e) {
  if (connected_) {
    std::string callstack = this->callstack();
    dynamic message = dynamic::object(
        "error",
        dynamic::object("message", e.what())("stacktrace", callstack)(
            "name", e.what()));
    socket_->sendMessage(message);
  } else {
    log("Error: " + std::string(e.what()));
  }
}

std::string FlipperClient::getState() {
  return flipperState_->getState();
}

std::vector<StateElement> FlipperClient::getStateElements() {
  return flipperState_->getStateElements();
}

} // namespace flipper
} // namespace facebook

#endif
