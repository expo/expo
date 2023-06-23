/*
 * Copyright 2017 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkWebpEncoder_DEFINED
#define SkWebpEncoder_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkSpan.h" // IWYU pragma: keep
#include "include/encode/SkEncoder.h"
#include "include/private/base/SkAPI.h"

class SkPixmap;
class SkWStream;
class SkData;
class GrDirectContext;
class SkImage;
struct skcms_ICCProfile;

namespace SkWebpEncoder {

enum class Compression {
    kLossy,
    kLossless,
};

struct SK_API Options {
    /**
     *  |fCompression| determines whether we will use webp lossy or lossless compression.
     *
     *  |fQuality| must be in [0.0f, 100.0f].
     *  If |fCompression| is kLossy, |fQuality| corresponds to the visual quality of the
     *  encoding.  Decreasing the quality will result in a smaller encoded image.
     *  If |fCompression| is kLossless, |fQuality| corresponds to the amount of effort
     *  put into the encoding.  Lower values will compress faster into larger files,
     *  while larger values will compress slower into smaller files.
     *
     *  This scheme is designed to match the libwebp API.
     */
    Compression fCompression = Compression::kLossy;
    float fQuality = 100.0f;

    /**
     * An optional ICC profile to override the default behavior.
     *
     * The default behavior is to generate an ICC profile using a primary matrix and
     * analytic transfer function. If the color space of |src| cannot be represented
     * in this way (e.g, it is HLG or PQ), then no profile will be embedded.
     */
    const skcms_ICCProfile* fICCProfile = nullptr;
    const char* fICCProfileDescription = nullptr;
};

/**
 *  Encode the |src| pixels to the |dst| stream.
 *  |options| may be used to control the encoding behavior.
 *
 *  Returns true on success.  Returns false on an invalid or unsupported |src|.
 */
SK_API bool Encode(SkWStream* dst, const SkPixmap& src, const Options& options);

/**
*  Encode the provided image and return the resulting bytes. If the image was created as
*  a texture-backed image on a GPU context, that |ctx| must be provided so the pixels
*  can be read before being encoded. For raster-backed images, |ctx| can be nullptr.
*  |options| may be used to control the encoding behavior.
*
*  Returns nullptr if the pixels could not be read or encoding otherwise fails.
*/
SK_API sk_sp<SkData> Encode(GrDirectContext* ctx, const SkImage* img, const Options& options);

/**
 *  Encode the |src| frames to the |dst| stream.
 *  |options| may be used to control the encoding behavior.
 *
 *  The size of the first frame will be used as the canvas size. If any other frame does
 *  not match the canvas size, this is an error.
 *
 *  Returns true on success.  Returns false on an invalid or unsupported |src|.
 *
 *  Note: libwebp API also supports set background color, loop limit and customize
 *  lossy/lossless for each frame. These could be added later as needed.
 */
SK_API bool EncodeAnimated(SkWStream* dst,
                           SkSpan<const SkEncoder::Frame> src,
                           const Options& options);
} // namespace SkWebpEncoder

#endif
