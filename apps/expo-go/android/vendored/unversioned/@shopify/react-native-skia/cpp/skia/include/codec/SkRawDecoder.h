/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#ifndef SkRawDecoder_DEFINED
#define SkRawDecoder_DEFINED

#include "include/codec/SkCodec.h"
#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

class SkData;
class SkStream;

#include <memory>

namespace SkRawDecoder {

inline bool IsRaw(const void*, size_t) {
    // Raw formats are tricky to detect just by reading in the first several bytes.
    // For example, PIEX might need to read 10k bytes to detect Sony's arw format
    // https://github.com/google/piex/blob/f1e15dd837c04347504149f71db67a78fbeddc73/src/image_type_recognition/image_type_recognition_lite.cc#L152
    // Thus, we just assume everything might be a RAW file and check it last.
    return true;
}

/**
 *  Attempts to decode the given bytes as a raw image.
 *
 *  If the bytes are not a raw, returns nullptr.
 *
 *  DecodeContext is ignored
 */
SK_API std::unique_ptr<SkCodec> Decode(std::unique_ptr<SkStream>,
                                       SkCodec::Result*,
                                       SkCodecs::DecodeContext = nullptr);
SK_API std::unique_ptr<SkCodec> Decode(sk_sp<SkData>,
                                       SkCodec::Result*,
                                       SkCodecs::DecodeContext = nullptr);

// This decoder will always be checked last, no matter when it is registered.
inline SkCodecs::Decoder Decoder() {
    return { "raw", IsRaw, Decode };
}

}  // namespace SkRawDecoder

#endif  // SkRawDecoder_DEFINED
