// Copyright 2026-present 650 Industries. All rights reserved.

#import "EXTestNewComponentDescriptor.h"

#import <ExpoModulesCore/NewComponentDescriptor.h>
#import <ExpoModulesCore/ObjCPropsDecoder.h>

#include <memory>

#include <folly/dynamic.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/utils/ContextContainer.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;
namespace views = expo::views;

@implementation EXTestNewComponentDescriptor {
  std::shared_ptr<react::ContextContainer> _contextContainer;
  std::shared_ptr<const views::NewComponentFlavor> _flavor;
  std::unique_ptr<const react::ComponentDescriptor> _descriptor;
  react::Props::Shared _props;
}

- (instancetype)initWithDecoder:(id<EXViewPropsDecoding>)decoder
{
  if (self = [super init]) {
    _contextContainer = std::make_shared<react::ContextContainer>();
    _flavor = std::make_shared<const views::NewComponentFlavor>(views::NewComponentFlavor{
      .name = "expo-test/EndToEndView",
      .decoder = std::make_shared<views::ObjCPropsDecoder>(decoder),
    });
    _descriptor = views::NewComponentDescriptor::provider(_flavor).constructor(react::ComponentDescriptorParameters{
      .eventDispatcher = {},
      .contextContainer = _contextContainer,
      .flavor = _flavor,
    });
  }
  return self;
}

- (nullable id)updateWithRuntime:(void *)runtime props:(const void *)props
{
  auto &jsiRuntime = *static_cast<jsi::Runtime *>(runtime);
  return [self cloneWithRawProps:react::RawProps(jsiRuntime, *static_cast<const jsi::Value *>(props))];
}

- (nullable id)updateWithDynamicProps:(NSDictionary<NSString *, id> *)props
{
  folly::dynamic dynamicProps = folly::dynamic::object;
  for (NSString *key in props) {
    id value = props[key];
    if ([value isKindOfClass:[NSString class]]) {
      dynamicProps[key.UTF8String] = [value UTF8String];
    } else if ([value isKindOfClass:[NSNumber class]]) {
      dynamicProps[key.UTF8String] = [value doubleValue];
    }
  }
  return [self cloneWithRawProps:react::RawProps(std::move(dynamicProps))];
}

- (nullable id)cloneWithRawProps:(react::RawProps)rawProps
{
  react::PropsParserContext context{-1, *_contextContainer};
  _props = _descriptor->cloneProps(context, _props, std::move(rawProps));
  return (__bridge id)static_cast<const views::NewViewProps &>(*_props).decodedProps.get();
}

- (void)reset
{
  _props = nullptr;
}

- (float)opacity
{
  return _props ? static_cast<const views::NewViewProps &>(*_props).opacity : 1;
}

@end
