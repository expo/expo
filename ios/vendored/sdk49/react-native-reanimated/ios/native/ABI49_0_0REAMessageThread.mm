#import <ABI49_0_0RNReanimated/ABI49_0_0REAMessageThread.h>

#include <condition_variable>
#include <mutex>

#import <ABI49_0_0React/ABI49_0_0RCTCxxUtils.h>
#import <ABI49_0_0React/ABI49_0_0RCTMessageThread.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

// Essentially the same as ABI49_0_0RCTMessageThread, but with public fields.
struct ABI49_0_0REAMessageThreadPublic {
  // I don't know why we need three vtables (if you know then feel free to
  // explain it instead of this message), but this is what makes the casts in
  // quitSynchronous() work correctly.
  void *vtable1;
  void *vtable2;
  void *vtable3;
  CFRunLoopRef m_cfRunLoop;
  ABI49_0_0RCTJavaScriptCompleteBlock m_errorBlock;
  std::atomic_bool m_shutdown;
};

// We need to prevent any new code from being executed on the thread as there
// is an assertion for that in the destructor of ABI49_0_0RCTMessageThread, but we have
// to override quitSynchronous() as it would quit the main looper and freeze
// the app.
void ABI49_0_0REAMessageThread::quitSynchronous()
{
  ABI49_0_0RCTMessageThread *rctThread = static_cast<ABI49_0_0RCTMessageThread *>(this);
  ABI49_0_0REAMessageThreadPublic *rctThreadPublic = reinterpret_cast<ABI49_0_0REAMessageThreadPublic *>(rctThread);
  rctThreadPublic->m_shutdown = true;
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
