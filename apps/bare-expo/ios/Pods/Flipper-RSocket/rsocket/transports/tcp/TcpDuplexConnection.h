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

#include <boost/smart_ptr/intrusive_ptr.hpp>
#include <folly/io/async/AsyncSocket.h>
#include <folly/io/async/AsyncTransport.h>

#include "rsocket/DuplexConnection.h"
#include "rsocket/RSocketStats.h"
#include "yarpl/flowable/Subscriber.h"

namespace rsocket {

class TcpReaderWriter;

class TcpDuplexConnection : public DuplexConnection {
 public:
  explicit TcpDuplexConnection(
      folly::AsyncTransportWrapper::UniquePtr&& socket,
      std::shared_ptr<RSocketStats> stats = RSocketStats::noop());
  ~TcpDuplexConnection();

  void send(std::unique_ptr<folly::IOBuf>) override;

  void setInput(std::shared_ptr<DuplexConnection::Subscriber>) override;

  // Only to be used for observation purposes.
  folly::AsyncTransportWrapper* getTransport();

 private:
  boost::intrusive_ptr<TcpReaderWriter> tcpReaderWriter_;
  std::shared_ptr<RSocketStats> stats_;
};
} // namespace rsocket
