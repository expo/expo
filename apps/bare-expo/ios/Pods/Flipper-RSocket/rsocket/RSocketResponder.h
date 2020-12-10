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

#include "rsocket/Payload.h"
#include "rsocket/framing/FrameHeader.h"
#include "yarpl/Flowable.h"
#include "yarpl/Single.h"

namespace rsocket {

class RSocketResponderCore {
 public:
  virtual ~RSocketResponderCore() = default;

  virtual void handleFireAndForget(Payload request, StreamId streamId);

  virtual void handleMetadataPush(std::unique_ptr<folly::IOBuf> metadata);

  virtual std::shared_ptr<yarpl::flowable::Subscriber<Payload>>
  handleRequestChannel(
      Payload request,
      StreamId streamId,
      std::shared_ptr<yarpl::flowable::Subscriber<Payload>> response) noexcept;

  virtual void handleRequestStream(
      Payload request,
      StreamId streamId,
      std::shared_ptr<yarpl::flowable::Subscriber<Payload>> response) noexcept;

  virtual void handleRequestResponse(
      Payload request,
      StreamId streamId,
      std::shared_ptr<yarpl::single::SingleObserver<Payload>>
          response) noexcept;
};

/**
 * Responder APIs to handle requests on an RSocket connection.
 *
 * This is most commonly used by an RSocketServer, but due to the symmetric
 * nature of RSocket, this can be used on the client as well.
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
class RSocketResponder {
 public:
  virtual ~RSocketResponder() = default;

  /**
   * Called when a new `requestResponse` occurs from an RSocketRequester.
   *
   * Returns a Single with the response.
   */
  virtual std::shared_ptr<yarpl::single::Single<Payload>> handleRequestResponse(
      Payload request,
      StreamId streamId);

  /**
   * Called when a new `requestStream` occurs from an RSocketRequester.
   *
   * Returns a Flowable with the response stream.
   */
  virtual std::shared_ptr<yarpl::flowable::Flowable<Payload>>
  handleRequestStream(Payload request, StreamId streamId);

  /**
   * Called when a new `requestChannel` occurs from an RSocketRequester.
   *
   * Returns a Flowable with the response stream.
   */
  virtual std::shared_ptr<yarpl::flowable::Flowable<Payload>>
  handleRequestChannel(
      Payload request,
      std::shared_ptr<yarpl::flowable::Flowable<Payload>> requestStream,
      StreamId streamId);

  /**
   * Called when a new `fireAndForget` occurs from an RSocketRequester.
   *
   * No response.
   */
  virtual void handleFireAndForget(
      rsocket::Payload request,
      rsocket::StreamId streamId);

  /**
   * Called when a new `metadataPush` occurs from an RSocketRequester.
   *
   * No response.
   */
  virtual void handleMetadataPush(std::unique_ptr<folly::IOBuf> metadata);
};

class RSocketResponderAdapter : public RSocketResponderCore {
 public:
  explicit RSocketResponderAdapter(std::shared_ptr<RSocketResponder> inner)
      : inner_(std::move(inner)) {}
  virtual ~RSocketResponderAdapter() = default;

  /// Internal method for handling channel requests, not intended to be used by
  /// application code.
  std::shared_ptr<yarpl::flowable::Subscriber<Payload>> handleRequestChannel(
      Payload request,
      StreamId streamId,
      std::shared_ptr<yarpl::flowable::Subscriber<Payload>>
          response) noexcept override;

  /// Internal method for handling stream requests, not intended to be used
  /// by application code.
  void handleRequestStream(
      Payload request,
      StreamId streamId,
      std::shared_ptr<yarpl::flowable::Subscriber<Payload>>
          response) noexcept override;

  /// Internal method for handling request-response requests, not intended to be
  /// used by application code.
  void handleRequestResponse(
      Payload request,
      StreamId streamId,
      std::shared_ptr<yarpl::single::SingleObserver<Payload>>
          response) noexcept override;

  void handleFireAndForget(Payload request, StreamId streamId) override;
  void handleMetadataPush(std::unique_ptr<folly::IOBuf> buf) override;

 private:
  std::shared_ptr<RSocketResponder> inner_;
};
} // namespace rsocket
