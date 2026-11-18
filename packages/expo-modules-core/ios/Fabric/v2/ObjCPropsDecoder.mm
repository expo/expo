// Copyright 2026-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/ObjCPropsDecoder.h>

namespace jsi = facebook::jsi;

namespace expo::views {

ObjCPropsDecoder::ObjCPropsDecoder(id<EXViewPropsDecoding> decoder) : decoder_(decoder) {}

DecodedProps ObjCPropsDecoder::decode(
  jsi::Runtime &runtime,
  const jsi::Value &props,
  const DecodedProps &previous
) const {
  const void *decoded = [decoder_ decodeProps:&props runtime:&runtime previous:previous.get()];
  return decoded != nullptr ? DecodedProps::adopt(decoded) : previous;
}

std::vector<std::string> ObjCPropsDecoder::propNames() const {
  NSArray<NSString *> *names = decoder_.propNames;
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
  const void *decoded = [decoder_ decodeValues:valuePointers.data()
                                       indexes:indexes.data()
                                         count:static_cast<NSInteger>(values.size())
                                       runtime:&runtime
                                      previous:previous.get()];
  return decoded != nullptr ? DecodedProps::adopt(decoded) : previous;
}

void ObjCPropsDecoder::didSkipProps(const std::vector<std::string_view> &propNames) const {
  NSMutableArray<NSString *> *names = [NSMutableArray arrayWithCapacity:propNames.size()];
  for (const auto &name : propNames) {
    // `nil` when the name isn't valid UTF-8.
    NSString *nameString = [[NSString alloc] initWithBytes:name.data()
                                                     length:name.size()
                                                   encoding:NSUTF8StringEncoding];
    if (nameString != nil) {
      [names addObject:nameString];
    }
  }
  [decoder_ didSkipProps:names];
}

} // namespace expo::views
