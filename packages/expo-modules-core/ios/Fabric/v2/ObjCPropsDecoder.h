// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#if defined(__cplusplus) && defined(__OBJC__)

#import <ExpoModulesCore/EXViewPropsDecoding.h>

#include <mutex>

#include "NewPropsDecoder.h"

namespace expo::views {

/**
 Creates the Objective-C decoder of a view type. Called once, on any thread.
 */
using MakeObjCPropsDecoder = id<EXViewPropsDecoding> _Nonnull (^)(void);

/**
 A `NewPropsDecoder` that decodes through an Objective-C object, which Swift's `ViewPropsDecoderAdapter`
 provides. The decoded props are the object that it returns.
 */
class ObjCPropsDecoder final : public NewPropsDecoder {
public:
  explicit ObjCPropsDecoder(id<EXViewPropsDecoding> _Nonnull decoder);

  /**
   Creates the Objective-C decoder with `makeDecoder` when the props of the view type are first decoded, so
   registering a view type that the app doesn't render doesn't create its decoder.
   */
  explicit ObjCPropsDecoder(MakeObjCPropsDecoder _Nonnull makeDecoder);

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

  DecodedProps decodeDynamicValues(
    const std::vector<std::pair<size_t, const folly::dynamic *>> &values,
    const DecodedProps &previous
  ) const override;

private:
  id<EXViewPropsDecoding> _Nonnull objcDecoder() const;

  mutable std::once_flag decoderOnce_;
  mutable MakeObjCPropsDecoder _Nullable makeDecoder_;
  mutable id<EXViewPropsDecoding> _Nullable decoder_;
};

} // namespace expo::views

#endif // defined(__cplusplus) && defined(__OBJC__)
