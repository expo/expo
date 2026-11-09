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
#include <react/renderer/core/RawPropsParser.h>
#include <react/utils/ContextContainer.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;
namespace views = expo::views;
namespace yoga = facebook::yoga;

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

/**
 Decodes the `title` and `opacity` props. `opacity` has the name of a base view prop, which React Native
 parses too.
 */
class RecordingDecoder final : public views::NewPropsDecoder {
public:
  mutable int decodeCount = 0;
  mutable std::vector<std::string> skippedPropNames;
  // When set, a decode returns no decoded props, as a decoder that has nothing to decode may.
  bool returnsNothing = false;

  std::vector<std::string> propNames() const override {
    return {"title", "opacity"};
  }

  views::DecodedProps decode(jsi::Runtime &runtime, const jsi::Value &props, const views::DecodedProps &previous)
    const override {
    // Like the Swift decoder, it decodes only its own props and skips the other keys.
    const auto ownNames = propNames();
    std::vector<std::string> keys;
    auto names = props.getObject(runtime).getPropertyNames(runtime);
    for (size_t i = 0; i < names.size(runtime); i++) {
      auto key = names.getValueAtIndex(runtime, i).getString(runtime).utf8(runtime);
      if (std::find(ownNames.begin(), ownNames.end(), key) != ownNames.end()) {
        keys.push_back(key);
      }
    }
    return record(keys, previous);
  }

  views::DecodedProps decodeValues(
    jsi::Runtime &runtime,
    const std::vector<std::pair<size_t, jsi::Value>> &values,
    const views::DecodedProps &previous
  ) const override {
    const auto ownNames = propNames();
    std::vector<std::string> keys;
    for (const auto &[index, value] : values) {
      keys.push_back(ownNames.at(index));
    }
    return record(keys, previous);
  }

  void didSkipProps(const std::vector<std::string_view> &propNames) const override {
    // Sorted, because a `folly::dynamic` object doesn't keep the order of its keys. Only the decoder's own
    // props, because the descriptor may pass the other keys too.
    const auto ownNames = this->propNames();
    skippedPropNames.clear();
    for (const auto &name : propNames) {
      if (std::find(ownNames.begin(), ownNames.end(), name) != ownNames.end()) {
        skippedPropNames.emplace_back(name);
      }
    }
    std::sort(skippedPropNames.begin(), skippedPropNames.end());
  }

private:
  views::DecodedProps record(const std::vector<std::string> &keys, const views::DecodedProps &previous) const {
    decodeCount++;
    if (returnsNothing) {
      return nullptr;
    }
    if (keys.empty()) {
      return previous;
    }
    RecordedDecode *decode = [RecordedDecode new];
    decode->keys = keys;
    decode->previous = previous;
    return views::DecodedProps::adopt((__bridge_retained CFTypeRef)decode);
  }
};

const views::NewViewProps &newViewProps(const react::Props::Shared &props) {
  return static_cast<const views::NewViewProps &>(*props);
}

RecordedDecode *decodeOf(const react::Props::Shared &props) {
  return (__bridge RecordedDecode *)newViewProps(props).decodedProps.get();
}

jsi::Value evaluate(jsi::Runtime &runtime, const char *source) {
  return runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(source), "test");
}

react::RawProps makeJSIRawProps(jsi::Runtime &runtime, const char *source) {
  return react::RawProps(runtime, evaluate(runtime, source));
}

/**
 Returns the names of the base view props that differ between the given props.
 */
