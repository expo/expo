// Copyright 2026-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

// The tests decode props with a Hermes runtime, which a build without Hermes doesn't have.
#ifdef USE_HERMES
#import <ExpoModulesCore/ExpoNativeViewObjC.h>
#import <ExpoModulesCore/ExpoSwiftUIViewObjC.h>
#import <ExpoModulesCore/NewComponentRegistry.h>
#import <ExpoModulesCore/NewViewProps.h>

#include <memory>
#include <string>

#include <hermes/hermes.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/utils/ContextContainer.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;
namespace views = expo::views;

/**
 Records the decoded props that `finalizeUpdates:` passes to it.
 */
@interface RecordingNativeViewObjC : ExpoNativeViewObjC
@property (nonatomic) NSInteger updateCount;
@property (nonatomic, nullable) id lastDecodedProps;
@end

@implementation RecordingNativeViewObjC

- (void)updateDecodedProps:(nullable const void *)decodedProps
{
  self.updateCount++;
  self.lastDecodedProps = (__bridge id)decodedProps;
}

@end

/**
 The component view of a SwiftUI view.
 */
@interface TestSwiftUIViewObjC : ExpoSwiftUIViewObjC
@end

@implementation TestSwiftUIViewObjC
@end

namespace {

/**
 A shadow node that the descriptor of a component creates. It keeps the descriptor, because the family of the node
 refers to it.
 */
struct TestShadowNode {
  react::ComponentDescriptor::Unique descriptor;
  std::shared_ptr<react::ShadowNode> node;
};

TestShadowNode createShadowNode(const react::ComponentDescriptorProvider &provider)
{
  auto contextContainer = std::make_shared<react::ContextContainer>();
  auto descriptor = provider.constructor(react::ComponentDescriptorParameters{
    .eventDispatcher = {},
    .contextContainer = contextContainer,
    .flavor = provider.flavor,
  });
  react::PropsParserContext context{-1, *contextContainer};
  auto props = descriptor->cloneProps(context, nullptr, react::RawProps());
  auto family = descriptor->createFamily({.tag = 1, .surfaceId = 1, .instanceHandle = nullptr});
  auto node = descriptor->createShadowNode({.props = props}, family);
  return {.descriptor = std::move(descriptor), .node = std::move(node)};
}

} // namespace

/**
 Decodes the `title` prop into a new object.
 */
@interface NewObjectViewPropsDecoder : NSObject <EXViewPropsDecoding>
@end

@implementation NewObjectViewPropsDecoder

- (nullable const void *)decodeProps:(const void *)props
                             runtime:(const void *)runtime
                            previous:(nullable const void *)previous
{
  return (__bridge_retained const void *)[NSObject new];
}

- (NSArray<NSString *> *)propNames
{
  return @[ @"title" ];
}

- (nullable const void *)decodeValues:(const void *const _Nonnull *)values
                              indexes:(const NSInteger *)indexes
                                count:(NSInteger)count
                              runtime:(const void *)runtime
                             previous:(nullable const void *)previous
{
  return (__bridge_retained const void *)[NSObject new];
}

- (BOOL)withRuntimeForCurrentThread:(NS_NOESCAPE void (^)(const void *runtime))block
{
  return NO;
}

- (void)didSkipProps:(NSArray<NSString *> *)propNames
{
}

@end

@interface ExpoNativeViewObjCTests : XCTestCase
@end

@implementation ExpoNativeViewObjCTests

- (void)setUp
{
  [ExpoNativeViewObjC registerComponentViewClass:[RecordingNativeViewObjC class]
                                    propsDecoder:[NewObjectViewPropsDecoder new]];
}

- (void)testComponentDescriptorProviderKeepsTheFlavorOfTheClass
{
  auto first = [RecordingNativeViewObjC componentDescriptorProvider];
  auto second = [RecordingNativeViewObjC componentDescriptorProvider];

  XCTAssertEqual(std::string(first.name), "RecordingNativeViewObjC");
  XCTAssertEqual(first.handle, second.handle);
  XCTAssertEqual(first.flavor, second.flavor);
}

