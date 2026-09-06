#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <string>

namespace expo::ui {
class UIExecutionQueue;

// Step 1: an engine with one permanent owner, not yet a React environment.
// Construct, evaluate, close, and destroy on the main/UI thread only.
class UIRuntime final {
 public:
  UIRuntime();
  ~UIRuntime();
  UIRuntime(const UIRuntime &) = delete;
  UIRuntime &operator=(const UIRuntime &) = delete;
  UIRuntime(UIRuntime &&) = delete;
  UIRuntime &operator=(UIRuntime &&) = delete;

  // Only a copied JSON string leaves the runtime. No JSI handles escape.
  // The script must produce a JSON-serializable value. Errors propagate.
  std::string evaluateJSON(const std::string &source);
  // Bootstrap a bundle whose result need not be JSON (usually undefined).
  void loadScript(const std::string &source, const std::string &sourceURL);
  // Install native task-ID scheduling and a monotonic clock. The JS bootstrap
  // keeps callback functions inside this runtime; native jobs carry IDs only.
  void installTaskScheduling(UIExecutionQueue &queue);
  void close(); // Idempotent. Evaluation after closing is rejected.

 private:
  static void requireUIThread();
  // Still privately owned. Weak references let queued callbacks detect closure.
  std::shared_ptr<facebook::jsi::Runtime> runtime_;
};

} // namespace expo::ui
