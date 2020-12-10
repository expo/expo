/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FlipperRSocketResponder.h"
#include <folly/json.h>
#include <rsocket/RSocket.h>
#include "FireAndForgetBasedFlipperResponder.h"
#include "FlipperConnectionManagerImpl.h"
#include "FlipperResponderImpl.h"
#include "Log.h"

using folly::dynamic;

namespace facebook {
namespace flipper {

rsocket::Payload toRSocketPayload(dynamic data);

void FlipperRSocketResponder::handleFireAndForget(
    rsocket::Payload request,
    rsocket::StreamId streamId) {
  const auto payload = request.moveDataToString();
  std::unique_ptr<FireAndForgetBasedFlipperResponder> responder;
  auto message = folly::parseJson(payload);
  auto idItr = message.find("id");
  if (idItr == message.items().end()) {
    responder =
        std::make_unique<FireAndForgetBasedFlipperResponder>(websocket_);
  } else {
    responder = std::make_unique<FireAndForgetBasedFlipperResponder>(
        websocket_, idItr->second.getInt());
  }

  websocket_->onMessageReceived(
      folly::parseJson(payload), std::move(responder));
}

std::shared_ptr<yarpl::single::Single<rsocket::Payload>>
FlipperRSocketResponder::handleRequestResponse(
    rsocket::Payload request,
    rsocket::StreamId streamId) {
  const auto requestString = request.moveDataToString();

  auto dynamicSingle = yarpl::single::Single<folly::dynamic>::create(
      [payload = std::move(requestString), this](auto observer) {
        auto responder = std::make_unique<FlipperResponderImpl>(observer);
        websocket_->onMessageReceived(
            folly::parseJson(payload), std::move(responder));
      });

  auto rsocketSingle = yarpl::single::Single<rsocket::Payload>::create(
      [payload = std::move(requestString), dynamicSingle, this](auto observer) {
        observer->onSubscribe(yarpl::single::SingleSubscriptions::empty());
        dynamicSingle->subscribe(
            [observer, this](folly::dynamic d) {
              eventBase_->runInEventBaseThread([observer, d]() {
                try {
                  observer->onSuccess(toRSocketPayload(d));

                } catch (std::exception& e) {
                  log(e.what());
                  observer->onError(e);
                }
              });
            },
            [observer, this](folly::exception_wrapper e) {
              eventBase_->runInEventBaseThread(
                  [observer, e]() { observer->onError(e); });
            });
      });

  return rsocketSingle;
}

} // namespace flipper
} // namespace facebook
