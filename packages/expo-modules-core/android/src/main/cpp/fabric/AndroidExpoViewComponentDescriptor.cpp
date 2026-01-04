#include "AndroidExpoViewComponentDescriptor.h"

namespace expo {

// TODO(@lukmccall): Ask for public API to access RawProps internals
struct RawPropsAccessor {
  react::RawPropsParser *parser_{nullptr};
  react::RawProps::Mode mode_;
  jsi::Runtime *runtime_{};
  jsi::Value value_;
};

void AndroidExpoViewComponentDescriptor::setStateProps(
  const std::unordered_map<
    std::string,
    std::shared_ptr<FrontendConverter>
  > &stateProps
) {
  stateProps_ = stateProps;
}

react::Props::Shared AndroidExpoViewComponentDescriptor::cloneProps(
  const react::PropsParserContext &context,
  const react::Props::Shared &props,
  react::RawProps rawProps
) const {
  if (!props && rawProps.isEmpty()) {
    return ExpoViewShadowNode<AndroidExpoViewProps>::defaultSharedProps();
  }

  rawProps.parse(rawPropsParser_);

  auto shadowNodeProps = std::make_shared<AndroidExpoViewProps>(
    context,
    props ? dynamic_cast<const AndroidExpoViewProps &>(*props)
      : *ExpoViewShadowNode<AndroidExpoViewProps>::defaultSharedProps(),
    rawProps,
    filterObjectKeys_
  );

  // TODO(@lukmccall): We probably can remove this loop
  if (react::ReactNativeFeatureFlags::enableCppPropsIteratorSetter()) {
#ifdef RN_SERIALIZABLE_STATE
    const auto &dynamic = shadowNodeProps->rawProps;
#else
    const auto &dynamic = static_cast<folly::dynamic>(rawProps);
#endif
    for (const auto &pair: dynamic.items()) {
      const auto &name = pair.first.getString();
      shadowNodeProps->setProp(
        context,
        RAW_PROPS_KEY_HASH(name),
        name.c_str(),
        react::RawValue(pair.second)
      );
    }
  }

  if (!stateProps_.empty()) {
    JNIEnv *env = jni::Environment::current();
    const auto &rawPropsAccessor = *((RawPropsAccessor *) &rawProps);

    jsi::Runtime &runtime = *rawPropsAccessor.runtime_;
    const auto jsiProps = rawPropsAccessor.value_.asObject(runtime);

    for (const auto &statePropPair: stateProps_) {
      const auto &[propName, converter] = statePropPair;

      const auto jsPropName = jsi::String::createFromUtf8(runtime, propName);
      if (!jsiProps.hasProperty(runtime, jsPropName)) {
        continue; // Property does not exist on the JS object
      }

      const auto value = jsiProps.getProperty(runtime, jsPropName);

      if (shadowNodeProps->statePropsDiff == nullptr) {
        shadowNodeProps->statePropsDiff = jni::make_global(
          jni::JHashMap<jstring, jobject>::create()
        );
      }

      jobject jConvertedValue = converter->convert(runtime, env, value);
      shadowNodeProps->statePropsDiff->put(
        jni::make_jstring(propName),
        jConvertedValue
      );
    }
  }

  return shadowNodeProps;
}

void AndroidExpoViewComponentDescriptor::adopt(react::ShadowNode &shadowNode) const {
  react_native_assert(dynamic_cast<ExpoShadowNode *>(&shadowNode));

  Base::adopt(shadowNode);

  const auto snode = dynamic_cast<ExpoShadowNode *>(&shadowNode);
  auto &props = *std::static_pointer_cast<const AndroidExpoViewProps>(
    snode->getProps());
  snode->getStateData().statePropsDiff = props.statePropsDiff;
  props.statePropsDiff = nullptr;
}

} // expo
