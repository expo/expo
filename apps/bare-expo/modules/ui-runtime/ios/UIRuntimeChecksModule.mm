#import <React/RCTBridgeModule.h>
#include "UIRuntime.h"
#include <stdexcept>

namespace {
using expo::ui::UIRuntime;

void check(bool condition, const char *message)
{
  if (!condition) throw std::runtime_error(message);
}

// Test harness, not the public primitive. Every instance stays on this stack,
// so successful and exceptional exits both destroy Hermes on the UI thread.
NSDictionary *runChecks(bool rejectedBackgroundCreation)
{
  check(rejectedBackgroundCreation, "Background creation was not rejected");
  UIRuntime first;
  check(first.evaluateJSON("__isUIThread()") == "true", "JS did not run on UI");
  check(first.evaluateJSON("typeof __uiRuntimeStepOneAppMarker") == "\"undefined\"",
        "The app's global leaked into the UI runtime");
  check(first.evaluateJSON("globalThis.counter = 1; counter") == "1", "First evaluation failed");
  check(first.evaluateJSON("++counter") == "2", "Runtime state did not persist");

  UIRuntime second;
  check(second.evaluateJSON("typeof counter") == "\"undefined\"", "Two runtimes shared globals");
  check(second.evaluateJSON("globalThis.counter = 100; counter") == "100", "Second runtime failed");
  check(first.evaluateJSON("counter") == "2", "Second runtime changed the first");

  bool caughtJSError = false;
  try { first.evaluateJSON("throw new Error('expected test error')"); }
  catch (const facebook::jsi::JSError &) { caughtJSError = true; }
  check(caughtJSError, "JavaScript errors must propagate");
  check(first.evaluateJSON("counter + 1") == "3", "Runtime did not recover after a JS error");

  bool rejectedUndefined = false;
  try { first.evaluateJSON("undefined"); }
  catch (const std::invalid_argument &) { rejectedUndefined = true; }
  check(rejectedUndefined, "Undefined must not cross the JSON result boundary");

  auto copiedResult = first.evaluateJSON("({count: counter})");
  first.close();
  check(copiedResult == "{\"count\":2}", "The copied result did not survive runtime disposal");
  first.close();
  bool rejectedClosed = false;
  try { first.evaluateJSON("1"); }
  catch (const std::logic_error &) { rejectedClosed = true; }
  check(rejectedClosed, "Closed runtime accepted evaluation");

  UIRuntime recreated;
  check(recreated.evaluateJSON("typeof counter") == "\"undefined\"", "Recreation retained old state");

  return @{
    @"uiThread": @YES,
    @"appIsolation": @YES,
    @"persistentState": @YES,
    @"independentInstances": @YES,
    @"errorRecovery": @YES,
    @"jsonBoundary": @YES,
    @"closeAndRecreate": @YES,
    @"backgroundCreationRejected": @YES,
  };
}
}

@interface UIRuntimeChecksModule : NSObject <RCTBridgeModule>
@end

@implementation UIRuntimeChecksModule
RCT_EXPORT_MODULE(UIRuntimeChecks)
+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(run:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  // The app calls asynchronously. Test the ownership guard on a background
  // queue, then run the actual engine checks on UI. Neither thread waits.
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_DEFAULT, 0), ^{
    bool rejected = false;
    try { UIRuntime forbidden; }
    catch (const std::logic_error &) { rejected = true; }
    catch (const std::exception &error) {
      reject(@"ERR_UI_RUNTIME", @(error.what()), nil);
      return;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
      @try {
        try {
          NSDictionary *result = runChecks(rejected);
          NSLog(@"[UIRuntimePrimitive] Step 1 passed; runtimes destroyed on main");
          resolve(result);
        } catch (const std::exception &error) {
          reject(@"ERR_UI_RUNTIME", @(error.what()), nil);
        }
      } @catch (NSException *exception) {
        reject(@"ERR_UI_RUNTIME", exception.reason, nil);
      }
    });
  });
}
@end
