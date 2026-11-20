// Copyright 2026-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

// The tests make a Hermes runtime, which a build without Hermes doesn't have.
#ifdef USE_HERMES
#import <ExpoModulesCore/ObjCPropsDecoder.h>

#include <memory>
#include <string>
#include <string_view>
#include <vector>

#include <hermes/hermes.h>

namespace jsi = facebook::jsi;
namespace views = expo::views;

/**
 Records the calls, and returns `NULL` when `returnsNil` is set, `previous` (retained) when
 `returnsPrevious` is set, or a new retained object otherwise.
 */
@interface RecordingViewPropsDecoder : NSObject <EXViewPropsDecoding>
@property (nonatomic) BOOL returnsPrevious;
@property (nonatomic) BOOL returnsNil;
@property (nonatomic) const void *lastProps;
@property (nonatomic) const void *lastRuntime;
@property (nonatomic, nullable) id lastPrevious;
@property (nonatomic, nullable) NSArray<NSString *> *skippedPropNames;
@property (nonatomic, nullable) NSArray<NSNumber *> *lastIndexes;
@property (nonatomic) std::vector<const void *> lastValues;
@end

@implementation RecordingViewPropsDecoder

- (nullable const void *)decodeProps:(const void *)props
                             runtime:(const void *)runtime
                            previous:(nullable const void *)previous
{
  self.lastProps = props;
  self.lastRuntime = runtime;
  self.lastPrevious = (__bridge id)previous;
  return [self resultWithPrevious:previous];
}

- (nullable const void *)resultWithPrevious:(nullable const void *)previous
{
  if (self.returnsNil) {
    return nullptr;
  }
  id result = self.returnsPrevious ? (__bridge id)previous : [NSObject new];
  return (__bridge_retained const void *)result;
}

- (NSArray<NSString *> *)propNames
{
  return @[ @"title", @"radius" ];
}

- (nullable const void *)decodeValues:(const void *const _Nonnull *)values
                              indexes:(const NSInteger *)indexes
                                count:(NSInteger)count
                              runtime:(const void *)runtime
                             previous:(nullable const void *)previous
{
  NSMutableArray<NSNumber *> *recordedIndexes = [NSMutableArray array];
  std::vector<const void *> recordedValues;
  for (NSInteger i = 0; i < count; i++) {
    [recordedIndexes addObject:@(indexes[i])];
    recordedValues.push_back(values[i]);
  }
  self.lastIndexes = recordedIndexes;
  self.lastValues = recordedValues;
  self.lastRuntime = runtime;
  self.lastPrevious = (__bridge id)previous;
  return [self resultWithPrevious:previous];
}

- (void)didSkipProps:(NSArray<NSString *> *)propNames
{
  self.skippedPropNames = propNames;
}

@end

@interface ObjCPropsDecoderTests : XCTestCase
@end

@implementation ObjCPropsDecoderTests {
  std::unique_ptr<jsi::Runtime> _runtime;
  RecordingViewPropsDecoder *_objcDecoder;
  std::unique_ptr<views::ObjCPropsDecoder> _decoder;
}

- (void)setUp
{
  _runtime = facebook::hermes::makeHermesRuntime();
  _objcDecoder = [RecordingViewPropsDecoder new];
  _decoder = std::make_unique<views::ObjCPropsDecoder>(_objcDecoder);
}

- (void)tearDown
{
  _decoder.reset();
  _runtime.reset();
}

- (void)testPassesThePropsTheRuntimeAndThePreviousProps
{
  jsi::Value props = jsi::Object(*_runtime);
  auto created = _decoder->decode(*_runtime, props, nullptr);
  auto updated = _decoder->decode(*_runtime, props, created);

  XCTAssertEqual(_objcDecoder.lastProps, static_cast<const void *>(&props));
  XCTAssertEqual(_objcDecoder.lastRuntime, static_cast<const void *>(_runtime.get()));
  XCTAssertEqual(_objcDecoder.lastPrevious, (__bridge id)created.get());
  XCTAssertFalse(updated == created);
}

- (void)testKeepsTheDecodedObjectAlive
{
  jsi::Value props = jsi::Object(*_runtime);
  __weak id weakDecoded;
  views::DecodedProps decoded;
  @autoreleasepool {
    decoded = _decoder->decode(*_runtime, props, nullptr);
    weakDecoded = (__bridge id)decoded.get();
  }
  XCTAssertNotNil(weakDecoded);

  decoded = nullptr;
  XCTAssertNil(weakDecoded);
}

- (void)testReturnsThePreviousPropsWhenNothingChanged
{
  jsi::Value props = jsi::Object(*_runtime);
  auto created = _decoder->decode(*_runtime, props, nullptr);
  _objcDecoder.returnsPrevious = YES;
  auto updated = _decoder->decode(*_runtime, props, created);

  XCTAssertTrue(updated == created);
}

- (void)testKeepsThePreviousPropsWhenTheDecoderReturnsNil
{
  jsi::Value props = jsi::Object(*_runtime);
  _objcDecoder.returnsNil = YES;
  auto created = _decoder->decode(*_runtime, props, nullptr);
  XCTAssertTrue(created == nullptr);

  _objcDecoder.returnsNil = NO;
  created = _decoder->decode(*_runtime, props, nullptr);
  _objcDecoder.returnsNil = YES;
  auto updated = _decoder->decode(*_runtime, props, created);
  XCTAssertTrue(updated == created);
}

- (void)testReturnsThePropNamesOfTheDecoder
{
  XCTAssertTrue((_decoder->propNames() == std::vector<std::string>{"title", "radius"}));
}

- (void)testPassesTheValuesWithTheirIndexes
{
  std::vector<std::pair<size_t, jsi::Value>> values;
  values.emplace_back(1, jsi::Value(8));
  values.emplace_back(0, jsi::String::createFromUtf8(*_runtime, "Title"));
  auto created = _decoder->decodeValues(*_runtime, values, nullptr);
  auto updated = _decoder->decodeValues(*_runtime, values, created);

  XCTAssertEqualObjects(_objcDecoder.lastIndexes, (@[ @1, @0 ]));
  XCTAssertEqual(_objcDecoder.lastValues.size(), 2u);
  XCTAssertEqual(_objcDecoder.lastValues[0], static_cast<const void *>(&values[0].second));
  XCTAssertEqual(_objcDecoder.lastValues[1], static_cast<const void *>(&values[1].second));
  XCTAssertEqual(_objcDecoder.lastRuntime, static_cast<const void *>(_runtime.get()));
  XCTAssertEqual(_objcDecoder.lastPrevious, (__bridge id)created.get());
  XCTAssertFalse(updated == created);

  _objcDecoder.returnsPrevious = YES;
  XCTAssertTrue(_decoder->decodeValues(*_runtime, values, updated) == updated);
  _objcDecoder.returnsPrevious = NO;
  _objcDecoder.returnsNil = YES;
  XCTAssertTrue(_decoder->decodeValues(*_runtime, values, updated) == updated);
}

- (void)testPassesTheSkippedPropNames
{
  _decoder->didSkipProps(std::vector<std::string_view>{"title", "opacity"});

  XCTAssertEqualObjects(_objcDecoder.skippedPropNames, (@[ @"title", @"opacity" ]));
}

- (void)testLeavesOutSkippedPropNamesThatArentUTF8
{
  _decoder->didSkipProps(std::vector<std::string_view>{"title", "\xff", "opacity"});

  XCTAssertEqualObjects(_objcDecoder.skippedPropNames, (@[ @"title", @"opacity" ]));
}

@end

#endif // USE_HERMES
