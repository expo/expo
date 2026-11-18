// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#if defined(__cplusplus) && defined(__OBJC__)

#import <ExpoModulesCore/EXViewPropsDecoding.h>

#include "NewPropsDecoder.h"

namespace expo::views {

/**
 A `NewPropsDecoder` that decodes through an Objective-C object, which Swift's `ViewPropsDecoderAdapter`
 provides. The decoded props are the object that it returns.
 */
class ObjCPropsDecoder final : public NewPropsDecoder {
public:
  explicit ObjCPropsDecoder(id<EXViewPropsDecoding> decoder);

  DecodedProps decode(
    facebook::jsi::Runtime &runtime,
    const facebook::jsi::Value &props,
    const DecodedProps &previous
  ) const override;

  std::vector<std::string> propNames() const override;

  DecodedProps decodeValues(
    facebook::jsi::Runtime &runtime,
    const std::vector<std::pair<size_t, facebook::jsi::Value>> &values,
    const DecodedProps &previous
  ) const override;

  void didSkipProps(const std::vector<std::string_view> &propNames) const override;

private:
  id<EXViewPropsDecoding> decoder_;
};

} // namespace expo::views

#endif // defined(__cplusplus) && defined(__OBJC__)
