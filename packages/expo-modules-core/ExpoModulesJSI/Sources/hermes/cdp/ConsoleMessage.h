/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_CDPCONSOLEMESSAGESTORAGE_H
#define HERMES_CDP_CDPCONSOLEMESSAGESTORAGE_H

#include <optional>
#include <queue>
#include <unordered_map>

#include <jsi/jsi.h>

#include <hermes/Public/DebuggerTypes.h>

namespace facebook {
namespace hermes {
namespace cdp {

/// Controls the max number of message to cached in \p consoleMessageCache_. The
/// value here is chosen to match what Chromium uses in their CDP
/// implementation.
static const int kMaxCachedConsoleMessages = 1000;

enum class ConsoleAPIType {
  kLog,
  kDebug,
  kInfo,
  kError,
  kWarning,
  kDir,
  kDirXML,
  kTable,
  kTrace,
  kStartGroup,
  kStartGroupCollapsed,
  kEndGroup,
  kClear,
  kAssert,
  kTimeEnd,
  kCount
};

struct ConsoleMessage {
  double timestamp;
  ConsoleAPIType type;
  std::vector<jsi::Value> args;
  debugger::StackTrace stackTrace;

  ConsoleMessage(
      double timestamp,
      ConsoleAPIType type,
      std::vector<jsi::Value> args,
      debugger::StackTrace stackTrace = {})
      : timestamp(timestamp),
        type(type),
        args(std::move(args)),
        stackTrace(stackTrace) {}
};

class ConsoleMessageStorage {
 public:
  ConsoleMessageStorage(size_t maxCachedMessages = kMaxCachedConsoleMessages);

  void addMessage(ConsoleMessage message);
  void clear();

  const std::deque<ConsoleMessage> &messages() const;
  size_t discarded() const;
  std::optional<double> oldestTimestamp() const;

 private:
  /// Maximum number of messages to cache.
  size_t maxCachedMessages_;
  /// Counts the number of console messages discarded when
  /// \p consoleMessageCache_ is full.
  size_t numConsoleMessagesDiscardedFromCache_ = 0;
  /// Cache for storing console messages. Earlier messages are discarded when
  /// the cache is full. The choice to use a std::deque is for fast operations
  /// at the beginning and the end, so that adding to the cache and discarding
  /// from the cache are fast.
  std::deque<ConsoleMessage> consoleMessageCache_{};
};

class CDPAgent;

/// Token that identifies a specific subscription to console messages.
using ConsoleMessageRegistration = uint32_t;

/// Dispatcher to deliver console messages to all registered subscribers.
/// Everything in this class must be used exclusively from the runtime thread.
class ConsoleMessageDispatcher {
 public:
  ConsoleMessageDispatcher() {}
  ~ConsoleMessageDispatcher() {}

  /// Register a subscriber and return a token that can be used to
  /// unregister in the future. Must only be called from the runtime thread.
  ConsoleMessageRegistration subscribe(
      std::function<void(const ConsoleMessage &)> handler) {
    auto token = ++tokenCounter_;
    subscribers_[token] = handler;
    return token;
  }

  /// Unregister a subscriber using the token returned from registration.
  /// Must only be called from the runtime thread.
  void unsubscribe(ConsoleMessageRegistration token) {
    subscribers_.erase(token);
  }

  /// Deliver a new console message to each subscriber.  Must only be called
  /// from the runtime thread.
  void deliverMessage(const ConsoleMessage &message) {
    for (auto &pair : subscribers_) {
      pair.second(message);
    }
  }

 private:
  /// Collection of subscribers, identified by registration token.
  std::unordered_map<
      ConsoleMessageRegistration,
      std::function<void(const ConsoleMessage &)>>
      subscribers_;

  /// Counter to generate unique registration tokens.
  ConsoleMessageRegistration tokenCounter_ = 0;
};

} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_CDPCONSOLEMESSAGESTORAGE_H
