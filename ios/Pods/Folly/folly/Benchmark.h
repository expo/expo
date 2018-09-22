/*
 * Copyright 2016 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <folly/Portability.h>
#include <folly/Preprocessor.h> // for FB_ANONYMOUS_VARIABLE
#include <folly/ScopeGuard.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/Time.h>

#include <cassert>
#include <ctime>
#include <boost/function_types/function_arity.hpp>
#include <functional>
#include <glog/logging.h>
#include <limits>
#include <type_traits>

DECLARE_bool(benchmark);

namespace folly {

/**
 * Runs all benchmarks defined. Usually put in main().
 */
void runBenchmarks();

/**
 * Runs all benchmarks defined if and only if the --benchmark flag has
 * been passed to the program. Usually put in main().
 */
inline bool runBenchmarksOnFlag() {
  if (FLAGS_benchmark) {
    runBenchmarks();
  }
  return FLAGS_benchmark;
}

namespace detail {

/**
 * This is the clock ID used for measuring time. On older kernels, the
 * resolution of this clock will be very coarse, which will cause the
 * benchmarks to fail.
 */
enum Clock { DEFAULT_CLOCK_ID = CLOCK_REALTIME };

typedef std::pair<uint64_t, unsigned int> TimeIterPair;

/**
 * Adds a benchmark wrapped in a std::function. Only used
 * internally. Pass by value is intentional.
 */
void addBenchmarkImpl(const char* file,
                      const char* name,
                      std::function<TimeIterPair(unsigned int)>);

/**
 * Takes the difference between two timespec values. end is assumed to
 * occur after start.
 */
inline uint64_t timespecDiff(timespec end, timespec start) {
  if (end.tv_sec == start.tv_sec) {
    assert(end.tv_nsec >= start.tv_nsec);
    return end.tv_nsec - start.tv_nsec;
  }
  assert(end.tv_sec > start.tv_sec);
  auto diff = uint64_t(end.tv_sec - start.tv_sec);
  assert(diff <
         std::numeric_limits<uint64_t>::max() / 1000000000UL);
  return diff * 1000000000UL
    + end.tv_nsec - start.tv_nsec;
}

/**
 * Takes the difference between two sets of timespec values. The first
 * two come from a high-resolution clock whereas the other two come
 * from a low-resolution clock. The crux of the matter is that
 * high-res values may be bogus as documented in
 * http://linux.die.net/man/3/clock_gettime. The trouble is when the
 * running process migrates from one CPU to another, which is more
 * likely for long-running processes. Therefore we watch for high
 * differences between the two timings.
 *
 * This function is subject to further improvements.
 */
inline uint64_t timespecDiff(timespec end, timespec start,
                             timespec endCoarse, timespec startCoarse) {
  auto fine = timespecDiff(end, start);
  auto coarse = timespecDiff(endCoarse, startCoarse);
  if (coarse - fine >= 1000000) {
    // The fine time is in all likelihood bogus
    return coarse;
  }
  return fine;
}

} // namespace detail

/**
 * Supporting type for BENCHMARK_SUSPEND defined below.
 */
struct BenchmarkSuspender {
  BenchmarkSuspender() {
    CHECK_EQ(0, clock_gettime(detail::DEFAULT_CLOCK_ID, &start));
  }

  BenchmarkSuspender(const BenchmarkSuspender &) = delete;
  BenchmarkSuspender(BenchmarkSuspender && rhs) noexcept {
    start = rhs.start;
    rhs.start.tv_nsec = rhs.start.tv_sec = 0;
  }

  BenchmarkSuspender& operator=(const BenchmarkSuspender &) = delete;
  BenchmarkSuspender& operator=(BenchmarkSuspender && rhs) {
    if (start.tv_nsec > 0 || start.tv_sec > 0) {
      tally();
    }
    start = rhs.start;
    rhs.start.tv_nsec = rhs.start.tv_sec = 0;
    return *this;
  }

  ~BenchmarkSuspender() {
    if (start.tv_nsec > 0 || start.tv_sec > 0) {
      tally();
    }
  }

  void dismiss() {
    assert(start.tv_nsec > 0 || start.tv_sec > 0);
    tally();
    start.tv_nsec = start.tv_sec = 0;
  }

  void rehire() {
    assert(start.tv_nsec == 0 || start.tv_sec == 0);
    CHECK_EQ(0, clock_gettime(detail::DEFAULT_CLOCK_ID, &start));
  }

  template <class F>
  auto dismissing(F f) -> typename std::result_of<F()>::type {
    SCOPE_EXIT { rehire(); };
    dismiss();
    return f();
  }