std::vector<std::string> differentBaseViewProps(const views::NewViewProps &lhs, const views::NewViewProps &rhs) {
  std::vector<std::string> names;
  auto check = [&](const char *name, bool isEqual) {
    if (!isEqual) {
      names.emplace_back(name);
    }
  };
  check("opacity", lhs.opacity == rhs.opacity);
  check("backgroundColor", lhs.backgroundColor == rhs.backgroundColor);
  check("transform", lhs.transform == rhs.transform);
  check("transformOrigin", lhs.transformOrigin == rhs.transformOrigin);
  check("zIndex", lhs.zIndex == rhs.zIndex);
  check("pointerEvents", lhs.pointerEvents == rhs.pointerEvents);
  check("hitSlop", lhs.hitSlop == rhs.hitSlop);
  check("shadowColor", lhs.shadowColor == rhs.shadowColor);
  check("shadowOpacity", lhs.shadowOpacity == rhs.shadowOpacity);
  check("shadowRadius", lhs.shadowRadius == rhs.shadowRadius);
  check("backfaceVisibility", lhs.backfaceVisibility == rhs.backfaceVisibility);
  check("collapsable", lhs.collapsable == rhs.collapsable);
  check("events", lhs.events == rhs.events);
  check("nativeId", lhs.nativeId == rhs.nativeId);
  check("testId", lhs.testId == rhs.testId);
  check("accessible", lhs.accessible == rhs.accessible);
  check("accessibilityLabel", lhs.accessibilityLabel == rhs.accessibilityLabel);
  check("accessibilityHint", lhs.accessibilityHint == rhs.accessibilityHint);
  check("accessibilityState", lhs.accessibilityState == rhs.accessibilityState);
  check("accessibilityTraits", lhs.accessibilityTraits == rhs.accessibilityTraits);
  check("accessibilityRole", lhs.accessibilityRole == rhs.accessibilityRole);
  check("role", lhs.role == rhs.role);
  check("borderRadii", lhs.borderRadii == rhs.borderRadii);
  check("borderColors", lhs.borderColors == rhs.borderColors);
  check("borderStyles", lhs.borderStyles == rhs.borderStyles);
  check("borderWidths", lhs.getBorderWidths() == rhs.getBorderWidths());
  const auto &lhsYoga = lhs.yogaStyle;
  const auto &rhsYoga = rhs.yogaStyle;
  check("yoga width", lhsYoga.dimension(yoga::Dimension::Width) == rhsYoga.dimension(yoga::Dimension::Width));
  check("yoga height", lhsYoga.dimension(yoga::Dimension::Height) == rhsYoga.dimension(yoga::Dimension::Height));
  check("yoga minWidth", lhsYoga.minDimension(yoga::Dimension::Width) == rhsYoga.minDimension(yoga::Dimension::Width));
  check("yoga margin", lhsYoga.margin(yoga::Edge::All) == rhsYoga.margin(yoga::Edge::All));
  check("yoga marginTop", lhsYoga.margin(yoga::Edge::Top) == rhsYoga.margin(yoga::Edge::Top));
  check("yoga paddingHorizontal", lhsYoga.padding(yoga::Edge::Horizontal) == rhsYoga.padding(yoga::Edge::Horizontal));
  check("yoga borderWidth", lhsYoga.border(yoga::Edge::All) == rhsYoga.border(yoga::Edge::All));
  check("yoga borderTopWidth", lhsYoga.border(yoga::Edge::Top) == rhsYoga.border(yoga::Edge::Top));
  check("yoga top", lhsYoga.position(yoga::Edge::Top) == rhsYoga.position(yoga::Edge::Top));
  check("yoga position", lhsYoga.positionType() == rhsYoga.positionType());
  check("yoga flexDirection", lhsYoga.flexDirection() == rhsYoga.flexDirection());
  check("yoga alignItems", lhsYoga.alignItems() == rhsYoga.alignItems());
  check("yoga justifyContent", lhsYoga.justifyContent() == rhsYoga.justifyContent());
  check("yoga flexGrow", lhsYoga.flexGrow() == rhsYoga.flexGrow());
  check("yoga overflow", lhsYoga.overflow() == rhsYoga.overflow());
  check("yoga aspectRatio", lhsYoga.aspectRatio() == rhsYoga.aspectRatio());
  check("yoga gap", lhsYoga.gap(yoga::Gutter::All) == rhsYoga.gap(yoga::Gutter::All));
  check("yogaStyle", lhsYoga == rhsYoga);
  return names;
}

