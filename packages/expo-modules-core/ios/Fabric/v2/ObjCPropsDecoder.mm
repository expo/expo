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
  id previousObject = (__bridge id)previous.get();
  id decoded = [decoder_ decodeProps:&props runtime:&runtime previous:previousObject];

  if (decoded == previousObject || decoded == nil) {
    return previous;
  }
  return DecodedProps::adopt((__bridge_retained CFTypeRef)decoded);
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
