/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef FOLLY_GEN_PARALLELMAP_H_
#error This file may only be included from folly/gen/ParallelMap.h
#endif

#include <atomic>
#include <cassert>
#include <exception>
#include <thread>
#include <type_traits>
#include <utility>
#include <vector>

#include <folly/Expected.h>
#include <folly/MPMCPipeline.h>
#include <folly/experimental/EventCount.h>
#include <folly/functional/Invoke.h>

namespace folly {
namespace gen {
namespace detail {

/**
 * PMap - Map in parallel (using threads). For producing a sequence of
 * values by passing each value from a source collection through a
 * predicate while running the predicate in parallel in different
 * threads.
 *
 * This type is usually used through the 'pmap' helper function:
 *
 *   auto squares = seq(1, 10) | pmap(fibonacci, 4) | sum;
 */
template <class Predicate>
class PMap : public Operator<PMap<Predicate>> {
  Predicate pred_;
  size_t nThreads_;

 public:
  PMap() = default;

  PMap(Predicate pred, size_t nThreads)
      : pred_(std::move(pred)), nThreads_(nThreads) {}

  template <
      class Value,
      class Source,
      class Input = typename std::decay<Value>::type,
      class Output =
          typename std::decay<invoke_result_t<Predicate, Value>>::type>
  class Generator
      : public GenImpl<Output, Generator<Value, Source, Input, Output>> {
    Source source_;
    Predicate pred_;
    const size_t nThreads_;

    using Result = folly::Expected<Output, std::exception_ptr>;
    class ExecutionPipeline {
      std::vector<std::thread> workers_;
      std::atomic<bool> done_{false};
      const Predicate& pred_;
      using Pipeline = MPMCPipeline<Input, Result>;
      Pipeline pipeline_;
      EventCount wake_;

     public:
      ExecutionPipeline(const Predicate& pred, size_t nThreads)
          : pred_(pred), pipeline_(nThreads, nThreads) {
        workers_.reserve(nThreads);
        for (size_t i = 0; i < nThreads; i++) {
          workers_.push_back(std::thread([this] { this->predApplier(); }));
        }
      }

      ~ExecutionPipeline() {
        assert(pipeline_.sizeGuess() == 0);
        assert(done_.load());
        for (auto& w : workers_) {
          w.join();
        }
      }

      void stop() {
        // prevent workers from consuming more than we produce.
        done_.store(true, std::memory_order_release);
        wake_.notifyAll();
      }

      bool write(Value&& value) {
        bool wrote = pipeline_.write(std::forward<Value>(value));
        if (wrote) {
          wake_.notify();
        }
        return wrote;
      }

      void blockingWrite(Value&& value) {
        pipeline_.blockingWrite(std::forward<Value>(value));
        wake_.notify();
      }

      bool read(Result& result) {
        return pipeline_.read(result);
      }

      void blockingRead(Result& result) {
        pipeline_.blockingRead(result);
      }

     private:
      void predApplier() {
        // Each thread takes a value from the pipeline_, runs the
        // predicate and enqueues the result. The pipeline preserves
        // ordering. NOTE: don't use blockingReadStage<0> to read from
        // the pipeline_ as there may not be any: end-of-data is signaled
        // separately using done_/wake_.
        Input in;
        for (;;) {
          auto key = wake_.prepareWait();

          typename Pipeline::template Ticket<0> ticket;
          if (pipeline_.template readStage<0>(ticket, in)) {
            wake_.cancelWait();
            try {
              Output out = pred_(std::move(in));
              pipeline_.template blockingWriteStage<0>(ticket, std::move(out));
            } catch (...) {
              pipeline_.template blockingWriteStage<0>(
                  ticket, makeUnexpected(std::current_exception()));
            }
            continue;
          }

          if (done_.load(std::memory_order_acquire)) {
            wake_.cancelWait();
            break;
          }

          // Not done_, but no items in the queue.
          wake_.wait(key);
        }
      }
    };

    static Output&& getOutput(Result& result) {
      if (result.hasError()) {
        std::rethrow_exception(std::move(result).error());
      }
      return std::move(result).value();
    }

   public:
    Generator(Source source, const Predicate& pred, size_t nThreads)
        : source_(std::move(source)),
          pred_(pred),
          nThreads_(nThreads ? nThreads : sysconf(_SC_NPROCESSORS_ONLN)) {}

    template <class Body>
    void foreach(Body&& body) const {
      ExecutionPipeline pipeline(pred_, nThreads_);

      size_t wrote = 0;
      size_t read = 0;
      source_.foreach([&](Value value) {
        if (pipeline.write(std::forward<Value>(value))) {
          // input queue not yet full, saturate it before we process
          // anything downstream
          ++wrote;
          return;
        }

        // input queue full; drain ready items from the queue
        Result result;
        while (pipeline.read(result)) {
          ++read;
          body(getOutput(result));
        }

        // write the value we were going to write before we made room.
        pipeline.blockingWrite(std::forward<Value>(value));
        ++wrote;
      });

      pipeline.stop();

      // flush the output queue
      while (read < wrote) {
        Result result;
        pipeline.blockingRead(result);
        ++read;
        body(getOutput(result));
      }
    }

    template <class Handler>
    bool apply(Handler&& handler) const {
      ExecutionPipeline pipeline(pred_, nThreads_);

      size_t wrote = 0;
      size_t read = 0;
      bool more = true;
      source_.apply([&](Value value) {
        if (pipeline.write(std::forward<Value>(value))) {
          // input queue not yet full, saturate it before we process
          // anything downstream
          ++wrote;
          return true;
        }

        // input queue full; drain ready items from the queue
        Result result;
        while (pipeline.read(result)) {
          ++read;
          if (!handler(getOutput(result))) {
            more = false;
            return false;
          }
        }

        // write the value we were going to write before we made room.
        pipeline.blockingWrite(std::forward<Value>(value));
        ++wrote;
        return true;
      });

      pipeline.stop();

      // flush the output queue
      while (read < wrote) {
        Result result;
        pipeline.blockingRead(result);
        ++read;
        if (more && !handler(getOutput(result))) {
          more = false;
        }
      }
      return more;
    }

    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), pred_, nThreads_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), pred_, nThreads_);
  }
};
} // namespace detail
} // namespace gen
} // namespace folly
