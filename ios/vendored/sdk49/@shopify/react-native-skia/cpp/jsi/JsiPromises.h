#pragma once

#include <memory>
#include <string>
#include <utility>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include "SkBase64.h"

namespace ABI49_0_0RNJsi {
namespace jsi = ABI49_0_0facebook::jsi;

/**
 These classes are taken from ABI49_0_0ReactCommon TurboModuleUtils. It is no longer (RN
 0.72) possible to include and uses TurboModulesUtils without a lot of trouble
 when use_frameworks are true in POD file. Instead we're now just including the
 implementations ourselves.
 */

class LongLivedObject {
public:
  void allowRelease();

protected:
  LongLivedObject() = default;
  virtual ~LongLivedObject() = default;
};

class JsiPromises {
public:
  struct Promise : public LongLivedObject {
    Promise(jsi::Runtime &rt, jsi::Function resolve, jsi::Function reject);

    void resolve(const jsi::Value &result);
    void reject(const std::string &error);

    jsi::Runtime &runtime_;
    jsi::Function resolve_;
    jsi::Function reject_;
  };

  using PromiseSetupFunctionType =
      std::function<void(jsi::Runtime &rt, std::shared_ptr<Promise>)>;

  static jsi::Value createPromiseAsJSIValue(jsi::Runtime &rt,
                                            PromiseSetupFunctionType &&func);
};

} // namespace ABI49_0_0RNJsi