- (void)testFinalizeUpdatesPassesTheDecodedProps
{
  auto provider = [RecordingNativeViewObjC componentDescriptorProvider];
  auto contextContainer = std::make_shared<react::ContextContainer>();
  auto descriptor = provider.constructor(react::ComponentDescriptorParameters{
    .eventDispatcher = {},
    .contextContainer = contextContainer,
    .flavor = provider.flavor,
  });

  auto runtime = facebook::hermes::makeHermesRuntime();
  auto value = runtime->evaluateJavaScript(std::make_shared<jsi::StringBuffer>("({ title: 'Title' })"), "test");
  react::PropsParserContext context{-1, *contextContainer};
  auto props = descriptor->cloneProps(context, nullptr, react::RawProps(*runtime, value));
  id decodedProps = (__bridge id) static_cast<const views::NewViewProps &>(*props).decodedProps.get();
  XCTAssertNotNil(decodedProps);

  RecordingNativeViewObjC *view = [RecordingNativeViewObjC new];
  [view updateProps:props oldProps:view.props];
  [view finalizeUpdates:RNComponentViewUpdateMaskProps];

  XCTAssertEqual(view.updateCount, 1);
  XCTAssertEqual(view.lastDecodedProps, decodedProps);

  // Updates without new props don't pass the decoded props again.
  [view finalizeUpdates:RNComponentViewUpdateMaskNone];
  XCTAssertEqual(view.updateCount, 1);
}

- (void)testOnlySwiftUIViewsKeepTheirDirectChildren
{
  [ExpoNativeViewObjC registerComponentViewClass:[TestSwiftUIViewObjC class]
                                    propsDecoder:[NewObjectViewPropsDecoder new]];
  auto keepsDirectChildren = [](Class viewClass) {
    return createShadowNode(views::componentDescriptorProvider(viewClass))
      .node->getTraits()
      .check(react::ShadowNodeTraits::Trait::ChildrenFormStackingContext);
  };

  // Each direct child of a SwiftUI view is an element of its `children`, so Fabric must not flatten it.
  XCTAssertTrue(keepsDirectChildren([TestSwiftUIViewObjC class]));
  XCTAssertFalse(keepsDirectChildren([RecordingNativeViewObjC class]));
}

- (void)testMeasuringSkipsTheLayoutOriginOfSwiftUIViews
{
  [ExpoNativeViewObjC registerComponentViewClass:[TestSwiftUIViewObjC class]
                                    propsDecoder:[NewObjectViewPropsDecoder new]];
  // The offset that `measure()` adds for a view to the positions of its descendants, for a view at (30, 40).
  auto contentOriginOffset = [](Class viewClass, bool includeTransform) {
    auto shadowNode = createShadowNode(views::componentDescriptorProvider(viewClass));
    auto &node = static_cast<react::LayoutableShadowNode &>(*shadowNode.node);
    auto layoutMetrics = node.getLayoutMetrics();
    layoutMetrics.frame.origin = {.x = 30, .y = 40};
    node.setLayoutMetrics(layoutMetrics);
    return node.getContentOriginOffset(includeTransform);
  };

  // SwiftUI places the view, not Yoga, so the offset takes its layout origin away.
  auto swiftUIOffset = contentOriginOffset([TestSwiftUIViewObjC class], true);
  XCTAssertEqual(swiftUIOffset.x, -30);
  XCTAssertEqual(swiftUIOffset.y, -40);

  // Without the transform, the caller asks for a scroll offset, which the view doesn't have.
  auto scrollOffset = contentOriginOffset([TestSwiftUIViewObjC class], false);
  XCTAssertEqual(scrollOffset.x, 0);
  XCTAssertEqual(scrollOffset.y, 0);

  auto uiKitOffset = contentOriginOffset([RecordingNativeViewObjC class], true);
  XCTAssertEqual(uiKitOffset.x, 0);
  XCTAssertEqual(uiKitOffset.y, 0);
}

@end

#endif // USE_HERMES
