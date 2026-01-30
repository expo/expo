/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_REMOTEOBJECTCONVERTERS_H
#define HERMES_CDP_REMOTEOBJECTCONVERTERS_H

#include <hermes/DebuggerAPI.h>
#include <hermes/cdp/MessageTypes.h>
#include <hermes/cdp/RemoteObjectsTable.h>
#include <jsi/jsi.h>

namespace facebook {
namespace hermes {
namespace cdp {

struct ObjectSerializationOptions {
  bool returnByValue = false;
  bool generatePreview = false;
};

namespace message {

namespace debugger {

CallFrame makeCallFrame(
    uint32_t callFrameIndex,
    const facebook::hermes::debugger::CallFrameInfo &callFrameInfo,
    const facebook::hermes::debugger::LexicalInfo &lexicalInfo,
    cdp::RemoteObjectsTable &objTable,
    jsi::Runtime &runtime,
    const facebook::hermes::debugger::ProgramState &state);

std::vector<CallFrame> makeCallFrames(
    const facebook::hermes::debugger::ProgramState &state,
    cdp::RemoteObjectsTable &objTable,
    jsi::Runtime &runtime);

} // namespace debugger

namespace runtime {

RemoteObject makeRemoteObject(
    facebook::jsi::Runtime &runtime,
    const facebook::jsi::Value &value,
    cdp::RemoteObjectsTable &objTable,
    const std::string &objectGroup,
    const cdp::ObjectSerializationOptions &serializationOptions);

RemoteObject makeRemoteObjectForError(
    facebook::jsi::Runtime &runtime,
    const facebook::jsi::Value &value,
    cdp::RemoteObjectsTable &objTable,
    const std::string &objectGroup);

ExceptionDetails makeExceptionDetails(
    jsi::Runtime &runtime,
    const jsi::JSError &error,
    cdp::RemoteObjectsTable &objTable,
    const std::string &objectGroup);

ExceptionDetails makeExceptionDetails(const jsi::JSIException &err);

ExceptionDetails makeExceptionDetails(
    facebook::jsi::Runtime &runtime,
    const facebook::hermes::debugger::EvalResult &result,
    cdp::RemoteObjectsTable &objTable,
    const std::string &objectGroup);

} // namespace runtime

} // namespace message
} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_REMOTEOBJECTCONVERTERS_H