NSString *joined(const std::vector<std::string> &names) {
  NSMutableArray<NSString *> *strings = [NSMutableArray array];
  for (const auto &name : names) {
    [strings addObject:@(name.c_str())];
  }
  return [strings componentsJoinedByString:@", "];
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

- (void)testUpdateWithOnlyBaseViewPropsKeepsDecodedProps
{
  auto created = [self cloneProps:nullptr jsi:"({ title: 'Title' })"];
  auto updated = [self cloneProps:created jsi:"({ width: 10, testID: 'test' })"];

  XCTAssertTrue(newViewProps(updated).decodedProps == newViewProps(created).decodedProps);
  XCTAssertEqual(newViewProps(updated).testId, "test");
}

- (void)testShouldRasterizeIOSSetsShouldRasterize
{
  auto props = [self cloneProps:nullptr jsi:"({ shouldRasterizeIOS: true })"];

  XCTAssertTrue(newViewProps(props).shouldRasterize);
}

- (void)testBaseViewPropsMatchTheClassicParser
{
  // What `ConcreteComponentDescriptor` prepares for the classic path, which parses with `RawPropsParser`.
  react::RawPropsParser parser;
  parser.prepare<views::NewViewProps>();
  react::PropsParserContext context{-1, *_contextContainer};

  auto classicClone = [&](const views::NewViewProps &sourceProps, const jsi::Value &value) {
    react::RawProps rawProps(*_runtime, value);
    rawProps.parse(parser);
    return std::make_shared<const views::NewViewProps>(context, sourceProps, rawProps);
  };

  auto created = evaluate(*_runtime, R"JS(({
    title: 'Title',
    opacity: 0.5,
    backgroundColor: 0xff336699,
    transform: [{ translateX: 10 }, { rotate: '45deg' }, { scale: 2 }],
    transformOrigin: [10, 20, 0],
    zIndex: 3,
    pointerEvents: 'box-none',
    hitSlop: { top: 1, left: 2, bottom: 3, right: 4 },
    shadowColor: 0xff000000,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    backfaceVisibility: 'hidden',
    collapsable: false,
    onLayout: true,
    nativeID: 'native',
    testID: 'test',
    accessible: true,
    accessibilityLabel: 'Label',
    accessibilityHint: 'Hint',
    accessibilityState: { disabled: true, selected: true },
    accessibilityRole: 'button',
    role: 'link',
    borderRadius: 4,
    borderTopLeftRadius: 8,
    borderColor: 0xff0000ff,
    borderLeftColor: 0xff00ff00,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderTopWidth: 3,
    width: 100,
    height: '50%',
    minWidth: 10,
    margin: 5,
    marginTop: 6,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 1,
    position: 'absolute',
    top: 1,
    overflow: 'hidden',
    aspectRatio: 1.5,
    gap: 4,
  }))JS");
  // React sends `null` for the props that it removes.
  auto updated = evaluate(*_runtime, R"JS(({
    title: null,
    opacity: null,
    backgroundColor: null,
    transform: null,
    zIndex: null,
    pointerEvents: null,
    hitSlop: null,
    testID: null,
    accessible: null,
    accessibilityLabel: null,
    accessibilityState: null,
    borderRadius: null,
    borderColor: null,
    borderWidth: null,
    height: 20,
    margin: null,
    flexDirection: null,
    position: null,
    top: null,
    aspectRatio: null,
  }))JS");

  const auto &defaultProps = *views::NewViewShadowNode::defaultSharedProps();
  auto classicCreated = classicClone(defaultProps, created);
  auto classicUpdated = classicClone(*classicCreated, updated);

  react::RawProps createdRawProps(*_runtime, created);
  auto descriptorCreated = [self cloneProps:nullptr rawProps:&createdRawProps];
  react::RawProps updatedRawProps(*_runtime, updated);
  auto descriptorUpdated = [self cloneProps:descriptorCreated rawProps:&updatedRawProps];

  // A sanity check that the props aren't all defaults.
  XCTAssertEqual(newViewProps(descriptorCreated).opacity, 0.5);
  XCTAssertEqual(newViewProps(descriptorCreated).testId, "test");
  XCTAssertEqual(newViewProps(descriptorUpdated).opacity, 1);

  auto createdDifferences = differentBaseViewProps(*classicCreated, newViewProps(descriptorCreated));
  XCTAssertTrue(createdDifferences.empty(), @"Created props differ: %@", joined(createdDifferences));
  auto updatedDifferences = differentBaseViewProps(*classicUpdated, newViewProps(descriptorUpdated));
  XCTAssertTrue(updatedDifferences.empty(), @"Updated props differ: %@", joined(updatedDifferences));

  // `setProp` resets these two props differently than the classic parser. On `null`, the classic parser
  // keeps the previous `role` (and so the accessibility traits), and sets `width` to an undefined length
  // rather than the `auto` of `yoga::Style()`. So only these may differ.
  auto removed = evaluate(*_runtime, "({ role: null, width: null })");
  auto classicRemoved = classicClone(*classicUpdated, removed);
  react::RawProps removedRawProps(*_runtime, removed);
  auto descriptorRemoved = [self cloneProps:descriptorUpdated rawProps:&removedRawProps];

  const std::vector<std::string> knownDifferences{"accessibilityTraits", "role", "yoga width", "yogaStyle"};
  auto removedDifferences = differentBaseViewProps(*classicRemoved, newViewProps(descriptorRemoved));
  for (const auto &name : removedDifferences) {
    XCTAssertTrue(
      std::find(knownDifferences.begin(), knownDifferences.end(), name) != knownDifferences.end(),
      @"Props with removed role and width differ: %@",
      joined(removedDifferences)
    );
  }
}

@end

#endif // USE_HERMES
