// Copyright 2026-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

// The tests decode props with a Hermes runtime, which a build without Hermes doesn't have.
#ifdef USE_HERMES
#import <ExpoModulesCore/ExpoNativeViewObjC.h>
#import <ExpoModulesCore/NewViewProps.h>

#include <memory>
#include <string>

#include <hermes/hermes.h>
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

- (void)updateDecodedProps:(nullable id)decodedProps
{
  self.updateCount++;
  self.lastDecodedProps = decodedProps;
}

@end

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

@end

#endif // USE_HERMES
