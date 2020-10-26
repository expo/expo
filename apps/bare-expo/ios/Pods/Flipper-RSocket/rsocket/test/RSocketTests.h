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

#include <utility>

#include "rsocket/RSocket.h"

#include "rsocket/transports/tcp/TcpConnectionFactory.h"

namespace rsocket {
namespace tests {
namespace client_server {

class RSocketStatsFlowControl : public RSocketStats {
public:
  void frameWritten(FrameType frameType) {
    if (frameType == FrameType::REQUEST_N) {
      ++writeRequestN_;
    }
  }

  void frameRead(FrameType frameType) {
    if (frameType == FrameType::REQUEST_N) {
      ++readRequestN_;
    }
  }

public:
  int writeRequestN_{0};
  int readRequestN_{0};
};

std::unique_ptr<TcpConnectionFactory> getConnFactory(
    folly::EventBase* eventBase,
    uint16_t port);

std::unique_ptr<RSocketServer> makeServer(
    std::shared_ptr<rsocket::RSocketResponder> responder,
    std::shared_ptr<RSocketStats> stats = RSocketStats::noop());

std::unique_ptr<RSocketServer> makeResumableServer(
    std::shared_ptr<RSocketServiceHandler> serviceHandler);

std::unique_ptr<RSocketClient> makeClient(
    folly::EventBase* eventBase,
    uint16_t port,
    folly::EventBase* stateMachineEvb = nullptr,
    std::shared_ptr<RSocketStats> stats = RSocketStats::noop());

std::unique_ptr<RSocketClient> makeDisconnectedClient(
    folly::EventBase* eventBase);

folly::Future<std::unique_ptr<RSocketClient>> makeClientAsync(
    folly::EventBase* eventBase,
    uint16_t port,
    folly::EventBase* stateMachineEvb = nullptr,
    std::shared_ptr<RSocketStats> stats = RSocketStats::noop());

std::unique_ptr<RSocketClient> makeWarmResumableClient(
    folly::EventBase* eventBase,
    uint16_t port,
    std::shared_ptr<RSocketConnectionEvents> connectionEvents = nullptr,
    folly::EventBase* stateMachineEvb = nullptr);

std::unique_ptr<RSocketClient> makeColdResumableClient(
    folly::EventBase* eventBase,
    uint16_t port,
    ResumeIdentificationToken token,
    std::shared_ptr<ResumeManager> resumeManager,
    std::shared_ptr<ColdResumeHandler> resumeHandler,
    folly::EventBase* stateMachineEvb = nullptr);

} // namespace client_server

struct RSocketPayloadUtils {
  // ~30 megabytes, for metadata+data
  static constexpr size_t LargeRequestSize = 15 * 1024 * 1024;
  static std::string makeLongString(size_t size, std::string pattern) {
    while (pattern.size() < size) {
      pattern += pattern;
    }
    return pattern;
  }

  // Builds up an IOBuf consisting of chunks with the following sizes, and then
  // the rest tacked on the end in one big iobuf chunk
  static std::unique_ptr<folly::IOBuf> buildIOBufFromString(
      std::vector<size_t> const& sizes,
      std::string const& from) {
    folly::IOBufQueue bufQueue{folly::IOBufQueue::cacheChainLength()};
    size_t fromCursor = 0;
    size_t remaining = from.size();
    for (auto size : sizes) {
      if (remaining == 0)
        break;
      if (size > remaining) {
        size = remaining;
      }

      bufQueue.append(
          folly::IOBuf::copyBuffer(from.c_str() + fromCursor, size));

      fromCursor += size;
      remaining -= size;
    }

    if (remaining) {
      bufQueue.append(
          folly::IOBuf::copyBuffer(from.c_str() + fromCursor, remaining));
    }

    CHECK_EQ(bufQueue.chainLength(), from.size());

    auto ret = bufQueue.move();
    int numChainElems = 1;
    auto currentChainElem = ret.get()->next();
    while (currentChainElem != ret.get()) {
      numChainElems++;
      currentChainElem = currentChainElem->next();
    }
    CHECK_GE(numChainElems, sizes.size());

    // verify that the returned buffer has identical data
    auto str = ret->cloneAsValue().moveToFbString().toStdString();
    CHECK_EQ(str.size(), from.size());
    CHECK(str == from);

    return ret;
  }

  static void checkSameStrings(
      std::string const& got,
      std::string const& expect,
      std::string const& context) {
    CHECK_EQ(got.size(), expect.size())
        << "Got mismatched size " << context << " string (" << got.size()
        << " vs " << expect.size() << ")";
    CHECK(got == expect) << context << " mismatch between got and expected";
  }

  static void checkSameStrings(
      std::unique_ptr<folly::IOBuf> const& got,
      std::string const& expect,
      std::string const& context) {
    CHECK_EQ(got->computeChainDataLength(), expect.size())
        << "Mismatched size " << context << ", got "
        << got->computeChainDataLength() << " vs expect " << expect.size();

    size_t expect_cursor = 0;

    for (auto range : *got) {
      for (auto got_chr : range) {
        // perform redundant check to avoid gtest's CHECK overhead
        if (got_chr != expect[expect_cursor]) {
          CHECK_EQ(got_chr, expect[expect_cursor])
              << "mismatch at byte " << expect_cursor;
        }
        expect_cursor++;
      }
    }
  }
};

} // namespace tests
} // namespace rsocket
