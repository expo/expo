/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_PUBLIC_DEBUGGERTYPES_H
#define HERMES_PUBLIC_DEBUGGERTYPES_H

#include <cstdint>
#include <string>
#include <vector>
#pragma GCC diagnostic push

#ifdef HERMES_COMPILER_SUPPORTS_WSHORTEN_64_TO_32
#pragma GCC diagnostic ignored "-Wshorten-64-to-32"
#endif
namespace hermes {
namespace vm {
class Debugger;
}
} // namespace hermes

namespace facebook {
namespace hermes {
namespace debugger {

class ProgramState;

/// Strings in the Debugger are UTF-8 encoded. When converting from a JavaScript
/// string, valid UTF-16 surrogate pairs are decoded. Surrogate halves are
/// converted into the Unicode replacement character.
using String = std::string;

/// Debugging entities like breakpoints are identified by a unique ID. The
/// Debugger will not re-use IDs even across different entity types. 0 is an
/// invalid ID.
using BreakpointID = uint64_t;
// NOTE: Can't be kInvalidID due to a clash with MacTypes.h's define kInvalidID.
constexpr uint64_t kInvalidBreakpoint = 0;

/// Scripts when loaded are identified by a script ID.
/// These are not reused within one invocation of the VM.
using ScriptID = uint32_t;

/// A SourceLocation is a small value-type representing a location in a source
/// file.
constexpr uint32_t kInvalidLocation = ~0u;
struct SourceLocation {
  /// Line in the source. 1 based.
  uint32_t line = kInvalidLocation;

  /// Column in the source. 1 based.
  uint32_t column = kInvalidLocation;

  /// Identifier of the source file.
  ScriptID fileId = kInvalidLocation;

  /// Name of the source file.
  String fileName;
};

/// CallFrameInfo is a value type representing an entry in a call stack.
struct CallFrameInfo {
  /// Name of the function executing in this frame.
  String functionName;

  /// Source location of the program counter for this frame.
  SourceLocation location;
};

/// StackTrace represents a list of call frames, either in the current execution
/// or captured in an exception.
struct StackTrace {
  /// \return the number of call frames.
  uint32_t callFrameCount() const {
    return frames_.size();
  }

  /// \return call frame info at a given index. 0 represents the topmost
  /// (current) frame on the call stack.
  CallFrameInfo callFrameForIndex(uint32_t index) const {
    return frames_.at(index);
  }

  StackTrace() {}

 private:
  explicit StackTrace(std::vector<CallFrameInfo> frames)
      : frames_(std::move(frames)) {}
  friend ProgramState;
  friend ::hermes::vm::Debugger;
  std::vector<CallFrameInfo> frames_;
};

/// ExceptionDetails is a value type describing an exception.
struct ExceptionDetails {
  /// Textual description of the exception.
  String text;

  /// Location where the exception was thrown.
  SourceLocation location;

  /// Get the stack trace associated with the exception.
  const StackTrace &getStackTrace() const {
    return stackTrace_;
  }

 private:
  friend ::hermes::vm::Debugger;
  StackTrace stackTrace_;
};

/// A list of possible reasons for a Pause.
enum class PauseReason {
  ScriptLoaded, /// A script file was loaded, and the debugger has requested
                /// pausing after script load.
  DebuggerStatement, /// A debugger; statement was hit.
  Breakpoint, /// A breakpoint was hit.
  StepFinish, /// A Step operation completed.
  Exception, /// An Exception was thrown.
  AsyncTriggerImplicit, /// The Pause is the result of
                        /// triggerAsyncPause(Implicit).
  AsyncTriggerExplicit, /// The Pause is the result of
                        /// triggerAsyncPause(Explicit).
  EvalComplete, /// An eval() function finished.
};

/// When stepping, the mode with which to step.
enum class StepMode {
  Into, /// Enter into any function calls.
  Over, /// Skip over any function calls.
  Out, /// Step until the current function exits.
};

/// When setting pause on throw, this specifies when to pause.
enum class PauseOnThrowMode {
  None, /// Never pause on exceptions.
  Uncaught, /// Only pause on uncaught exceptions.
  All, /// Pause any time an exception is thrown.
};

/// When requesting an async break, this specifies whether it was an implicit
/// break from the inspector or a user-requested explicit break.
enum class AsyncPauseKind {
  /// Implicit pause to allow movement of jsi::Value types between threads.
  /// The user will not be running commands and the inspector will immediately
  /// request a Continue.
  Implicit,

  /// Explicit pause requested by the user.
  /// Clears any stepping state and allows the user to run their own commands.
  Explicit,
};

/// A type representing depth in a lexical scope chain.
using ScopeDepth = uint32_t;

/// Information about lexical entities (for now, just variable names).
struct LexicalInfo {
  /// \return the number of scopes.
  ScopeDepth getScopesCount() const {
    return variableCountsByScope_.size();
  }

  /// \return the number of variables in a given scope.
  uint32_t getVariablesCountInScope(ScopeDepth depth) const {
    return variableCountsByScope_.at(depth);
  }

 private:
  friend ::hermes::vm::Debugger;
  std::vector<uint32_t> variableCountsByScope_;
};

/// Information about a breakpoint.
struct BreakpointInfo {
  /// ID of the breakpoint.
  /// kInvalidBreakpoint if the info is not valid.
  BreakpointID id;

  /// Whether the breakpoint is enabled.
  bool enabled;

  /// Whether the breakpoint has been resolved.
  bool resolved;

  /// The originally requested location of the breakpoint.
  SourceLocation requestedLocation;

  /// The resolved location of the breakpoint if resolved is true.
  SourceLocation resolvedLocation;
};

} // namespace debugger
} // namespace hermes
} // namespace facebook

#endif
