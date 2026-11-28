// Copyright 2026-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

// The tests parse props from a Hermes runtime, which a build without Hermes doesn't have.
#ifdef USE_HERMES

#import <ExpoModulesCore/ExpoViewComponentDescriptor.h>

#include <memory>
#include <string>

#include <hermes/hermes.h>
#include <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawPropsParser.h>
#include <react/utils/ContextContainer.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;
namespace yoga = facebook::yoga;

@interface ExpoViewComponentDescriptorTests : XCTestCase
@end

@implementation ExpoViewComponentDescriptorTests {
  std::unique_ptr<jsi::Runtime> _runtime;
  std::shared_ptr<react::ContextContainer> _contextContainer;
}

- (void)setUp
{
  _runtime = facebook::hermes::makeHermesRuntime();
  _contextContainer = std::make_shared<react::ContextContainer>();
}

- (void)tearDown
{
  // Release the runtime after each test rather than when XCTest deallocates the test case.
  _runtime.reset();
}

- (react::RawProps)rawPropsFrom:(const char *)source
{
  return react::RawProps(*_runtime, _runtime->evaluateJavaScript(std::make_shared<jsi::StringBuffer>(source), "test"));
}

- (void)testDescriptorsParseTheBaseViewPropsLikeTheParserOfViewProps
{
  // The descriptors of the views of Expo Modules v1 copy one prepared parser (`ExpoViewProps.h`). Their props
  // must be the same as the props that a parser prepared for the base view props parses.
  const char *source = "({ opacity: 0.5, testID: 'test', marginTop: 12, backgroundColor: 0xff336699 })";
  react::PropsParserContext context{-1, *_contextContainer};

  react::RawPropsParser parser;
  parser.prepare<react::ViewProps>();
  auto expectedRawProps = [self rawPropsFrom:source];
  expectedRawProps.parse(parser);
  const react::ViewProps expected(context, react::ViewProps(), expectedRawProps);

  for (const char *name : {"expo-test/FirstView", "expo-test/SecondView"}) {
    auto flavor = std::make_shared<const std::string>(name);
    auto descriptor = react::concreteComponentDescriptorConstructor<expo::ExpoViewComponentDescriptor<>>(
      react::ComponentDescriptorParameters{.eventDispatcher = {}, .contextContainer = _contextContainer, .flavor = flavor}
    );
    auto props = descriptor->cloneProps(context, nullptr, [self rawPropsFrom:source]);
    const auto &viewProps = static_cast<const expo::ExpoViewProps &>(*props);

    XCTAssertEqual(viewProps.opacity, expected.opacity, @"%s", name);
    XCTAssertEqual(viewProps.testId, expected.testId, @"%s", name);
    XCTAssertEqual(viewProps.backgroundColor, expected.backgroundColor, @"%s", name);
    XCTAssertTrue(viewProps.yogaStyle.margin(yoga::Edge::Top) == expected.yogaStyle.margin(yoga::Edge::Top), @"%s", name);
    XCTAssertEqual(viewProps.opacity, 0.5, @"%s", name);
    XCTAssertEqual(viewProps.testId, "test", @"%s", name);
  }
}

@end

#endif // USE_HERMES
