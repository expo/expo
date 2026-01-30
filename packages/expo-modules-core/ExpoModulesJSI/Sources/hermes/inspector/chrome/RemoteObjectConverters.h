/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <hermes/DebuggerAPI.h>
#include <hermes/inspector/chrome/MessageTypes.h>
#include <hermes/inspector/chrome/RemoteObjectsTable.h>
#include <jsi/jsi.h>

namespace facebook {
namespace hermes {
namespace inspector_modern {
namespace chrome {
namespace message {

namespace debugger {

CallFrame makeCallFrame(
    uint32_t callFrameIndex,
    const facebook::hermes::debugger::CallFrameInfo &callFrameInfo,
    const facebook::hermes::debugger::LexicalInfo &lexicalInfo,
    facebook::hermes::inspector_modern::chrome::RemoteObjectsTable &objTable,
    jsi::Runtime &runtime,
    const facebook::hermes::debugger::ProgramState &state);

std::vector<CallFrame> makeCallFrames(
    const facebook::hermes::debugger::ProgramState &state,
    facebook::hermes::inspector_modern::chrome::RemoteObjectsTable &objTable,
    jsi::Runtime &runtime);

} // namespace debugger

namespace runtime {

RemoteObject makeRemoteObject(
    facebook::jsi::Runtime &runtime,
    const facebook::jsi::Value &value,
    facebook::hermes::inspector_modern::chrome::RemoteObjectsTable &objTable,
    const std::string &objectGroup,
    bool byValue = false,
    bool generatePreview = false);

} // namespace runtime

} // namespace message
} // namespace chrome
} // namespace inspector_modern
} // namespace hermes
} // namespace facebook
