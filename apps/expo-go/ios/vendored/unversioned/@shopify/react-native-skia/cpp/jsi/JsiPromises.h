#pragma once

#include <memory>
#include <string>
#include <utility>

#include <jsi/jsi.h>

#include "SkBase64.h"

namespace RNJsi {
namespace jsi = facebook::jsi;

/**
 These classes are taken from ReactCommon TurboModuleUtils. It is no longer (RN
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

} // namespace RNJsi
