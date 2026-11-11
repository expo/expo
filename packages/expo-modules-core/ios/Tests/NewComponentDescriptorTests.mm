// Copyright 2026-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

// The tests run the descriptor with a Hermes runtime, which a build without Hermes doesn't have.
#ifdef USE_HERMES

#import <ExpoModulesCore/NewComponentDescriptor.h>

#include <algorithm>
#include <memory>
#include <string>
#include <vector>

#include <hermes/hermes.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/utils/ContextContainer.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;
namespace views = expo::views;

/**
 What `RecordingDecoder` makes: the keys it decoded and the previous props it got.
 Stands in for the decoded props.
 */
@interface RecordedDecode : NSObject
@end

@implementation RecordedDecode {
@public
  std::vector<std::string> keys;
  views::DecodedProps previous;
}
@end

namespace {

class RecordingDecoder final : public views::NewPropsDecoder {
public:
  mutable int decodeCount = 0;
  mutable std::vector<std::string> skippedPropNames;
  // When set, `decode` returns no decoded props, as a decoder that has nothing to decode may.
  bool returnsNothing = false;

  views::DecodedProps decode(jsi::Runtime &runtime, const jsi::Value &props, const views::DecodedProps &previous)
    const override {
    decodeCount++;
    if (returnsNothing) {
      return nullptr;
    }
    std::vector<std::string> keys;
    auto names = props.getObject(runtime).getPropertyNames(runtime);
    for (size_t i = 0; i < names.size(runtime); i++) {
      keys.push_back(names.getValueAtIndex(runtime, i).getString(runtime).utf8(runtime));
    }
    RecordedDecode *decode = [RecordedDecode new];
    decode->keys = keys;
    decode->previous = previous;
    return views::DecodedProps::adopt((__bridge_retained CFTypeRef)decode);
  }

  void didSkipProps(const std::vector<std::string_view> &propNames) const override {
    // Sorted, because a `folly::dynamic` object doesn't keep the order of its keys.
    skippedPropNames.assign(propNames.begin(), propNames.end());
    std::sort(skippedPropNames.begin(), skippedPropNames.end());
  }
};

const views::NewViewProps &newViewProps(const react::Props::Shared &props) {
  return static_cast<const views::NewViewProps &>(*props);
}

RecordedDecode *decodeOf(const react::Props::Shared &props) {
  return (__bridge RecordedDecode *)newViewProps(props).decodedProps.get();
}

react::RawProps makeJSIRawProps(jsi::Runtime &runtime, const char *source) {
  auto value = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(source), "test");
  return react::RawProps(runtime, value);
}

} // namespace

@interface NewComponentDescriptorTests : XCTestCase
@end

@implementation NewComponentDescriptorTests {
  std::unique_ptr<jsi::Runtime> _runtime;
  std::shared_ptr<RecordingDecoder> _decoder;
  std::shared_ptr<const views::NewComponentFlavor> _flavor;
  std::shared_ptr<react::ContextContainer> _contextContainer;
  std::unique_ptr<const react::ComponentDescriptor> _descriptor;
}

- (void)setUp
{
  _runtime = facebook::hermes::makeHermesRuntime();
  _decoder = std::make_shared<RecordingDecoder>();
  _flavor = std::make_shared<const views::NewComponentFlavor>(views::NewComponentFlavor{
    .name = "expo-test/TestView",
    .decoder = _decoder,
  });
  _contextContainer = std::make_shared<react::ContextContainer>();
  _descriptor = views::NewComponentDescriptor::provider(_flavor).constructor(react::ComponentDescriptorParameters{
    .eventDispatcher = {},
    .contextContainer = _contextContainer,
    .flavor = _flavor,
  });
}

- (void)tearDown
{
  // Release the runtime after each test rather than when XCTest deallocates the test case.
  _descriptor.reset();
  _runtime.reset();
}

// Takes the raw props by pointer: an Objective-C method can't take the move-only `RawProps` by value.
- (react::Props::Shared)cloneProps:(const react::Props::Shared &)props rawProps:(react::RawProps *)rawProps
{
  react::PropsParserContext context{-1, *_contextContainer};
  return _descriptor->cloneProps(context, props, std::move(*rawProps));
}

- (react::Props::Shared)cloneProps:(const react::Props::Shared &)props jsi:(const char *)source
{
  auto rawProps = makeJSIRawProps(*_runtime, source);
  return [self cloneProps:props rawProps:&rawProps];
}

