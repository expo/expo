/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <hermes/Public/RuntimeConfig.h>
#include <hermes/Support/OptValue.h>
#include <hermes/Support/SHA1.h>
#include <hermes/SynthTrace.h>

#include <jsi/jsi.h>
#include <llvh/Support/MemoryBuffer.h>
#include <llvh/Support/raw_ostream.h>

#include <map>
#include <unordered_map>
#include <vector>

namespace facebook {
namespace hermes {

namespace tracing {

class TraceInterpreter final {
 public:
  /// Options for executing the trace.
  struct ExecuteOptions {
    /// Customizes the GCConfig of the Runtime.
    ::hermes::vm::GCConfig::Builder gcConfigBuilder;

    /// If true, trace again while replaying. After normalization (see
    /// hermes/tools/synth/trace_normalize.py) the output trace should be
    /// identical to the input trace. If they're not, there was a bug in replay.
    mutable bool traceEnabled{false};

    /// If true, verify that the replay results such as returned values from JS
    /// execution, inputs from JS to native function calls are matching with the
    /// trace record.
    bool verificationEnabled{false};

    /// If true, command-line options override the config options recorded in
    /// the trace.  If false, start from the default config.
    bool useTraceConfig{false};

    /// Number of initial executions whose stats are discarded.
    int warmupReps{0};

    /// Number of repetitions of execution. Stats returned are those for the rep
    /// with the median totalTime.
    int reps{1};

    /// If true, run a complete collection before printing stats. Useful for
    /// guaranteeing there's no garbage in heap size numbers.
    bool forceGCBeforeStats{false};

    /// If true, remove the requirement that the input bytecode was compiled
    /// from the same source used to record the trace. There must only be one
    /// input bytecode file in this case. If its observable behavior deviates
    /// from the trace, the results are undefined.
    bool disableSourceHashCheck{false};

    /// A trace contains many MarkerRecords which have a name used to identify
    /// them. If the replay encounters this given marker, perform an action
    /// described by MarkerAction. All actions will stop the trace early and
    /// collect stats at the marker point, unless the marker is set to the
    /// special marker "end". In that case the trace will run to completion.
    std::string marker{"end"};

    enum class MarkerAction {
      NONE,
      /// Take a snapshot at marker.
      SNAPSHOT,
      /// Take a heap timeline that ends at marker.
      TIMELINE,
      /// Take a sampling heap profile that ends at marker.
      SAMPLE_MEMORY,
      /// Take a sampling time profile that ends at marker.
      SAMPLE_TIME,
    };

    /// Sets the action to take upon encountering the marker. The action will
    /// write results into the \p profileFileName.
    MarkerAction action{MarkerAction::NONE};

    /// Output file name for any profiling information.
    std::string profileFileName;

    // These are the config parameters.  We wrap them in llvh::Optional
    // to indicate whether the corresponding command line flag was set
    // explicitly.  We override the trace's config only when that is true.

    /// If true, track all disk I/O done by the runtime and print a report at
    /// the end to stdout.
    llvh::Optional<bool> shouldTrackIO;

    /// If present, do a bytecode warmup run that touches a percentage of the
    /// bytecode. A value of 50 here means 50% of the bytecode should be warmed.
    llvh::Optional<unsigned> bytecodeWarmupPercent;
  };

 private:
  jsi::Runtime &rt_;
  ExecuteOptions options_;
  llvh::raw_ostream *traceStream_;
  // Map from source hash to source file to run.
  std::map<::hermes::SHA1, std::shared_ptr<const jsi::Buffer>> bundles_;
  const SynthTrace &trace_;

  /// The last use of each object.
  std::unordered_map<SynthTrace::ObjectID, uint64_t> lastUsePerObj_;

  /// The list of pairs from record index to ObjectID. Each record index is the
  /// lastly used position of each Object, at which we can remove the object
  /// from gom_ and gpnm_.
  std::vector<std::pair<uint64_t, SynthTrace::ObjectID>> lastUses_;
  /// Index of lastUses_ vector that the interpreter is currently processing.
  uint64_t lastUsesIndex_{0};

  // Invariant: the value is either jsi::Object, jsi::String, jsi::Symbol,
  // jsi::BigInt.
  std::unordered_map<SynthTrace::ObjectID, jsi::Value> gom_;
  // For the PropNameIDs, which are not representable as jsi::Value.
  std::unordered_map<SynthTrace::ObjectID, jsi::PropNameID> gpnm_;

  std::string stats_;
  /// Whether the marker was reached.
  bool markerFound_{false};
  /// Depth in the execution stack. Zero is the outermost function.
  uint64_t depth_{0};

  /// The index of the record that the TraceInterpreter is executing.
  uint64_t nextExecIndex_{0};

 public:
  /// Execute the trace given by \p traceFile, that was the trace of executing
  /// the bundle given by \p bytecodeFile.
  /// \return The stats collected by the runtime about times and memory usage.
  static std::string execAndGetStats(
      const std::string &traceFile,
      const std::vector<std::string> &bytecodeFiles,
      const ExecuteOptions &options);

  /// Same as execAndGetStats, except it additionally accepts a function to
  /// create the runtime instance for replaying. This can be used to pass, for
  /// example, TracingRuntime to trace while replaying.
  static std::string execWithRuntime(
      const std::string &traceFile,
      const std::vector<std::string> &bytecodeFiles,
      const ExecuteOptions &options,
      const std::function<std::shared_ptr<jsi::Runtime>(
          const ::hermes::vm::RuntimeConfig &runtimeConfig)> &createRuntime);

