#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <string>

namespace expo::ui {

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
  void close(); // Idempotent. Evaluation after closing is rejected.

 private:
  static void requireUIThread();
  std::unique_ptr<facebook::jsi::Runtime> runtime_;
};

} // namespace expo::ui
