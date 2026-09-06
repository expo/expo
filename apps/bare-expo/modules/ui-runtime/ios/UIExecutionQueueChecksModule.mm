#import <React/RCTBridgeModule.h>
#include "UIExecutionQueue.h"
#include "UIRuntime.h"
#include <stdexcept>
#include <vector>

namespace {
using expo::ui::UIExecutionQueue;
using expo::ui::UIRuntime;

void check(bool condition, const char *message)
{
  if (!condition) throw std::runtime_error(message);
}

template <typename Job>
bool rejects(Job job)
{
  try { job(); }
  catch (const std::logic_error &) { return true; }
  return false;
}

struct Checks {
  UIRuntime runtime;
  std::unique_ptr<UIExecutionQueue> queue;
  std::vector<std::string> trace;
  std::vector<std::string> errors;
  bool interleaved = false;
  bool reentrancyRejected = false;
  bool cancelledJobRan = false;
  bool activeJobFinished = false;
};

void startChecks(RCTPromiseResolveBlock resolve, RCTPromiseRejectBlock reject)
{
  auto checks = std::make_shared<Checks>();
  std::weak_ptr<Checks> weakChecks = checks;
  checks->queue = std::make_unique<UIExecutionQueue>([weakChecks](const std::string &error) {
    if (auto checks = weakChecks.lock()) checks->errors.push_back(error);
  });
  auto &queue = *checks->queue;

  // runNow really returns its result before this line continues.
  std::string result;
  queue.runNow([&] { result = checks->runtime.evaluateJSON("__isUIThread()"); });
  check(result == "true", "Immediate execution did not complete on UI");
  bool syncError = false;
  try { queue.runNow([] { throw std::runtime_error("expected sync error"); }); }
  catch (const std::runtime_error &) { syncError = true; }
  check(syncError, "Immediate errors must propagate");
  queue.runNow([&] { result = checks->runtime.evaluateJSON("globalThis.count = 0"); });
  check(result == "0", "Immediate execution did not recover after an error");

  // A destroyed/closed queue must cancel its already-posted job safely.
  {
    UIExecutionQueue cancelled([](const std::string &) {});
    cancelled.schedule([checks] { checks->cancelledJobRan = true; });
    cancelled.close();
    cancelled.close();
    check(rejects([&] { cancelled.schedule([] {}); }), "Closed queue accepted scheduling");
    check(rejects([&] { cancelled.runNow([] {}); }), "Closed queue accepted immediate execution");
  }
  {
    UIExecutionQueue destroyed([](const std::string &) {});
    destroyed.schedule([checks] { checks->cancelledJobRan = true; });
  }
  auto closing = std::make_shared<UIExecutionQueue>([](const std::string &) {});
  closing->schedule([closing, checks] {
    closing->close();
    checks->activeJobFinished = true;
  });
  closing->schedule([checks] { checks->cancelledJobRan = true; });

  queue.schedule([checks, resolve, reject] {
    checks->trace.push_back("A");
    // Enqueued from A: C goes behind the already-pending B, not inside A.
    checks->queue->schedule([checks, resolve, reject] {
      checks->trace.push_back("C");
      std::string failure;
      try {
        check(checks->trace == std::vector<std::string>({"now", "A", "B", "C"}),
              "Queued FIFO / immediate priority / nested scheduling order failed");
        check(checks->runtime.evaluateJSON("count") == "2", "Queued JS did not share runtime state");
        check(checks->errors.size() == 1 && checks->errors.front().find("expected queued error") != std::string::npos,
              "Queued error reporting or recovery failed");
        check(checks->interleaved, "Other main-queue work could not run between jobs");
        check(checks->reentrancyRejected, "Recursive immediate execution was accepted");
        check(!checks->cancelledJobRan && checks->activeJobFinished, "Queue cancellation failed");
      } catch (const std::exception &error) { failure = error.what(); }

      checks->queue->close();
      // Release after C has returned, proving cleanup isn't inside execution.
      dispatch_async(dispatch_get_main_queue(), ^{
        checks->queue.reset();
        checks->runtime.close();
        if (!failure.empty()) {
          reject(@"ERR_UI_QUEUE", @(failure.c_str()), nil);
          return;
        }
        NSLog(@"[UIRuntimePrimitive] Step 2 passed; queue and runtime closed on main");
        resolve(@{
          @"immediateExecution": @YES,
          @"deferredFIFO": @YES,
          @"immediatePriority": @YES,
          @"nestedScheduling": @YES,
          @"reentrancyRejected": @YES,
          @"errorRecovery": @YES,
          @"mainQueueInterleaving": @YES,
          @"closeAndCancellation": @YES,
        });
      });
    });
    checks->reentrancyRejected = rejects([&] { checks->queue->runNow([] {}); });
    checks->runtime.evaluateJSON("++count");
  });
  queue.schedule([checks] {
    checks->trace.push_back("B");
    checks->runtime.evaluateJSON("++count; throw new Error('expected queued error')");
  });
  queue.runNow([checks] { checks->trace.push_back("now"); });
  check(checks->trace == std::vector<std::string>({"now"}), "Scheduling ran a job inline");
  dispatch_async(dispatch_get_main_queue(), ^{ checks->interleaved = true; });
}
}

@interface UIExecutionQueueChecksModule : NSObject <RCTBridgeModule>
@end

@implementation UIExecutionQueueChecksModule
RCT_EXPORT_MODULE(UIExecutionQueueChecks)
+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(run:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    try { startChecks(resolve, reject); }
    catch (const std::exception &error) { reject(@"ERR_UI_QUEUE", @(error.what()), nil); }
  });
}
@end
