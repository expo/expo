/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#ifndef SkPngDecoder_DEFINED
#define SkPngDecoder_DEFINED

#include "include/codec/SkCodec.h"
#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

class SkData;
class SkStream;

#include <memory>

namespace SkPngDecoder {

/** Returns true if this data claims to be a PNG image. */
SK_API bool IsPng(const void*, size_t);

/**
 *  Attempts to decode the given bytes as a PNG.
 *
 *  If the bytes are not a PNG, returns nullptr.
 *
 *  DecodeContext, if non-null, is expected to be a SkPngChunkReader*
 */
SK_API std::unique_ptr<SkCodec> Decode(std::unique_ptr<SkStream>,
                                       SkCodec::Result*,
                                       SkCodecs::DecodeContext = nullptr);
SK_API std::unique_ptr<SkCodec> Decode(sk_sp<SkData>,
                                       SkCodec::Result*,
                                       SkCodecs::DecodeContext = nullptr);

inline SkCodecs::Decoder Decoder() {
    return { "png", IsPng, Decode };
}

}  // namespace SkPngDecoder

#endif  // SkPngDecoder_DEFINED
