/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#include <dlfcn.h>
#include <unwind.h>
#include <iomanip>

namespace facebook {
namespace flipper {
// TODO: T39093653, Replace the backtrace implementation with folly
// implementation. Didn't use the backtrace() c function as it was not found in
// NDK.
struct BacktraceState {
  void** current;
  void** end;
};

static _Unwind_Reason_Code unwindCallback(
    struct _Unwind_Context* context,
    void* arg) {
  BacktraceState* state = static_cast<BacktraceState*>(arg);
  uintptr_t pc = _Unwind_GetIP(context);
  if (pc) {
    if (state->current == state->end) {
      return _URC_END_OF_STACK;
    } else {
      *state->current++ = reinterpret_cast<void*>(pc);
    }
  }
  return _URC_NO_REASON;
}

static size_t captureBacktrace(void** buffer, size_t max) {
  BacktraceState state = {buffer, buffer + max};
  _Unwind_Backtrace(unwindCallback, &state);

  return state.current - buffer;
}

static void dumpBacktrace(std::ostream& os, void** buffer, size_t count) {
  for (size_t idx = 0; idx < count; ++idx) {
    const void* addr = buffer[idx];
    const char* symbol = "";

    Dl_info info;
    if (dladdr(addr, &info) && info.dli_sname) {
      symbol = info.dli_sname;
    }

    os << "  #" << std::setw(2) << idx << ": " << addr << "  " << symbol
       << "\n";
  }
}

} // namespace flipper
} // namespace facebook

#endif
