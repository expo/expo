#import <RNReanimated/REAMessageThread.h>

#include <condition_variable>
#include <mutex>

#import <React/RCTCxxUtils.h>
#import <React/RCTMessageThread.h>
#import <React/RCTUtils.h>

namespace facebook {
namespace react {

// Essentially the same as RCTMessageThread, but with public fields.
struct REAMessageThreadPublic {
  // I don't know why we need three vtables (if you know then feel free to
  // explain it instead of this message), but this is what makes the casts in
  // quitSynchronous() work correctly.
  void *vtable1;
  void *vtable2;
  void *vtable3;
  CFRunLoopRef m_cfRunLoop;
  RCTJavaScriptCompleteBlock m_errorBlock;
  std::atomic_bool m_shutdown;
};

// We need to prevent any new code from being executed on the thread as there
// is an assertion for that in the destructor of RCTMessageThread, but we have
// to override quitSynchronous() as it would quit the main looper and freeze
// the app.
void REAMessageThread::quitSynchronous()
{
  RCTMessageThread *rctThread = static_cast<RCTMessageThread *>(this);
  REAMessageThreadPublic *rctThreadPublic = reinterpret_cast<REAMessageThreadPublic *>(rctThread);
  rctThreadPublic->m_shutdown = true;
}

}
}
