#include "AndroidExpoViewProps.h"

namespace expo {

AndroidExpoViewProps::AndroidExpoViewProps(
  const facebook::react::PropsParserContext &context,
  const AndroidExpoViewProps &sourceProps,
  const facebook::react::RawProps &rawProps,
  const std::function<bool(const std::string &)> &filterObjectKeys
) : ExpoViewProps(context, sourceProps, rawProps, filterObjectKeys),
    statePropsDiff(nullptr) {
}

AndroidExpoViewProps::~AndroidExpoViewProps() {
  if (statePropsDiff != nullptr) {
    jni::ThreadScope::WithClassLoader([this] {
      jni::Environment::current()->DeleteGlobalRef(statePropsDiff.release());
    });
  }
}

} // expo
