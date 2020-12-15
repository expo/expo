// Copyright (c) Facebook, Inc. and its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#pragma once

#include <folly/io/async/EventBase.h>

#include "yarpl/Flowable.h"
#include "yarpl/Single.h"

#include "rsocket/Payload.h"
#include "rsocket/statemachine/RSocketStateMachine.h"

namespace rsocket {

/**
 * Request APIs to submit requests on an RSocket connection.
 *
 * This is most commonly used by an RSocketClient, but due to the symmetric
 * nature of RSocket, this can be used from server->client as well.
 *
 * For context within the overall RSocket protocol:
 *
 * - Client: The side initiating a connection.
 * - Server: The side accepting connections from clients.
 * - Connection: The instance of a transport session between client and server.
 * - Requester: The side sending a request.
 *       A connection has at most 2 Requesters. One in each direction.
 * - Responder: The side receiving a request.
 *       A connection has at most 2 Responders. One in each direction.
 *
 * See https://github.com/rsocket/rsocket/blob/master/Protocol.md#terminology
 * for more information on how this fits into the RSocket protocol terminology.
 */
class RSocketRequester {
 public:
  RSocketRequester(
      std::shared_ptr<rsocket::RSocketStateMachine> srs,
      folly::EventBase& eventBase);

  virtual ~RSocketRequester(); // implementing for logging right now

  RSocketRequester(const RSocketRequester&) = delete;
  RSocketRequester(RSocketRequester&&) = delete;

  RSocketRequester& operator=(const RSocketRequester&) = delete;
  RSocketRequester& operator=(RSocketRequester&&) = delete;

  /**
   * Send a single request and get a response stream.
   *
   * Interaction model details can be found at
   * https://github.com/ReactiveSocket/reactivesocket/blob/master/Protocol.md#request-stream
   */
  virtual std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
  requestStream(rsocket::Payload request);

  /**
   * Start a channel (streams in both directions).
   *
   * Interaction model details can be found at
   * https://github.com/ReactiveSocket/reactivesocket/blob/master/Protocol.md#request-channel
   */
  virtual std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
  requestChannel(
      std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>> requests);

  /**
   * As requestStream function accepts an initial request, this version of
   * requestChannel also accepts an initial request.
   * @see requestChannel
   * @see requestStream
   */
  virtual std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
  requestChannel(
      Payload request,
      std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>> requests);

  /**
   * Send a single request and get a single response.
   *
   * Interaction model details can be found at
   * https://github.com/ReactiveSocket/reactivesocket/blob/master/Protocol.md#stream-sequences-request-response
   */
  virtual std::shared_ptr<yarpl::single::Single<rsocket::Payload>>
  requestResponse(rsocket::Payload request);

  /**
   * Send a single Payload with no response.
   *
   * The returned Single<void> invokes onSuccess or onError
   * based on client-side success or failure. Once the payload is
   * sent to the network it is "forgotten" and the Single<void> will
   * be finished with no further response indicating success
   * or failure on the server.
   *
   * Interaction model details can be found at
   * https://github.com/ReactiveSocket/reactivesocket/blob/master/Protocol.md#request-fire-n-forget
   */
  virtual std::shared_ptr<yarpl::single::Single<void>> fireAndForget(
      rsocket::Payload request);

  /**
   * Send metadata without response.
   */
  virtual void metadataPush(std::unique_ptr<folly::IOBuf> metadata);

  virtual void closeSocket();

 protected:
  virtual std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
  requestChannel(
      Payload request,
      bool hasInitialRequest,
      std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>> requests);

  std::shared_ptr<rsocket::RSocketStateMachine> stateMachine_;
  folly::EventBase* eventBase_;
};
} // namespace rsocket
