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
#include "rsocket/benchmarks/Latch.h"
#include "rsocket/benchmarks/Throughput.h"

#include <folly/Benchmark.h>
#include <folly/init/Init.h>
#include <folly/portability/GFlags.h>

#include "rsocket/RSocket.h"
#include "yarpl/Single.h"

using namespace rsocket;

constexpr size_t kMessageLen = 32;

DEFINE_int32(server_threads, 8, "number of server threads to run");
DEFINE_int32(
    override_client_threads,
    0,
    "control the number of client threads (defaults to the number of clients)");
DEFINE_int32(clients, 10, "number of clients to run");
DEFINE_int32(
    items,
    1000000,
    "number of request-response requests to send, in total");

namespace {

class Observer : public yarpl::single::SingleObserverBase<Payload> {
 public:
  explicit Observer(Latch& latch) : latch_{latch} {}

  void onSubscribe(std::shared_ptr<yarpl::single::SingleSubscription>
                       subscription) override {
    yarpl::single::SingleObserverBase<Payload>::onSubscribe(
        std::move(subscription));
  }

  void onSuccess(Payload) override {
    latch_.post();
    yarpl::single::SingleObserverBase<Payload>::onSuccess({});
  }

  void onError(folly::exception_wrapper) override {
    latch_.post();
    yarpl::single::SingleObserverBase<Payload>::onError({});
  }

 private:
  Latch& latch_;
};
} // namespace

BENCHMARK(RequestResponseThroughput, n) {
  (void)n;

  Latch latch{static_cast<size_t>(FLAGS_items)};

  std::unique_ptr<Fixture> fixture;
  Fixture::Options opts;

  BENCHMARK_SUSPEND {
    auto responder =
        std::make_shared<FixedResponder>(std::string(kMessageLen, 'a'));

    opts.serverThreads = FLAGS_server_threads;
    opts.clients = FLAGS_clients;
    if (FLAGS_override_client_threads > 0) {
      opts.clientThreads = FLAGS_override_client_threads;
    }

    fixture = std::make_unique<Fixture>(opts, std::move(responder));

    LOG(INFO) << "Running:";
    LOG(INFO) << "  Server with " << opts.serverThreads << " threads.";
    LOG(INFO) << "  " << opts.clients << " clients across "
              << fixture->workers.size() << " threads.";
    LOG(INFO) << "  Running " << FLAGS_items << " requests in total";
  }

  for (int i = 0; i < FLAGS_items; ++i) {
    auto& client = fixture->clients[i % opts.clients];
    client->getRequester()
        ->requestResponse(Payload("RequestResponseTcp"))
        ->subscribe(std::make_shared<Observer>(latch));
  }

  constexpr std::chrono::minutes timeout{5};
  if (!latch.timed_wait(timeout)) {
    LOG(ERROR) << "Timed out!";
  }
}
