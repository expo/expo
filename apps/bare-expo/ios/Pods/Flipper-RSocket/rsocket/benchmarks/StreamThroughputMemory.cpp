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

#include "rsocket/benchmarks/Throughput.h"

#include <folly/Benchmark.h>
#include <folly/Synchronized.h>
#include <folly/init/Init.h>
#include <folly/io/async/ScopedEventBaseThread.h>
#include <folly/portability/GFlags.h>
#include <folly/synchronization/Baton.h>

#include "rsocket/RSocket.h"
#include "yarpl/Flowable.h"

using namespace rsocket;

constexpr size_t kMessageLen = 32;

DEFINE_int32(items, 1000000, "number of items in stream");

namespace {

/// State shared across the client and server DirectDuplexConnections.
struct State {
  /// Whether one of the two connections has been destroyed.
  folly::Synchronized<bool> destroyed;
};

/// DuplexConnection that talks to another DuplexConnection via memory.
class DirectDuplexConnection : public DuplexConnection {
 public:
  DirectDuplexConnection(std::shared_ptr<State> state, folly::EventBase& evb)
      : state_{std::move(state)}, evb_{evb} {}

  ~DirectDuplexConnection() override {
    *state_->destroyed.wlock() = true;
  }

  // Tie two DirectDuplexConnections together so they can talk to each other.
  void tie(DirectDuplexConnection* other) {
    other_ = other;
    other_->other_ = this;
  }

  void setInput(std::shared_ptr<DuplexConnection::Subscriber> input) override {
    input_ = std::move(input);
  }

  void send(std::unique_ptr<folly::IOBuf> buf) override {
    auto destroyed = state_->destroyed.rlock();
    if (*destroyed || !other_) {
      return;
    }

    other_->evb_.runInEventBaseThread(
        [state = state_, other = other_, b = std::move(buf)]() mutable {
          auto destroyed = state->destroyed.rlock();
          if (*destroyed) {
            return;
          }

          other->input_->onNext(std::move(b));
        });
  }

 private:
  std::shared_ptr<State> state_;
  folly::EventBase& evb_;

  DirectDuplexConnection* other_{nullptr};

  std::shared_ptr<DuplexConnection::Subscriber> input_;
};

class Acceptor : public ConnectionAcceptor {
 public:
  explicit Acceptor(std::shared_ptr<State> state) : state_{std::move(state)} {}

  void setClientConnection(DirectDuplexConnection* connection) {
    client_ = connection;
  }

  void start(OnDuplexConnectionAccept onAccept) override {
    worker_.getEventBase()->runInEventBaseThread(
        [this, onAccept = std::move(onAccept)]() mutable {
          auto server = std::make_unique<DirectDuplexConnection>(
              std::move(state_), *worker_.getEventBase());
          server->tie(client_);
          onAccept(std::move(server), *worker_.getEventBase());
        });
  }

  void stop() override {}

  folly::Optional<uint16_t> listeningPort() const override {
    return folly::none;
  }

 private:
  std::shared_ptr<State> state_;

  DirectDuplexConnection* client_{nullptr};

  folly::ScopedEventBaseThread worker_;
};

class Factory : public ConnectionFactory {
 public:
  Factory() {
    auto state = std::make_shared<State>();

    connection_ = std::make_unique<DirectDuplexConnection>(
        state, *worker_.getEventBase());

    auto acceptor = std::make_unique<Acceptor>(state);
    acceptor_ = acceptor.get();

    acceptor_->setClientConnection(connection_.get());

    auto responder =
        std::make_shared<FixedResponder>(std::string(kMessageLen, 'a'));

    server_ = std::make_unique<RSocketServer>(std::move(acceptor));
    server_->start([responder](const SetupParameters&) { return responder; });
  }

  folly::Future<ConnectedDuplexConnection> connect(
      ProtocolVersion,
      ResumeStatus /* unused */) override {
    return folly::via(worker_.getEventBase(), [this] {
      return ConnectedDuplexConnection{std::move(connection_),
                                       *worker_.getEventBase()};
    });
  }

 private:
  std::unique_ptr<DirectDuplexConnection> connection_;

  std::unique_ptr<rsocket::RSocketServer> server_;
  Acceptor* acceptor_{nullptr};

  folly::ScopedEventBaseThread worker_;
};

std::shared_ptr<RSocketClient> makeClient() {
  auto factory = std::make_unique<Factory>();
  return RSocket::createConnectedClient(std::move(factory)).get();
}
} // namespace

BENCHMARK(StreamThroughput, n) {
  (void)n;

  std::shared_ptr<RSocketClient> client;
  std::shared_ptr<BoundedSubscriber> subscriber;

  folly::ScopedEventBaseThread worker;

  Latch latch{1};

  BENCHMARK_SUSPEND {
    LOG(INFO) << "  Running with " << FLAGS_items << " items";

    client = makeClient();
  }

  client->getRequester()
      ->requestStream(Payload("InMemoryStream"))
      ->subscribe(std::make_shared<BoundedSubscriber>(latch, FLAGS_items));

  constexpr std::chrono::minutes timeout{5};
  if (!latch.timed_wait(timeout)) {
    LOG(ERROR) << "Timed out!";
  }
}
