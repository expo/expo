// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#include <jsi/jsi.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>

namespace expo {

class ExpoRawProps {
public:
  mutable facebook::react::RawPropsParser const *parser_;
  mutable facebook::react::RawProps::Mode mode_;
  facebook::jsi::Runtime *runtime_;
  facebook::jsi::Value value_;
};

class ExpoViewProps final : public facebook::react::ViewProps {
public:
  ExpoViewProps() = default;
//  ExpoViewProps(const ExpoViewProps &expoViewProps);
  ExpoViewProps(const facebook::react::PropsParserContext &context,
                const ExpoViewProps &sourceProps,
                const facebook::react::RawProps &rawProps);

//  const ExpoRawProps *rawProps;
//  jsi::Runtime *runtime;
  std::shared_ptr<jsi::Value> value;

  const jsi::Value &getValue() const;

//  jsi::Runtime *getRuntime() const;
//  const jsi::Value getValue() const;
};

} // namespace expo

#endif // __cplusplus
