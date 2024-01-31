/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#ifndef SkGifDecoder_DEFINED
#define SkGifDecoder_DEFINED

#include "include/codec/SkCodec.h"
#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

class SkData;
class SkStream;

#include <memory>

namespace SkGifDecoder {

/** Returns true if this data claims to be a GIF image. */
SK_API bool IsGif(const void*, size_t);

/**
 *  Attempts to decode the given bytes as a GIF.
 *
 *  If the bytes are not a GIF, returns nullptr.
 *
 *  DecodeContext is ignored
 */
SK_API std::unique_ptr<SkCodec> Decode(std::unique_ptr<SkStream>,
                                       SkCodec::Result*,
                                       SkCodecs::DecodeContext = nullptr);
SK_API std::unique_ptr<SkCodec> Decode(sk_sp<SkData>,
                                       SkCodec::Result*,
                                       SkCodecs::DecodeContext = nullptr);

inline SkCodecs::Decoder Decoder() {
    return { "gif", IsGif, Decode };
}

}  // namespace SkGifDecoder

#endif  // SkGifDecoder_DEFINED
