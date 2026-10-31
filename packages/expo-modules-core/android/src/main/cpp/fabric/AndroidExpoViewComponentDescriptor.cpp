#include "AndroidExpoViewComponentDescriptor.h"

namespace expo {

// TODO(@lukmccall): Ask for public API to access RawProps internals
struct RawPropsAccessor {
  react::RawPropsParser *parser_{nullptr};
  react::RawProps::Mode mode_;
  jsi::Runtime *runtime_{};
  jsi::Value value_;
};

void AndroidExpoViewComponentDescriptor::setComponentRegistration(
  std::shared_ptr<ExpoViewComponentRegistration> registration
) {
  registration_ = std::move(registration);
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

  // A reload can replace the schema while a render still uses its previous snapshot.
  const auto stateProps = registration_ ? registration_->getStateProps() : nullptr;
  const auto filterObjectKeys = [&stateProps](const std::string &key) {
    return stateProps && stateProps->find(key) != stateProps->end();
  };

  const auto &sourceProps = props
    ? dynamic_cast<const AndroidExpoViewProps &>(*props)
    : *ExpoViewShadowNode<AndroidExpoViewProps>::defaultSharedProps();

  auto shadowNodeProps = std::make_shared<AndroidExpoViewProps>(
    context,
    sourceProps,
    rawProps,
    filterObjectKeys
  );

#ifdef RN_SERIALIZABLE_STATE
  shadowNodeProps->initializeDynamicProps(sourceProps, rawProps, filterObjectKeys);
#endif

  if (stateProps && !stateProps->empty()) {
    JNIEnv *env = jni::Environment::current();
    const auto &rawPropsAccessor = *((RawPropsAccessor *) &rawProps);

    jsi::Runtime &runtime = *rawPropsAccessor.runtime_;
    const auto jsiProps = rawPropsAccessor.value_.asObject(runtime);

    for (const auto &statePropPair: *stateProps) {
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

} // namespace expo
