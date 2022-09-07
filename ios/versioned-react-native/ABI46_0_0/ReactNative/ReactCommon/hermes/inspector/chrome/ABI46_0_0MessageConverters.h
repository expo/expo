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

#include <hermes/ABI46_0_0DebuggerAPI.h>
#include <hermes/ABI46_0_0hermes.h>
#include <hermes/inspector/chrome/ABI46_0_0MessageTypes.h>
#include <hermes/inspector/chrome/ABI46_0_0RemoteObjectsTable.h>
#include <ABI46_0_0jsi/ABI46_0_0JSIDynamic.h>
#include <ABI46_0_0jsi/ABI46_0_0jsi.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0hermes {
namespace inspector {
namespace chrome {
namespace message {

std::string stripCachePrevention(const std::string &url);

template <typename T>
void setHermesLocation(
    ABI46_0_0facebook::ABI46_0_0hermes::debugger::SourceLocation &hermesLoc,
    const T &chromeLoc,
    const std::vector<std::string> &parsedScripts) {
  hermesLoc.line = chromeLoc.lineNumber + 1;

  if (chromeLoc.columnNumber.hasValue()) {
    if (chromeLoc.columnNumber.value() == 0) {
      // TODO: When CDTP sends a column number of 0, we send Hermes a column
      // number of 1. For some reason, this causes Hermes to not be
      // able to resolve breakpoints.
      hermesLoc.column = ::ABI46_0_0facebook::ABI46_0_0hermes::debugger::kInvalidLocation;
    } else {
      hermesLoc.column = chromeLoc.columnNumber.value() + 1;
    }
  }

  if (chromeLoc.url.hasValue()) {
    hermesLoc.fileName = stripCachePrevention(chromeLoc.url.value());
  } else if (chromeLoc.urlRegex.hasValue()) {
    const std::regex regex(stripCachePrevention(chromeLoc.urlRegex.value()));
    auto it = parsedScripts.rbegin();

    // We currently only support one physical breakpoint per location, so
    // search backwards so that we find the latest matching file.
    while (it != parsedScripts.rend()) {
      if (std::regex_match(*it, regex)) {
        hermesLoc.fileName = *it;
        break;
      }
      it++;
    }
  }
}

template <typename T>
void setChromeLocation(
    T &chromeLoc,
    const ABI46_0_0facebook::ABI46_0_0hermes::debugger::SourceLocation &hermesLoc) {
  if (hermesLoc.line != ABI46_0_0facebook::ABI46_0_0hermes::debugger::kInvalidLocation) {
    chromeLoc.lineNumber = hermesLoc.line - 1;
  }

  if (hermesLoc.column != ABI46_0_0facebook::ABI46_0_0hermes::debugger::kInvalidLocation) {
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

Location makeLocation(const ABI46_0_0facebook::ABI46_0_0hermes::debugger::SourceLocation &loc);

CallFrame makeCallFrame(
    uint32_t callFrameIndex,
    const ABI46_0_0facebook::ABI46_0_0hermes::debugger::CallFrameInfo &callFrameInfo,
    const ABI46_0_0facebook::ABI46_0_0hermes::debugger::LexicalInfo &lexicalInfo,
    ABI46_0_0facebook::ABI46_0_0hermes::inspector::chrome::RemoteObjectsTable &objTable,
    jsi::Runtime &runtime,
    const ABI46_0_0facebook::ABI46_0_0hermes::debugger::ProgramState &state);

std::vector<CallFrame> makeCallFrames(
    const ABI46_0_0facebook::ABI46_0_0hermes::debugger::ProgramState &state,
    ABI46_0_0facebook::ABI46_0_0hermes::inspector::chrome::RemoteObjectsTable &objTable,
    jsi::Runtime &runtime);

} // namespace debugger

namespace runtime {

CallFrame makeCallFrame(const ABI46_0_0facebook::ABI46_0_0hermes::debugger::CallFrameInfo &info);

std::vector<CallFrame> makeCallFrames(
    const ABI46_0_0facebook::ABI46_0_0hermes::debugger::StackTrace &stackTrace);

ExceptionDetails makeExceptionDetails(
    const ABI46_0_0facebook::ABI46_0_0hermes::debugger::ExceptionDetails &details);

RemoteObject makeRemoteObject(
    ABI46_0_0facebook::jsi::Runtime &runtime,
    const ABI46_0_0facebook::jsi::Value &value,
    ABI46_0_0facebook::ABI46_0_0hermes::inspector::chrome::RemoteObjectsTable &objTable,
    const std::string &objectGroup,
    bool byValue = false);

} // namespace runtime

} // namespace message
} // namespace chrome
} // namespace inspector
} // namespace ABI46_0_0hermes
} // namespace ABI46_0_0facebook