- (void)testNameAndHandleComeFromFlavor
{
  auto provider = views::NewComponentDescriptor::provider(_flavor);

  XCTAssertEqual(std::string(_descriptor->getComponentName()), "expo-test/TestView");
  XCTAssertEqual(_descriptor->getComponentName(), _flavor->name.c_str());
  XCTAssertEqual(_descriptor->getComponentHandle(), provider.handle);
  XCTAssertEqual(std::string(provider.name), "expo-test/TestView");
}

- (void)testCreateDecodesJSIProps
{
  auto props = [self cloneProps:nullptr jsi:"({ title: 'Title', opacity: 0.5 })"];
  RecordedDecode *decode = decodeOf(props);

  XCTAssertEqual(_decoder->decodeCount, 1);
  XCTAssertTrue((decode->keys == std::vector<std::string>{"title", "opacity"}));
  XCTAssertFalse(decode->previous);
}

- (void)testBaseViewPropsAreStillParsed
{
  auto props = [self cloneProps:nullptr jsi:"({ title: 'Title', opacity: 0.5 })"];

  XCTAssertEqual(newViewProps(props).opacity, 0.5);
}

- (void)testUpdateGetsPreviousDecodedProps
{
  auto created = [self cloneProps:nullptr jsi:"({ title: 'Title', opacity: 0.5 })"];
  auto updated = [self cloneProps:created jsi:"({ title: 'New title' })"];
  RecordedDecode *decode = decodeOf(updated);

  XCTAssertEqual(_decoder->decodeCount, 2);
  XCTAssertTrue((decode->keys == std::vector<std::string>{"title"}));
  XCTAssertTrue(decode->previous == newViewProps(created).decodedProps);
  // The base view props that the update doesn't have keep their values.
  XCTAssertEqual(newViewProps(updated).opacity, 0.5);
}

- (void)testDynamicPropsAreSkipped
{
  auto created = [self cloneProps:nullptr jsi:"({ title: 'Title' })"];
  auto rawProps = react::RawProps(folly::dynamic::object("title", "New title")("opacity", 0.5));
  auto updated = [self cloneProps:created rawProps:&rawProps];

  XCTAssertEqual(_decoder->decodeCount, 1);
  XCTAssertTrue((_decoder->skippedPropNames == std::vector<std::string>{"opacity", "title"}));
  XCTAssertTrue(newViewProps(updated).decodedProps == newViewProps(created).decodedProps);
  // The base view props are still parsed from `folly::dynamic`.
  XCTAssertEqual(newViewProps(updated).opacity, 0.5);
}

- (void)testCreateWithoutPropsSharesDefaultProps
{
  react::RawProps rawProps;
  auto props = [self cloneProps:nullptr rawProps:&rawProps];

  XCTAssertEqual(props, views::NewViewShadowNode::defaultSharedProps());
  XCTAssertFalse(newViewProps(props).decodedProps);
  XCTAssertEqual(_decoder->decodeCount, 0);
}

- (void)testCloneWithoutRawPropsKeepsDecodedProps
{
  auto created = [self cloneProps:nullptr jsi:"({ title: 'Title' })"];
  react::RawProps rawProps;
  auto cloned = [self cloneProps:created rawProps:&rawProps];

  XCTAssertEqual(_decoder->decodeCount, 1);
  XCTAssertTrue(newViewProps(cloned).decodedProps == newViewProps(created).decodedProps);
}

- (void)testDecodedPropsLiveAsLongAsThePropsThatHoldThem
{
  __weak RecordedDecode *weakDecode;
  {
    react::Props::Shared props;
    @autoreleasepool {
      props = [self cloneProps:nullptr jsi:"({ title: 'Title' })"];
      weakDecode = decodeOf(props);
    }
    XCTAssertNotNil(weakDecode);
    // A copy retains the decoded props, and destroying it releases them.
    auto copy = newViewProps(props).decodedProps;
    XCTAssertTrue(copy == newViewProps(props).decodedProps);
  }
  XCTAssertNil(weakDecode);
}

- (void)testDecoderWithoutResultLeavesNoDecodedProps
{
  _decoder->returnsNothing = true;
  auto props = [self cloneProps:nullptr jsi:"({ title: 'Title', opacity: 0.5 })"];

  XCTAssertEqual(_decoder->decodeCount, 1);
  XCTAssertFalse(newViewProps(props).decodedProps);
  XCTAssertEqual(newViewProps(props).opacity, 0.5);
}

@end

#endif // USE_HERMES
