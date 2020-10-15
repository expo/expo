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

#include <folly/ExceptionWrapper.h>
#include "rsocket/DuplexConnection.h"
#include "rsocket/internal/Common.h"
#include "yarpl/flowable/Subscription.h"

#include "rsocket/framing/FrameTransport.h"

namespace rsocket {

class FrameProcessor;

class FrameTransportImpl
    : public FrameTransport,
      /// Registered as an input in the DuplexConnection.
      public DuplexConnection::Subscriber,
      public std::enable_shared_from_this<FrameTransportImpl> {
 public:
  explicit FrameTransportImpl(std::unique_ptr<DuplexConnection> connection);
  ~FrameTransportImpl();

  void setFrameProcessor(std::shared_ptr<FrameProcessor>) override;

  /// Writes the frame directly to output. If the connection was closed it will
  /// drop the frame.
  void outputFrameOrDrop(std::unique_ptr<folly::IOBuf>) override;

  /// Cancel the input and close the underlying connection.
  void close() override;

  bool isClosed() const {
    return !connection_;
  }

  DuplexConnection* getConnection() override {
    return connection_.get();
  }

  bool isConnectionFramed() const override;

  // Subscriber.

  void onSubscribe(std::shared_ptr<yarpl::flowable::Subscription>) override;
  void onNext(std::unique_ptr<folly::IOBuf>) override;
  void onComplete() override;
  void onError(folly::exception_wrapper) override;

 private:
  void connect();

  /// Terminates the FrameProcessor.  Will queue up the exception if no
  /// processor is set, overwriting any previously queued exception.
  void terminateProcessor(folly::exception_wrapper);

  std::shared_ptr<FrameProcessor> frameProcessor_;
  std::shared_ptr<DuplexConnection> connection_;

  std::shared_ptr<DuplexConnection::Subscriber> connectionOutput_;
  std::shared_ptr<yarpl::flowable::Subscription> connectionInputSub_;
};

} // namespace rsocket
