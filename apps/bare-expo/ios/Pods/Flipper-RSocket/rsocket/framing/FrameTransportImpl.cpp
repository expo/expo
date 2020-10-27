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

#include "rsocket/framing/FrameTransportImpl.h"

#include <folly/ExceptionWrapper.h>
#include <folly/io/IOBuf.h>
#include <glog/logging.h>

#include "rsocket/DuplexConnection.h"
#include "rsocket/framing/FrameProcessor.h"

namespace rsocket {

using namespace yarpl::flowable;

FrameTransportImpl::FrameTransportImpl(
    std::unique_ptr<DuplexConnection> connection)
    : connection_(std::move(connection)) {
  CHECK(connection_);
}

FrameTransportImpl::~FrameTransportImpl() {
  VLOG(1) << "~FrameTransport (" << this << ")";
}

void FrameTransportImpl::connect() {
  CHECK(connection_);

  // The onSubscribe call on the previous line may have called the terminating
  // signal which would call disconnect/close.
  if (connection_) {
    // This may call ::onSubscribe in-line, which calls ::request on the
    // provided subscription, which might deliver frames in-line.  It can also
    // call onComplete which will call disconnect/close and reset the
    // connection_ while still inside of the connection_::setInput method.  We
    // will create a hard reference for that case and keep the object alive
    // until setInput method returns
    auto connectionCopy = connection_;
    connectionCopy->setInput(shared_from_this());
  }
}

void FrameTransportImpl::setFrameProcessor(
    std::shared_ptr<FrameProcessor> frameProcessor) {
  frameProcessor_ = std::move(frameProcessor);
  if (frameProcessor_) {
    CHECK(!isClosed());
    connect();
  }
}

void FrameTransportImpl::close() {
  // Make sure we never try to call back into the processor.
  frameProcessor_ = nullptr;

  if (!connection_) {
    return;
  }
  connection_.reset();

  if (auto subscription = std::move(connectionInputSub_)) {
    subscription->cancel();
  }
}

void FrameTransportImpl::onSubscribe(
    std::shared_ptr<Subscription> subscription) {
  if (!connection_) {
    return;
  }

  CHECK(!connectionInputSub_);
  CHECK(frameProcessor_);
  connectionInputSub_ = std::move(subscription);
  connectionInputSub_->request(std::numeric_limits<int64_t>::max());
}

void FrameTransportImpl::onNext(std::unique_ptr<folly::IOBuf> frame) {
  // Copy in case frame processing calls through to close().
  if (auto const processor = frameProcessor_) {
    processor->processFrame(std::move(frame));
  }
}

void FrameTransportImpl::terminateProcessor(folly::exception_wrapper ex) {
  // This method can be executed multiple times while terminating.

  if (!frameProcessor_) {
    // already terminated
    return;
  }

  if (auto conn_sub = std::move(connectionInputSub_)) {
    conn_sub->cancel();
  }

  auto frameProcessor = std::move(frameProcessor_);
  VLOG(3) << this << " terminating frame processor ex=" << ex.what();
  frameProcessor->onTerminal(std::move(ex));
}

void FrameTransportImpl::onComplete() {
  VLOG(3) << "FrameTransport received onComplete";
  terminateProcessor(folly::exception_wrapper());
}

void FrameTransportImpl::onError(folly::exception_wrapper ex) {
  VLOG(3) << "FrameTransport received onError: " << ex.what();
  terminateProcessor(std::move(ex));
}

void FrameTransportImpl::outputFrameOrDrop(
    std::unique_ptr<folly::IOBuf> frame) {
  if (connection_) {
    connection_->send(std::move(frame));
  }
}

bool FrameTransportImpl::isConnectionFramed() const {
  CHECK(connection_);
  return connection_->isFramed();
}

} // namespace rsocket
