#import <React/RCTBridgeModule.h>
#include "UIExecutionQueue.h"
#include "UIRuntime.h"
#include <stdexcept>

namespace {
using expo::ui::UIExecutionQueue;
using expo::ui::UIRuntime;

struct ReactChecks {
  std::unique_ptr<UIExecutionQueue> queue;
  std::unique_ptr<UIRuntime> runtime;
  RCTPromiseResolveBlock resolve;
  RCTPromiseRejectBlock reject;
  bool finished = false;

  void finish(NSString *error, NSDictionary *result = nil)
  {
    if (finished) return;
    finished = true;
    queue->close();
    runtime->close();
    if (error) reject(@"ERR_UI_REACT", error, nil);
    else {
      NSLog(@"[UIRuntimePrimitive] Step 3 passed; React unmounted and runtime closed on main");
      resolve(result);
    }
  }
};

// Diagnostic polling, not part of the primitive or a production render loop.
// React can schedule multiple UI turns; wait for its layout effect to confirm
// the deferred commit instead of assuming one dispatch is sufficient.
void awaitDeferredCommit(const std::shared_ptr<ReactChecks> &checks, int attempt = 0)
{
  checks->queue->schedule([checks, attempt] {
    if (checks->runtime->evaluateJSON("UIReactProof.ready()") != "true") {
      if (attempt == 100) throw std::runtime_error("React's deferred update did not commit");
      awaitDeferredCommit(checks, attempt + 1);
      return;
    }
    std::string json = checks->runtime->evaluateJSON("UIReactProof.finish()");
    NSData *data = [NSData dataWithBytes:json.data() length:json.size()];
    NSError *error = nil;
    NSDictionary *result = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
    if (error || ![result isKindOfClass:NSDictionary.class]) {
      throw std::runtime_error("React proof returned invalid JSON");
    }
    // Let the executing job return before destroying the runtime and queue.
    auto retained = checks;
    dispatch_async(dispatch_get_main_queue(), ^{ retained->finish(nil, result); });
  });
}

void startChecks(const std::string &source, RCTPromiseResolveBlock resolve, RCTPromiseRejectBlock reject)
{
  auto checks = std::make_shared<ReactChecks>();
  checks->resolve = resolve;
  checks->reject = reject;
  std::weak_ptr<ReactChecks> weakChecks = checks;
  checks->queue = std::make_unique<UIExecutionQueue>([weakChecks](const std::string &error) {
    if (auto checks = weakChecks.lock()) checks->finish(@(error.c_str()));
  });
  checks->runtime = std::make_unique<UIRuntime>();

  // Queue stays alive while this runtime dies. Its posted task MUST be harmless.
  {
    UIRuntime transient;
    transient.installTaskScheduling(*checks->queue);
    transient.loadScript(
        "globalThis.__runUITask = () => { throw new Error('Closed runtime callback ran'); }; __postUITask(1);",
        "ui-runtime://closed-task-check");
    transient.close();
  }

  // The JS scheduling handle must not retain a queue wrapper either.
  UIExecutionQueue::Dispatcher detached;
  {
    UIExecutionQueue temporary([](const std::string &) {});
    detached = temporary.dispatcher();
  }
  bool rejected = false;
  try { detached([] {}); }
  catch (const std::logic_error &) { rejected = true; }
  if (!rejected) throw std::runtime_error("Dispatcher retained a destroyed queue");

  std::string failure;
  try {
    checks->queue->runNow([&] {
      checks->runtime->installTaskScheduling(*checks->queue);
      checks->runtime->loadScript(source, "ui-runtime://react-proof");
      checks->runtime->evaluateJSON("UIReactProof.start()");
    });
    awaitDeferredCommit(checks);
  } catch (const std::exception &error) { failure = error.what(); }
  // Destroy the exception (which may contain JSI handles) before the runtime.
  if (!failure.empty()) checks->finish(@(failure.c_str()));
}
}

@interface UIReactChecksModule : NSObject <RCTBridgeModule>
@end

@implementation UIReactChecksModule
RCT_EXPORT_MODULE(UIReactChecks)
+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(run:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  // File I/O is setup work, not part of the synchronous render path.
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_DEFAULT, 0), ^{
    NSString *path = [NSBundle.mainBundle pathForResource:@"UIReactProof" ofType:@"js"];
    NSError *error = nil;
    NSString *source = path ? [NSString stringWithContentsOfFile:path encoding:NSUTF8StringEncoding error:&error] : nil;
    if (!source) {
      reject(@"ERR_UI_REACT_BUNDLE", @"Build react-proof, install pods, and rebuild bare-expo to include UIReactProof.js", error);
      return;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
      try { startChecks(source.UTF8String, resolve, reject); }
      catch (const std::exception &error) { reject(@"ERR_UI_REACT", @(error.what()), nil); }
    });
  });
}
@end
