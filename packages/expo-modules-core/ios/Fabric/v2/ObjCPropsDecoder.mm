// Copyright 2026-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/ObjCPropsDecoder.h>

#include <atomic>
#include <exception>

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>

namespace jsi = facebook::jsi;

namespace expo::views {

namespace {
// Reanimated sends the same props again at each React commit, so a failed conversion can repeat often.
std::atomic<bool> reportedConversionFailure{false};
} // namespace

ObjCPropsDecoder::ObjCPropsDecoder(id<EXViewPropsDecoding> decoder) : makeDecoder_(^{ return decoder; }) {}

ObjCPropsDecoder::ObjCPropsDecoder(MakeObjCPropsDecoder makeDecoder) : makeDecoder_(makeDecoder) {}

id<EXViewPropsDecoding> ObjCPropsDecoder::objcDecoder() const {
  std::call_once(decoderOnce_, [this] {
    decoder_ = makeDecoder_();
    makeDecoder_ = nil;
  });
  return decoder_;
}

DecodedProps ObjCPropsDecoder::decode(
  jsi::Runtime &runtime,
  const jsi::Value &props,
  const DecodedProps &previous
) const {
  const void *decoded = [objcDecoder() decodeProps:&props runtime:&runtime previous:previous.get()];
  return decoded != nullptr ? DecodedProps::adopt(decoded) : previous;
}

std::vector<std::string> ObjCPropsDecoder::propNames() const {
  NSArray<NSString *> *names = objcDecoder().propNames;
  std::vector<std::string> propNames;
  propNames.reserve(names.count);
  for (NSString *name in names) {
    propNames.emplace_back(name.UTF8String);
  }
  return propNames;
}

DecodedProps ObjCPropsDecoder::decodeValues(
  jsi::Runtime &runtime,
  const std::vector<std::pair<size_t, jsi::Value>> &values,
  const DecodedProps &previous
) const {
  std::vector<const void *> valuePointers;
  std::vector<NSInteger> indexes;
  valuePointers.reserve(values.size());
  indexes.reserve(values.size());
  for (const auto &[index, value] : values) {
    valuePointers.push_back(&value);
    indexes.push_back(static_cast<NSInteger>(index));
  }
  const void *decoded = [objcDecoder() decodeValues:valuePointers.data()
                                       indexes:indexes.data()
                                         count:static_cast<NSInteger>(values.size())
                                       runtime:&runtime
                                      previous:previous.get()];
  return decoded != nullptr ? DecodedProps::adopt(decoded) : previous;
}

DecodedProps ObjCPropsDecoder::decodeDynamicValues(
  const std::vector<std::pair<size_t, const folly::dynamic *>> &values,
  const DecodedProps &previous
) const {
  DecodedProps decoded = previous;
  // A block captures C++ objects by copy, so it gets pointers to the ones that live during this call.
  DecodedProps *decodedPointer = &decoded;
  const DecodedProps *previousPointer = &previous;
  const auto *valuesPointer = &values;
  const auto *decoder = this;

  const BOOL hasRuntime = [objcDecoder() withRuntimeForCurrentThread:^(const void *runtimePointer) {
    auto &runtime = *static_cast<jsi::Runtime *>(const_cast<void *>(runtimePointer));
    // A C++ exception must not leave the block, which Swift calls. The JSI values are destroyed in the block,
    // where the runtime is safe to use.
    try {
      std::vector<std::pair<size_t, jsi::Value>> jsiValues;
      jsiValues.reserve(valuesPointer->size());
      for (const auto &[index, value] : *valuesPointer) {
        jsiValues.emplace_back(index, jsi::valueFromDynamic(runtime, *value));
      }
      *decodedPointer = decoder->decodeValues(runtime, jsiValues, *previousPointer);
    } catch (const std::exception &error) {
      if (!reportedConversionFailure.exchange(true)) {
        NSLog(
          @"[ExpoModulesCore] The props of a view that came from outside React, for example from Reanimated, weren't applied: converting them from folly::dynamic to JavaScript values failed (error: %s). The view keeps its previous props. Expo logs this only once. If such props keep not applying, report it to Expo with the props that the view received.",
          error.what()
        );
      }
    }
  }];

  if (!hasRuntime) {
    NSArray<NSString *> *allNames = objcDecoder().propNames;
    NSMutableArray<NSString *> *names = [NSMutableArray arrayWithCapacity:values.size()];
    for (const auto &[index, value] : values) {
      [names addObject:allNames[index]];
    }
    [objcDecoder() didSkipProps:names];
  }
  return decoded;
}

} // namespace expo::views
