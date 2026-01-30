/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <regex>
#include <string>
#include <vector>

#include <hermes/DebuggerAPI.h>
#include <hermes/hermes.h>
#include <hermes/inspector/chrome/MessageTypes.h>

namespace facebook {
namespace hermes {
namespace inspector_modern {
namespace chrome {
namespace message {

template <typename T>
void setChromeLocation(
    T &chromeLoc,
    const facebook::hermes::debugger::SourceLocation &hermesLoc) {
  if (hermesLoc.line != facebook::hermes::debugger::kInvalidLocation) {
    chromeLoc.lineNumber = hermesLoc.line - 1;
  }

  if (hermesLoc.column != facebook::hermes::debugger::kInvalidLocation) {
    chromeLoc.columnNumber = hermesLoc.column - 1;
  }
}

/// ErrorCode magic numbers match JSC's (see InspectorBackendDispatcher.cpp)
enum class ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerError = -32000
};

ErrorResponse
makeErrorResponse(int id, ErrorCode code, const std::string &message);

OkResponse makeOkResponse(int id);

namespace debugger {

Location makeLocation(const facebook::hermes::debugger::SourceLocation &loc);

} // namespace debugger

namespace runtime {

CallFrame makeCallFrame(const facebook::hermes::debugger::CallFrameInfo &info);

std::vector<CallFrame> makeCallFrames(
    const facebook::hermes::debugger::StackTrace &stackTrace);

ExceptionDetails makeExceptionDetails(
    const facebook::hermes::debugger::ExceptionDetails &details);

} // namespace runtime

namespace heapProfiler {

std::unique_ptr<SamplingHeapProfile> makeSamplingHeapProfile(
    const std::string &value);

} // namespace heapProfiler

namespace profiler {

std::unique_ptr<Profile> makeProfile(const std::string &value);

} // namespace profiler

} // namespace message
} // namespace chrome
} // namespace inspector_modern
} // namespace hermes
} // namespace facebook
