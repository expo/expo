#include "WorkletRuntimeDecorator.h"
#include "JSISerializer.h"
#include "Logger.h"
#include "ReanimatedJSIUtils.h"
#include "Shareables.h"

namespace reanimated {

void WorkletRuntimeDecorator::decorate(
    jsi::Runtime &rt,
    const std::string &name,
    const std::shared_ptr<JSScheduler> &jsScheduler) {
  // resolves "ReferenceError: Property 'global' doesn't exist at ..."
  rt.global().setProperty(rt, "global", rt.global());

  rt.global().setProperty(rt, "_WORKLET", true);

  rt.global().setProperty(rt, "_LABEL", jsi::String::createFromAscii(rt, name));

#ifdef DEBUG
  auto evalWithSourceUrl = [](jsi::Runtime &rt,
                              const jsi::Value &thisValue,
                              const jsi::Value *args,
                              size_t count) -> jsi::Value {
    auto code = std::make_shared<const jsi::StringBuffer>(
        args[0].asString(rt).utf8(rt));
    std::string url;
    if (count > 1 && args[1].isString()) {
      url = args[1].asString(rt).utf8(rt);
    }
    return rt.evaluateJavaScript(code, url);
  };
  rt.global().setProperty(
      rt,
      "evalWithSourceUrl",
      jsi::Function::createFromHostFunction(
          rt,
          jsi::PropNameID::forAscii(rt, "evalWithSourceUrl"),
          1,
          evalWithSourceUrl));
#endif

  jsi_utils::installJsiFunction(
      rt, "_toString", [](jsi::Runtime &rt, const jsi::Value &value) {
        return jsi::String::createFromUtf8(rt, stringifyJSIValue(rt, value));
      });

  jsi_utils::installJsiFunction(
      rt, "_log", [](jsi::Runtime &rt, const jsi::Value &value) {
        Logger::log(stringifyJSIValue(rt, value));
      });

  jsi_utils::installJsiFunction(
      rt, "_makeShareableClone", [](jsi::Runtime &rt, const jsi::Value &value) {
        auto shouldRetainRemote = jsi::Value::undefined();
        return reanimated::makeShareableClone(rt, value, shouldRetainRemote);
      });

  jsi_utils::installJsiFunction(
      rt,
      "_scheduleOnJS",
      [jsScheduler](
          jsi::Runtime &rt,
          const jsi::Value &remoteFun,
          const jsi::Value &argsValue) {
        auto shareableRemoteFun = extractShareableOrThrow<
            ShareableRemoteFunction>(
            rt,
            remoteFun,
            "[Reanimated] Incompatible object passed to scheduleOnJS. It is only allowed to schedule worklets or functions defined on the React Native JS runtime this way.");
        auto shareableArgs = argsValue.isUndefined()
            ? nullptr
            : extractShareableOrThrow<ShareableArray>(
                  rt, argsValue, "[Reanimated] Args must be an array.");
        jsScheduler->scheduleOnJS([=](jsi::Runtime &rt) {
          auto remoteFun = shareableRemoteFun->getJSValue(rt);
          if (shareableArgs == nullptr) {
            // fast path for remote function w/o arguments
            remoteFun.asObject(rt).asFunction(rt).call(rt);
          } else {
            auto argsArray =
                shareableArgs->getJSValue(rt).asObject(rt).asArray(rt);
            auto argsSize = argsArray.size(rt);
            // number of arguments is typically relatively small so it is ok to
            // to use VLAs here, hence disabling the lint rule
            jsi::Value args[argsSize]; // NOLINT(runtime/arrays)
            for (size_t i = 0; i < argsSize; i++) {
              args[i] = argsArray.getValueAtIndex(rt, i);
            }
            remoteFun.asObject(rt).asFunction(rt).call(rt, args, argsSize);
          }
        });
      });
}

} // namespace reanimated
