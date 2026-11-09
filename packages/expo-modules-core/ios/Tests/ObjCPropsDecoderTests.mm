// Copyright 2026-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

// The tests make a Hermes runtime, which a build without Hermes doesn't have.
#ifdef USE_HERMES
#import <ExpoModulesCore/ObjCPropsDecoder.h>

#include <memory>
#include <string_view>
#include <vector>

#include <hermes/hermes.h>

namespace jsi = facebook::jsi;
namespace views = expo::views;

/**
 Records the calls, and returns `nil` when `returnsNil` is set, `previous` when `returnsPrevious` is set,
 or a new object otherwise.
 */
@interface RecordingViewPropsDecoder : NSObject <EXViewPropsDecoding>
@property (nonatomic) BOOL returnsPrevious;
@property (nonatomic) BOOL returnsNil;
@property (nonatomic) const void *lastProps;
@property (nonatomic) const void *lastRuntime;
@property (nonatomic, nullable) id lastPrevious;
@property (nonatomic, nullable) NSArray<NSString *> *skippedPropNames;
@end

@implementation RecordingViewPropsDecoder

- (nullable id)decodeProps:(const void *)props runtime:(const void *)runtime previous:(nullable id)previous
{
  self.lastProps = props;
  self.lastRuntime = runtime;
  self.lastPrevious = previous;
  if (self.returnsNil) {
    return nil;
  }
  return self.returnsPrevious ? previous : [NSObject new];
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