  /// \param traceStream If non-null, write a trace of the execution into this
  /// stream.
  /// \return Tuple of GC stats and the runtime instance used for replaying.
  static std::tuple<std::string, std::shared_ptr<jsi::Runtime>>
  execFromMemoryBuffer(
      std::unique_ptr<llvh::MemoryBuffer> &&traceBuf,
      std::vector<std::unique_ptr<llvh::MemoryBuffer>> &&codeBufs,
      const ExecuteOptions &options,
      const std::function<std::shared_ptr<jsi::Runtime>(
          const ::hermes::vm::RuntimeConfig &runtimeConfig)> &createRuntime);

 private:
  TraceInterpreter(
      jsi::Runtime &rt,
      const ExecuteOptions &options,
      const SynthTrace &trace,
      std::map<::hermes::SHA1, std::shared_ptr<const jsi::Buffer>> bundles);

  static std::string exec(
      jsi::Runtime &rt,
      const ExecuteOptions &options,
      const SynthTrace &trace,
      std::map<::hermes::SHA1, std::shared_ptr<const jsi::Buffer>> bundles);

  static ::hermes::vm::RuntimeConfig merge(
      ::hermes::vm::RuntimeConfig::Builder &,
      const ::hermes::vm::GCConfig::Builder &,
      const ExecuteOptions &,
      bool,
      bool);

  /// Requires \p codeBufs to be the memory buffers containing the code
  /// referenced (via source hash) by the given \p trace.  Returns a map from
  /// the source hash to the memory buffer.  In addition, if \p codeIsMmapped is
  /// non-null, sets \p *codeIsMmapped to indicate whether all the code is
  /// mmapped, and, if \p isBytecode is non-null, sets \p *isBytecode
  /// to indicate whether all the code is bytecode.
  static std::map<::hermes::SHA1, std::shared_ptr<const jsi::Buffer>>
  getSourceHashToBundleMap(
      std::vector<std::unique_ptr<llvh::MemoryBuffer>> &&codeBufs,
      const SynthTrace &trace,
      const ExecuteOptions &options,
      bool *codeIsMmapped = nullptr,
      bool *isBytecode = nullptr);

  jsi::Function createHostFunction(
      const SynthTrace::CreateHostFunctionRecord &rec,
      const jsi::PropNameID &propNameID);

  jsi::Object createHostObject(SynthTrace::ObjectID objID);

  /// Execute the records with the given ExecuteOptions::MarkerOption
  std::string executeRecordsWithMarkerOptions();

  /// Execute the records. JS might call this recursively when HostFunction or
  /// HostObject's functions are called.
  void executeRecords();

  /// Requires that \p valID is the proper id for \p val, and that a
  /// defining occurrence of \p valID occurs at the current \p defIndex. Decides
  /// whether the definition should be recorded, and, if so, adds the
  /// association between \p valID and \p val \p gom_ as appropriate.
  void addToObjectMap(
      SynthTrace::ObjectID valID,
      jsi::Value &&val,
      uint64_t defIndex);

  /// Similar to addToObjectMap, but for PropNameIDs.
  void addToPropNameIDMap(
      SynthTrace::ObjectID id,
      jsi::PropNameID &&val,
      uint64_t defIndex);

  /// If \p traceValue specifies an Object, String, BigInt or Symbol, requires
  /// \p val to be of the corresponding runtime type.  Adds this \p val to gom_.
  ///
  /// \p isThis should be true if and only if the value is a 'this' in a call
  /// (only used for validation). TODO(T84791675): Remove this parameter.
  ///
  /// N.B. This method should be called even if you happen to know that the
  /// value cannot be an Object, String, Symbol or BigInt, since it performs
  /// useful validation.
  void ifObjectAddToObjectMap(
      SynthTrace::TraceValue traceValue,
      const jsi::Value &val,
      uint64_t defIndex,
      bool isThis = false);

  /// Same as above, except it avoids copies on temporary objects.
  void ifObjectAddToObjectMap(
      SynthTrace::TraceValue traceValue,
      jsi::Value &&val,
      uint64_t defIndex,
      bool isThis = false);

  /// Check if the \p marker is the one that is being searched for. If this is
  /// the first time encountering the matching marker, perform the actions set
  /// up for that marker.
  void checkMarker(const std::string &marker);

  /// Get a jsi::Value from gom_ for given ObjectID.
  jsi::Value getJSIValueForUse(SynthTrace::ObjectID id);

  /// Get a jsi::PropNameID from gpnm_ for given ObjectID.
  jsi::PropNameID getPropNameIDForUse(SynthTrace::ObjectID id);

  /// Convert a TraceValue to a jsi::Value. This calls \p getJSIValueForUse,
  /// which will remove the entry from gom_ and globalDefsAndUses_.
  jsi::Value traceValueToJSIValue(SynthTrace::TraceValue value);

  /// Erase all references to objects of which last use is before the given
  /// record index.
  void eraseRefsBefore(uint64_t index);

  std::string printStats();

  LLVM_ATTRIBUTE_NORETURN void crashOnException(
      const std::exception &e,
      ::hermes::OptValue<uint64_t> globalRecordNum);

  void assertMatch(
      const SynthTrace::TraceValue &traceValue,
      const jsi::Value &val) const;
};

} // namespace tracing
} // namespace hermes
} // namespace facebook
