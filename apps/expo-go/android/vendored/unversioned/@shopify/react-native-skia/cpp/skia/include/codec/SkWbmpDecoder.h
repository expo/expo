/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#ifndef SkWbmpDecoder_DEFINED
#define SkWbmpDecoder_DEFINED

#include "include/codec/SkCodec.h"
#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

class SkData;
class SkStream;

#include <memory>

namespace SkWbmpDecoder {

/** Returns true if this data claims to be a WBMP image. */
SK_API bool IsWbmp(const void*, size_t);

/**
 *  Attempts to decode the given bytes as a WBMP.
 *
 *  If the bytes are not a WBMP, returns nullptr.
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
    return { "wbmp", IsWbmp, Decode };
}

}  // namespace SkWbmpDecoder

#endif  // SkWbmpDecoder_DEFINED
