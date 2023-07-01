#include "Shareables.h"

using namespace facebook;

namespace reanimated {

CoreFunction::CoreFunction(
    JSRuntimeHelper *runtimeHelper,
    const jsi::Value &workletValue)
    : runtimeHelper_(runtimeHelper) {
  jsi::Runtime &rt = *runtimeHelper->rnRuntime();
  auto workletObject = workletValue.asObject(rt);
  rnFunction_ = std::make_unique<jsi::Function>(workletObject.asFunction(rt));
  functionBody_ = workletObject.getPropertyAsObject(rt, "__initData")
                      .getProperty(rt, "code")
                      .asString(rt)
                      .utf8(rt);
  location_ = "worklet_" +
      std::to_string(static_cast<uint64_t>(
          workletObject.getProperty(rt, "__workletHash").getNumber()));
}

std::unique_ptr<jsi::Function> &CoreFunction::getFunction(jsi::Runtime &rt) {
  if (runtimeHelper_->isUIRuntime(rt)) {
    if (uiFunction_ == nullptr) {
      // maybe need to initialize UI Function
      // the newline before closing paren is needed because the last line can be
      // an inline comment (specifically this happens when we attach source maps
      // at the end) in which case the paren won't be parsed
      auto codeBuffer = std::make_shared<const jsi::StringBuffer>(
          "(" + functionBody_ + "\n)");
      uiFunction_ = std::make_unique<jsi::Function>(
          rt.evaluateJavaScript(codeBuffer, location_)
              .asObject(rt)
              .asFunction(rt));
    }
    return uiFunction_;
  } else {
    // running on the main RN runtime
    return rnFunction_;
  }
}

std::shared_ptr<Shareable> extractShareableOrThrow(
    jsi::Runtime &rt,
    const jsi::Value &maybeShareableValue,
    const char *errorMessage) {
  if (maybeShareableValue.isObject()) {
    auto object = maybeShareableValue.asObject(rt);
    if (object.isHostObject<ShareableJSRef>(rt)) {
      return object.getHostObject<ShareableJSRef>(rt)->value();
    }
  } else if (maybeShareableValue.isUndefined()) {
    return Shareable::undefined();
  }
  throw std::runtime_error(
      errorMessage != nullptr
          ? errorMessage
          : "expecting the object to be of type ShareableJSRef");
}

Shareable::~Shareable() {}

ShareableArray::ShareableArray(jsi::Runtime &rt, const jsi::Array &array)
    : Shareable(ArrayType) {
  auto size = array.size(rt);
  data_.reserve(size);
  for (size_t i = 0; i < size; i++) {
    data_.push_back(extractShareableOrThrow(rt, array.getValueAtIndex(rt, i)));
  }
}

ShareableObject::ShareableObject(jsi::Runtime &rt, const jsi::Object &object)
    : Shareable(ObjectType) {
  auto propertyNames = object.getPropertyNames(rt);
  auto size = propertyNames.size(rt);
  data_.reserve(size);
  for (size_t i = 0; i < size; i++) {
    auto key = propertyNames.getValueAtIndex(rt, i).asString(rt);
    auto value = extractShareableOrThrow(rt, object.getProperty(rt, key));
    data_.emplace_back(key.utf8(rt), value);
  }
}

std::shared_ptr<Shareable> Shareable::undefined() {
  static auto undefined = std::make_shared<ShareableScalar>();
  return undefined;
}

} /* namespace reanimated */
