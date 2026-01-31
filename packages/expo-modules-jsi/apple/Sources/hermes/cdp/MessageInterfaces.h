/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_MESSAGEINTERFACES_H
#define HERMES_CDP_MESSAGEINTERFACES_H

#include <memory>
#include <optional>
#include <string>
#include <unordered_map>
#include <variant>

#include <hermes/Parser/JSONParser.h>
#include <hermes/cdp/JSONValueInterfaces.h>

namespace facebook {
namespace hermes {
namespace cdp {
namespace message {
using namespace ::hermes::parser;

struct RequestHandler;

/// Serializable is an interface for objects that can be serialized to and from
/// JSON.
struct Serializable {
  virtual ~Serializable() = default;
  virtual JSONValue *toJsonVal(JSONFactory &factory) const = 0;

  std::string toJsonStr() const;
};

/// Requests are sent from the debugger to the target.
struct Request : public Serializable {
  using ParseResult = std::variant<std::unique_ptr<Request>, std::string>;
  static std::unique_ptr<Request> fromJson(const std::string &str);

  Request() = default;
  explicit Request(std::string method) : method(method) {}

  // accept dispatches to the appropriate handler method in RequestHandler based
  // on the type of the request.
  virtual void accept(RequestHandler &handler) const = 0;

  long long id = 0;
  std::string method;
};

/// Responses are sent from the target to the debugger in response to a Request.
struct Response : public Serializable {
  Response() = default;

  std::optional<long long> id = std::nullopt;
};

/// Notifications are sent from the target to the debugger. This is used to
/// notify the debugger about events that occur in the target, e.g. stopping
/// at a breakpoint.
struct Notification : public Serializable {
  Notification() = default;
  explicit Notification(std::string method) : method(method) {}

  std::string method;
};

} // namespace message
} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_MESSAGEINTERFACES_H
