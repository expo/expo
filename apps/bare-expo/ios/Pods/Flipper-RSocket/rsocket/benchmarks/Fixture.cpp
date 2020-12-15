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

#include "rsocket/benchmarks/Fixture.h"

#include "rsocket/RSocket.h"
#include "rsocket/transports/tcp/TcpConnectionAcceptor.h"
#include "rsocket/transports/tcp/TcpConnectionFactory.h"

namespace rsocket {

namespace {

std::shared_ptr<RSocketClient> makeClient(
    folly::EventBase* eventBase,
    folly::SocketAddress address) {
  auto factory =
      std::make_unique<TcpConnectionFactory>(*eventBase, std::move(address));
  return RSocket::createConnectedClient(std::move(factory)).get();
}
} // namespace

Fixture::Fixture(
    Fixture::Options fixtureOpts,
    std::shared_ptr<RSocketResponder> responder)
    : options{std::move(fixtureOpts)} {
  TcpConnectionAcceptor::Options opts;
  opts.address = folly::SocketAddress{"0.0.0.0", 0};
  opts.threads = options.serverThreads;

  auto acceptor = std::make_unique<TcpConnectionAcceptor>(std::move(opts));
  server = std::make_unique<RSocketServer>(std::move(acceptor));
  server->start([responder](const SetupParameters&) { return responder; });

  auto const numWorkers =
      options.clientThreads ? *options.clientThreads : options.clients;
  for (size_t i = 0; i < numWorkers; ++i) {
    workers.push_back(std::make_unique<folly::ScopedEventBaseThread>(
        "rsocket-client-thread"));
  }

  const folly::SocketAddress actual{"127.0.0.1", *server->listeningPort()};

  for (size_t i = 0; i < options.clients; ++i) {
    auto worker = std::move(workers.front());
    workers.pop_front();
    clients.push_back(makeClient(worker->getEventBase(), actual));
    workers.push_back(std::move(worker));
  }
}
} // namespace rsocket