  /**
   * This is for use inside of if-conditions, used in BENCHMARK macros.
   * If-conditions bypass the explicit on operator bool.
   */
  explicit operator bool() const {
    return false;
  }

  /**
   * Accumulates nanoseconds spent outside benchmark.
   */
  typedef uint64_t NanosecondsSpent;
  static NanosecondsSpent nsSpent;

private:
  void tally() {
    timespec end;
    CHECK_EQ(0, clock_gettime(detail::DEFAULT_CLOCK_ID, &end));
    nsSpent += detail::timespecDiff(end, start);
    start = end;
  }

  timespec start;
};

/**
 * Adds a benchmark. Usually not called directly but instead through
 * the macro BENCHMARK defined below. The lambda function involved
 * must take exactly one parameter of type unsigned, and the benchmark
 * uses it with counter semantics (iteration occurs inside the
 * function).
 */
template <typename Lambda>
typename std::enable_if<
  boost::function_types::function_arity<decltype(&Lambda::operator())>::value
  == 2
>::type
addBenchmark(const char* file, const char* name, Lambda&& lambda) {
  auto execute = [=](unsigned int times) {
    BenchmarkSuspender::nsSpent = 0;
    timespec start, end;
    unsigned int niter;

    // CORE MEASUREMENT STARTS
    auto const r1 = clock_gettime(detail::DEFAULT_CLOCK_ID, &start);
    niter = lambda(times);
    auto const r2 = clock_gettime(detail::DEFAULT_CLOCK_ID, &end);
    // CORE MEASUREMENT ENDS

    CHECK_EQ(0, r1);
    CHECK_EQ(0, r2);

    return detail::TimeIterPair(
      detail::timespecDiff(end, start) - BenchmarkSuspender::nsSpent,
      niter);
  };

  detail::addBenchmarkImpl(file, name,
    std::function<detail::TimeIterPair(unsigned int)>(execute));
}

/**
 * Adds a benchmark. Usually not called directly but instead through
 * the macro BENCHMARK defined below. The lambda function involved
 * must take zero parameters, and the benchmark calls it repeatedly
 * (iteration occurs outside the function).
 */
template <typename Lambda>
typename std::enable_if<
  boost::function_types::function_arity<decltype(&Lambda::operator())>::value
  == 1
>::type
addBenchmark(const char* file, const char* name, Lambda&& lambda) {
  addBenchmark(file, name, [=](unsigned int times) {
      unsigned int niter = 0;
      while (times-- > 0) {
        niter += lambda();
      }
      return niter;
    });
}

/**
 * Call doNotOptimizeAway(var) against variables that you use for
 * benchmarking but otherwise are useless. The compiler tends to do a
 * good job at eliminating unused variables, and this function fools
 * it into thinking var is in fact needed.
 */
#ifdef _MSC_VER

#pragma optimize("", off)

template <class T>
void doNotOptimizeAway(T&& datum) {
  datum = datum;
}

#pragma optimize("", on)

#elif defined(__clang__)

template <class T>
__attribute__((__optnone__)) void doNotOptimizeAway(T&& /* datum */) {}

#else

template <class T>
void doNotOptimizeAway(T&& datum) {
  asm volatile("" : "+r" (datum));
}

#endif

} // namespace folly

/**
 * Introduces a benchmark function. Used internally, see BENCHMARK and
 * friends below.
 */
#define BENCHMARK_IMPL(funName, stringName, rv, paramType, paramName)   \
  static void funName(paramType);                                       \
  static bool FB_ANONYMOUS_VARIABLE(follyBenchmarkUnused) = (           \
    ::folly::addBenchmark(__FILE__, stringName,                         \
      [](paramType paramName) -> unsigned { funName(paramName);         \
                                            return rv; }),              \
    true);                                                              \
  static void funName(paramType paramName)

/**
 * Introduces a benchmark function with support for returning the actual
 * number of iterations. Used internally, see BENCHMARK_MULTI and friends
 * below.
 */
#define BENCHMARK_MULTI_IMPL(funName, stringName, paramType, paramName) \
  static unsigned funName(paramType);                                   \
  static bool FB_ANONYMOUS_VARIABLE(follyBenchmarkUnused) = (           \
    ::folly::addBenchmark(__FILE__, stringName,                         \
      [](paramType paramName) { return funName(paramName); }),          \
    true);                                                              \
  static unsigned funName(paramType paramName)

