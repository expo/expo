/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_HERMES_H
#define HERMES_HERMES_H

#include <exception>
#include <list>
#include <map>
#include <memory>
#include <ostream>
#include <string>

#include "Public/HermesExport.h"
#include "hermes/Public/RuntimeConfig.h"
#include "hermes/Public/SamplingProfiler.h"
#include <jsi/hermes.h>
#include <jsi/jsi.h>
#include <unordered_map>

struct HermesTestHelper;
struct SHUnit;
struct SHRuntime;

namespace hermes {
namespace vm {
class GCExecTrace;
class Runtime;
} // namespace vm
} // namespace hermes

namespace facebook {
namespace jsi {

class ThreadSafeRuntime;

}

namespace hermes {

namespace debugger {
class Debugger;
}

class HermesRuntime;
/// The Hermes Root API interface. This is the entry point to create the Hermes
/// runtime and to access Hermes-specific methods that do not rely on a runtime
/// instance.
class HERMES_EXPORT IHermesRootAPI : public jsi::ICast {
 public:
  static constexpr jsi::UUID uuid{
      0xb654d898,
      0xdfad,
      0x11ef,
      0x859a,
      0x325096b39f47};

  // Returns an instance of Hermes Runtime.
  virtual std::unique_ptr<HermesRuntime> makeHermesRuntime(
      const ::hermes::vm::RuntimeConfig &runtimeConfig) = 0;

  virtual bool isHermesBytecode(const uint8_t *data, size_t len) = 0;

  // Returns the supported bytecode version.
  virtual uint32_t getBytecodeVersion() = 0;

  // (EXPERIMENTAL) Issues madvise calls for portions of the given
  // bytecode file that will likely be used when loading the bytecode
  // file and running its global function.
  virtual void prefetchHermesBytecode(const uint8_t *data, size_t len) = 0;

  // Returns whether the data is valid HBC with more extensive checks than
  // isHermesBytecode and returns why it isn't in errorMessage (if nonnull)
  // if not.
  virtual bool hermesBytecodeSanityCheck(
      const uint8_t *data,
      size_t len,
      std::string *errorMessage = nullptr) = 0;

  /// Sets a global fatal handler that is shared across all active Hermes
  /// runtimes. Setting fatal handler in multiple places will override the
  /// previous fatal handler set by this functionality.
  /// The fatal handler must not throw exceptions, as Hermes is compiled without
  /// exceptions.
  virtual void setFatalHandler(void (*handler)(const std::string &)) = 0;

  // Assuming that \p data is valid HBC bytecode data, returns a pointer to the
  // first element of the epilogue, data append to the end of the bytecode
  // stream. Return pair contain ptr to data and header.
  virtual std::pair<const uint8_t *, size_t> getBytecodeEpilogue(
      const uint8_t *data,
      size_t len) = 0;

  /// Enable sampling profiler.
  /// Starts a separate thread that polls VM state with \p meanHzFreq frequency.
  /// Any subsequent call to \c enableSamplingProfiler() is ignored until
  /// next call to \c disableSamplingProfiler()
  virtual void enableSamplingProfiler(double meanHzFreq = 100) = 0;

  /// Disable the sampling profiler
  virtual void disableSamplingProfiler() = 0;

  /// Dump sampled stack trace to the given file name.
  virtual void dumpSampledTraceToFile(const std::string &fileName) = 0;

  /// Dump sampled stack trace to the given stream.
  virtual void dumpSampledTraceToStream(std::ostream &stream) = 0;

  /// Return the executed JavaScript function info.
  /// This information holds the segmentID, Virtualoffset and sourceURL.
  /// This information is needed specifically to be able to symbolicate non-CJS
  /// bundles correctly. This API will be simplified later to simply return a
  /// segmentID and virtualOffset, when we are able to only support CJS bundles.
  virtual std::unordered_map<std::string, std::vector<std::string>>
  getExecutedFunctions() = 0;

  /// \return whether code coverage profiler is enabled or not.
  virtual bool isCodeCoverageProfilerEnabled() = 0;

  /// Enable code coverage profiler.
  virtual void enableCodeCoverageProfiler() = 0;

  /// Disable code coverage profiler.
  virtual void disableCodeCoverageProfiler() = 0;

 protected:
  /// The destructor is protected as delete calls on interfaces must not occur.
  /// It is also non-virtual to simplify the v-table.
  ~IHermesRootAPI() {}
};

/// The setFatalHandler functionality has global effects, which may cause
/// unintended or surprising behavior for users of this API. For this reason, it
/// is not recommended and the functionality is provided by the optional
/// interface ISetFatalHandler.
class HERMES_EXPORT ISetFatalHandler : public jsi::ICast {
 public:
  static constexpr jsi::UUID uuid{
      0xda98a610,
      0x09cb,
      0x11f0,
      0x87bf,
      0x325096b39f47};
  /// Sets a global fatal handler that is shared across all active Hermes
  /// runtimes. Setting fatal handler in multiple places will override the
  /// previous fatal handler set by this functionality.
  /// The fatal handler must not throw exceptions, as Hermes is compiled without
  /// exceptions.
  virtual void setFatalHandler(void (*handler)(const std::string &)) = 0;

 protected:
  ~ISetFatalHandler() = default;
};

/// Interface for methods that are exposed for test purposes.
class HERMES_EXPORT IHermesTestHelpers : public jsi::ICast {
 public:
  static constexpr jsi::UUID uuid{
      0x664e489a,
      0xf941,
      0x11ef,
      0xa44c,
      0x325096b39f47};

  virtual size_t rootsListLengthForTests() const = 0;

 protected:
  ~IHermesTestHelpers() = default;
};

class HermesRuntime : public jsi::Runtime, public IHermes {
 public:
  /// Similar to jsi::Runtime, HermesRuntime is treated as an object, rather
  /// than a pure interface. This is to prevent breaking usages of
  /// HermesRuntime prior to the introduction of jsi::IRuntime, IHermes, and
  /// other interfaces.
  ~HermesRuntime() override = default;

  using jsi::Runtime::castInterface;
};

/// Returns a pointer to an object that can be cast into IHermesRootAPI, which
/// can be used to create a Hermes runtime and to access global Hermes-specific
/// methods. This object has static lifetime.
HERMES_EXPORT jsi::ICast *makeHermesRootAPI();

/// Return a RuntimeConfig that is more suited for running untrusted JS than
/// the default config. Disables some language features and may trade off some
/// performance for security.
///
/// Can serve as a starting point with tweaks to re-enable needed features:
///   auto conf = hardenedHermesRuntimeConfig().rebuild();
///   ...
///   auto runtime = makeHermesRuntime(conf.build());
HERMES_EXPORT ::hermes::vm::RuntimeConfig hardenedHermesRuntimeConfig();

HERMES_EXPORT std::unique_ptr<HermesRuntime> makeHermesRuntime(
    const ::hermes::vm::RuntimeConfig &runtimeConfig =
        ::hermes::vm::RuntimeConfig());
HERMES_EXPORT std::unique_ptr<jsi::ThreadSafeRuntime>
makeThreadSafeHermesRuntime(
    const ::hermes::vm::RuntimeConfig &runtimeConfig =
        ::hermes::vm::RuntimeConfig());
} // namespace hermes
} // namespace facebook

#endif
