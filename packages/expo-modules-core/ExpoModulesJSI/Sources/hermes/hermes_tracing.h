/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_HERMES_TRACING_H
#define HERMES_HERMES_TRACING_H

#include <hermes/hermes.h>

namespace llvh {
class raw_ostream;
} // namespace llvh

namespace facebook {
namespace hermes {

/// Creates and returns a tracing runtime if \p runtimeConfig.SynthTraceMode is
/// either SynthTraceMode::Tracing or SynthTraceMode::TracingAndReplaying.
/// Otherwise, returns the passed \n hermesRuntime as is.
/// The trace will be written to \p traceScratchPath incrementally.
/// On completion, the file will be renamed to \p traceResultPath, and
/// \p traceCompletionCallback (for post-processing) will be invoked.
/// Completion can be triggered implicitly by crash (if crash manager is
/// provided) or explicitly by invocation of flush.
/// If the runtime is destructed without triggering trace completion,
/// the file at \p traceScratchPath will be deleted.
/// The return value of \p traceCompletionCallback indicates whether the
/// invocation completed successfully. If \p traceCompletionCallback is null, it
/// also assumes as if the callback is successful.
std::shared_ptr<jsi::Runtime> makeTracingHermesRuntime(
    std::shared_ptr<HermesRuntime> hermesRuntime,
    const ::hermes::vm::RuntimeConfig &runtimeConfig,
    const std::string &traceScratchPath,
    const std::string &traceResultPath,
    std::function<bool()> traceCompletionCallback);

/// Creates and returns a tracing runtime that wrapps the passed
/// \p hermesRuntime. This API is mainly for Synth Trace replay (and tracing),
/// and for testing.
/// \p traceStream  the stream to write trace to.
/// \p forReplay indicates whether the runtime is being used in trace replay and
/// tracing.
std::shared_ptr<jsi::Runtime> makeTracingHermesRuntime(
    std::shared_ptr<HermesRuntime> hermesRuntime,
    const ::hermes::vm::RuntimeConfig &runtimeConfig,
    std::unique_ptr<llvh::raw_ostream> traceStream,
    bool forReplay = false);

} // namespace hermes
} // namespace facebook

#endif