/**
 * Introduces a benchmark function. Use with either one or two arguments.
 * The first is the name of the benchmark. Use something descriptive, such
 * as insertVectorBegin. The second argument may be missing, or could be a
 * symbolic counter. The counter dictates how many internal iteration the
 * benchmark does. Example:
 *
 * BENCHMARK(vectorPushBack) {
 *   vector<int> v;
 *   v.push_back(42);
 * }
 *
 * BENCHMARK(insertVectorBegin, n) {
 *   vector<int> v;
 *   FOR_EACH_RANGE (i, 0, n) {
 *     v.insert(v.begin(), 42);
 *   }
 * }
 */
#define BENCHMARK(name, ...)                                    \
  BENCHMARK_IMPL(                                               \
    name,                                                       \
    FB_STRINGIZE(name),                                         \
    FB_ARG_2_OR_1(1, ## __VA_ARGS__),                           \
    FB_ONE_OR_NONE(unsigned, ## __VA_ARGS__),                   \
    __VA_ARGS__)

/**
 * Like BENCHMARK above, but allows the user to return the actual
 * number of iterations executed in the function body. This can be
 * useful if the benchmark function doesn't know upfront how many
 * iterations it's going to run or if it runs through a certain
 * number of test cases, e.g.:
 *
 * BENCHMARK_MULTI(benchmarkSomething) {
 *   std::vector<int> testCases { 0, 1, 1, 2, 3, 5 };
 *   for (int c : testCases) {
 *     doSomething(c);
 *   }
 *   return testCases.size();
 * }
 */
#define BENCHMARK_MULTI(name, ...)                              \
  BENCHMARK_MULTI_IMPL(                                         \
    name,                                                       \
    FB_STRINGIZE(name),                                         \
    FB_ONE_OR_NONE(unsigned, ## __VA_ARGS__),                   \
    __VA_ARGS__)

/**
 * Defines a benchmark that passes a parameter to another one. This is
 * common for benchmarks that need a "problem size" in addition to
 * "number of iterations". Consider:
 *
 * void pushBack(uint n, size_t initialSize) {
 *   vector<int> v;
 *   BENCHMARK_SUSPEND {
 *     v.resize(initialSize);
 *   }
 *   FOR_EACH_RANGE (i, 0, n) {
 *    v.push_back(i);
 *   }
 * }
 * BENCHMARK_PARAM(pushBack, 0)
 * BENCHMARK_PARAM(pushBack, 1000)
 * BENCHMARK_PARAM(pushBack, 1000000)
 *
 * The benchmark above estimates the speed of push_back at different
 * initial sizes of the vector. The framework will pass 0, 1000, and
 * 1000000 for initialSize, and the iteration count for n.
 */
#define BENCHMARK_PARAM(name, param)                                    \
  BENCHMARK_NAMED_PARAM(name, param, param)

/**
 * Same as BENCHMARK_PARAM, but allows one to return the actual number of
 * iterations that have been run.
 */
#define BENCHMARK_PARAM_MULTI(name, param)                              \
  BENCHMARK_NAMED_PARAM_MULTI(name, param, param)

/*
 * Like BENCHMARK_PARAM(), but allows a custom name to be specified for each
 * parameter, rather than using the parameter value.
 *
 * Useful when the parameter value is not a valid token for string pasting,
 * of when you want to specify multiple parameter arguments.
 *
 * For example:
 *
 * void addValue(uint n, int64_t bucketSize, int64_t min, int64_t max) {
 *   Histogram<int64_t> hist(bucketSize, min, max);
 *   int64_t num = min;
 *   FOR_EACH_RANGE (i, 0, n) {
 *     hist.addValue(num);
 *     ++num;
 *     if (num > max) { num = min; }
 *   }
 * }
 *
 * BENCHMARK_NAMED_PARAM(addValue, 0_to_100, 1, 0, 100)
 * BENCHMARK_NAMED_PARAM(addValue, 0_to_1000, 10, 0, 1000)
 * BENCHMARK_NAMED_PARAM(addValue, 5k_to_20k, 250, 5000, 20000)
 */
#define BENCHMARK_NAMED_PARAM(name, param_name, ...)                    \
  BENCHMARK_IMPL(                                                       \
      FB_CONCATENATE(name, FB_CONCATENATE(_, param_name)),              \
      FB_STRINGIZE(name) "(" FB_STRINGIZE(param_name) ")",              \
      iters,                                                            \
      unsigned,                                                         \
      iters) {                                                          \
    name(iters, ## __VA_ARGS__);                                        \
  }

/**
 * Same as BENCHMARK_NAMED_PARAM, but allows one to return the actual number
 * of iterations that have been run.
 */
#define BENCHMARK_NAMED_PARAM_MULTI(name, param_name, ...)              \
  BENCHMARK_MULTI_IMPL(                                                 \
      FB_CONCATENATE(name, FB_CONCATENATE(_, param_name)),              \
      FB_STRINGIZE(name) "(" FB_STRINGIZE(param_name) ")",              \
      unsigned,                                                         \
      iters) {                                                          \
    return name(iters, ## __VA_ARGS__);                                 \
  }

/**
 * Just like BENCHMARK, but prints the time relative to a
 * baseline. The baseline is the most recent BENCHMARK() seen in
 * lexical order. Example:
 *
 * // This is the baseline
 * BENCHMARK(insertVectorBegin, n) {
 *   vector<int> v;
 *   FOR_EACH_RANGE (i, 0, n) {
 *     v.insert(v.begin(), 42);
 *   }
 * }
 *
 * BENCHMARK_RELATIVE(insertListBegin, n) {
 *   list<int> s;
 *   FOR_EACH_RANGE (i, 0, n) {
 *     s.insert(s.begin(), 42);
 *   }
 * }
 *
 * Any number of relative benchmark can be associated with a
 * baseline. Another BENCHMARK() occurrence effectively establishes a
 * new baseline.
 */
#define BENCHMARK_RELATIVE(name, ...)                           \
  BENCHMARK_IMPL(                                               \
    name,                                                       \
    "%" FB_STRINGIZE(name),                                     \
    FB_ARG_2_OR_1(1, ## __VA_ARGS__),                           \
    FB_ONE_OR_NONE(unsigned, ## __VA_ARGS__),                   \
    __VA_ARGS__)

/**
 * Same as BENCHMARK_RELATIVE, but allows one to return the actual number
 * of iterations that have been run.
 */
#define BENCHMARK_RELATIVE_MULTI(name, ...)                     \
  BENCHMARK_MULTI_IMPL(                                         \
    name,                                                       \
    "%" FB_STRINGIZE(name),                                     \
    FB_ONE_OR_NONE(unsigned, ## __VA_ARGS__),                   \
    __VA_ARGS__)

/**
 * A combination of BENCHMARK_RELATIVE and BENCHMARK_PARAM.
 */
#define BENCHMARK_RELATIVE_PARAM(name, param)                           \
  BENCHMARK_RELATIVE_NAMED_PARAM(name, param, param)

/**
 * Same as BENCHMARK_RELATIVE_PARAM, but allows one to return the actual
 * number of iterations that have been run.
 */
#define BENCHMARK_RELATIVE_PARAM_MULTI(name, param)                     \
  BENCHMARK_RELATIVE_NAMED_PARAM_MULTI(name, param, param)

/**
 * A combination of BENCHMARK_RELATIVE and BENCHMARK_NAMED_PARAM.
 */
#define BENCHMARK_RELATIVE_NAMED_PARAM(name, param_name, ...)           \
  BENCHMARK_IMPL(                                                       \
      FB_CONCATENATE(name, FB_CONCATENATE(_, param_name)),              \
      "%" FB_STRINGIZE(name) "(" FB_STRINGIZE(param_name) ")",          \
      iters,                                                            \
      unsigned,                                                         \
      iters) {                                                          \
    name(iters, ## __VA_ARGS__);                                        \
  }

/**
 * Same as BENCHMARK_RELATIVE_NAMED_PARAM, but allows one to return the
 * actual number of iterations that have been run.
 */
#define BENCHMARK_RELATIVE_NAMED_PARAM_MULTI(name, param_name, ...)     \
  BENCHMARK_MULTI_IMPL(                                                 \
      FB_CONCATENATE(name, FB_CONCATENATE(_, param_name)),              \
      "%" FB_STRINGIZE(name) "(" FB_STRINGIZE(param_name) ")",          \
      unsigned,                                                         \
      iters) {                                                          \
    return name(iters, ## __VA_ARGS__);                                 \
  }

/**
 * Draws a line of dashes.
 */
#define BENCHMARK_DRAW_LINE()                                             \
  static bool FB_ANONYMOUS_VARIABLE(follyBenchmarkUnused) = (             \
    ::folly::addBenchmark(__FILE__, "-", []() -> unsigned { return 0; }), \
    true);

/**
 * Allows execution of code that doesn't count torward the benchmark's
 * time budget. Example:
 *
 * BENCHMARK_START_GROUP(insertVectorBegin, n) {
 *   vector<int> v;
 *   BENCHMARK_SUSPEND {
 *     v.reserve(n);
 *   }
 *   FOR_EACH_RANGE (i, 0, n) {
 *     v.insert(v.begin(), 42);
 *   }
 * }
 */
#define BENCHMARK_SUSPEND                               \
  if (auto FB_ANONYMOUS_VARIABLE(BENCHMARK_SUSPEND) =   \
      ::folly::BenchmarkSuspender()) {}                 \
  else
