// Copyright 2026-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/ExpoNativeViewObjC.h>
#import <ExpoModulesCore/NewComponentDescriptor.h>
#import <ExpoModulesCore/ObjCPropsDecoder.h>

#import <React/RCTAssert.h>
#import <React/RCTComponentViewFactory.h>
#import <React/RCTLog.h>

#include <string>
#include <unordered_map>

namespace react = facebook::react;
namespace jsi = facebook::jsi;
namespace views = expo::views;

namespace {

/**
 Decodes no props. The flavor of a class that wasn't registered with a decoder gets it, so Fabric can
 still create the component.
 */
class NoPropsDecoder final : public views::NewPropsDecoder {
public:
  views::DecodedProps decode(jsi::Runtime &, const jsi::Value &, const views::DecodedProps &previous) const override
  {
    return previous;
  }

  std::vector<std::string> propNames() const override
  {
    return {};
  }

  views::DecodedProps decodeValues(
    jsi::Runtime &,
    const std::vector<std::pair<size_t, jsi::Value>> &,
    const views::DecodedProps &previous) const override
  {
    return previous;
  }

  void didSkipProps(const std::vector<std::string_view> &) const override {}
};

/**
 The flavors of the registered classes, keyed by the class name. A flavor must stay alive at the same
 address after reloads, because its name is the component handle. Accessed only on the main thread.
 */
std::unordered_map<std::string, std::shared_ptr<const views::NewComponentFlavor>> &componentFlavors()
{
  static std::unordered_map<std::string, std::shared_ptr<const views::NewComponentFlavor>> flavors;
  return flavors;
}

} // namespace

@implementation ExpoNativeViewObjC

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    // `finalizeUpdates:` reads the props as `NewViewProps`, so the default props must be of that type too.
    _props = views::NewViewShadowNode::defaultSharedProps();
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (react::ComponentDescriptorProvider)componentDescriptorProvider
{
  std::string className([NSStringFromClass(self) UTF8String]);
  auto &flavor = componentFlavors()[className];

  if (!flavor) {
    RCTLogError(@"The view class '%s' isn't registered with a props decoder, so its props aren't decoded", className.c_str());
    flavor = std::make_shared<const views::NewComponentFlavor>(views::NewComponentFlavor{
      .name = className,
      .decoder = std::make_shared<NoPropsDecoder>(),
    });
  }
  return views::NewComponentDescriptor::provider(flavor);
}

+ (BOOL)shouldBeRecycled
{
  // Like the views of `ExpoFabricViewObjC`, the views aren't recycled.
  return NO;
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];

  if (updateMask & RNComponentViewUpdateMaskProps) {
    const auto &props = static_cast<const views::NewViewProps &>(*_props);
    [self updateDecodedProps:(__bridge id)props.decodedProps.get()];
  }
}

#pragma mark - Methods to override in Swift

- (void)updateDecodedProps:(nullable id)decodedProps
{
  // Implemented in `ExpoNativeView.swift`
}

#pragma mark - Component registration

+ (void)registerComponentViewClass:(nonnull Class)viewClass propsDecoder:(nonnull id<EXViewPropsDecoding>)propsDecoder
{
  RCTAssertMainQueue();

  std::string className([NSStringFromClass(viewClass) UTF8String]);
  auto &flavor = componentFlavors()[className];

  if (!flavor) {
    flavor = std::make_shared<const views::NewComponentFlavor>(views::NewComponentFlavor{
      .name = className,
      .decoder = std::make_shared<views::ObjCPropsDecoder>(propsDecoder),
    });
  }
  [[RCTComponentViewFactory currentComponentViewFactory] registerComponentViewClass:viewClass];
}

@end
