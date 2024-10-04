/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <benchmark/benchmark.h>
#include <folly/dynamic.h>
#include <folly/json.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewComponentDescriptor.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventDispatcher.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0RawProps.h>
#include <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>
#include <exception>
#include <string>

namespace ABI49_0_0facebook::ABI49_0_0React {

auto contextContainer = std::make_shared<ContextContainer const>();
auto eventDispatcher = std::shared_ptr<EventDispatcher>{nullptr};
auto viewComponentDescriptor = ViewComponentDescriptor{
    ComponentDescriptorParameters{eventDispatcher, contextContainer}};

auto emptyPropsDynamic = folly::parseJson("{}");
auto propsString = std::string{
    R"({"flex": 1, "padding": 10, "position": "absolute", "display": "none", "nativeID": "some-id", "direction": "rtl"})"};
auto propsDynamic = folly::parseJson(propsString);
auto propsStringWithSomeUnsupportedProps = std::string{
    R"({"someName1": 1, "someName2": 10, "someName3": "absolute", "someName4": "none", "someName5": "some-id", "someName6": "rtl"})"};
auto unsupportedPropsDynamic =
    folly::parseJson(propsStringWithSomeUnsupportedProps);

auto sourceProps = ViewProps{};
auto sharedSourceProps = ViewShadowNode::defaultSharedProps();

static void emptyPropCreation(benchmark::State &state) {
  for (auto _ : state) {
    ViewProps{};
  }
}
BENCHMARK(emptyPropCreation);

static void propParsingEmptyRawProps(benchmark::State &state) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};
  for (auto _ : state) {
    viewComponentDescriptor.cloneProps(
        parserContext, sharedSourceProps, RawProps{emptyPropsDynamic});
  }
}
BENCHMARK(propParsingEmptyRawProps);

static void propParsingRegularRawProps(benchmark::State &state) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};
  for (auto _ : state) {
    viewComponentDescriptor.cloneProps(
        parserContext, sharedSourceProps, RawProps{propsDynamic});
  }
}
BENCHMARK(propParsingRegularRawProps);

static void propParsingUnsupportedRawProps(benchmark::State &state) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};
  for (auto _ : state) {
    viewComponentDescriptor.cloneProps(
        parserContext, sharedSourceProps, RawProps{unsupportedPropsDynamic});
  }
}
BENCHMARK(propParsingUnsupportedRawProps);

static void propParsingRegularRawPropsWithNoSourceProps(
    benchmark::State &state) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};
  for (auto _ : state) {
    viewComponentDescriptor.cloneProps(
        parserContext, nullptr, RawProps{propsDynamic});
  }
}
BENCHMARK(propParsingRegularRawPropsWithNoSourceProps);

} // namespace ABI49_0_0facebook::ABI49_0_0React

BENCHMARK_MAIN();
