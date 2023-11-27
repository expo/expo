/*
 * Copyright 2023 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkJpegGainmapEncoder_DEFINED
#define SkJpegGainmapEncoder_DEFINED

#include "include/encode/SkJpegEncoder.h"

class SkPixmap;
class SkWStream;
struct SkGainmapInfo;

class SK_API SkJpegGainmapEncoder {
public:
    /**
     *  Encode an UltraHDR image to |dst|.
     *
     *  The base image is specified by |base|, and |baseOptions| controls the encoding behavior for
     *  the base image.
     *
     *  The gainmap image is specified by |gainmap|, and |gainmapOptions| controls the encoding
     *  behavior for the gainmap image.
     *
     *  The rendering behavior of the gainmap image is provided in |gainmapInfo|.
     *
     *  If |baseOptions| or |gainmapOptions| specify XMP metadata, then that metadata will be
     *  overwritten.
     *
     *  Returns true on success.  Returns false on an invalid or unsupported |src|.
     */
    static bool EncodeHDRGM(SkWStream* dst,
                            const SkPixmap& base,
                            const SkJpegEncoder::Options& baseOptions,
                            const SkPixmap& gainmap,
                            const SkJpegEncoder::Options& gainmapOptions,
                            const SkGainmapInfo& gainmapInfo);

    /**
     *  Write a Multi Picture Format containing the |imageCount| images specified by |images|.
     */
    static bool MakeMPF(SkWStream* dst, const SkData** images, size_t imageCount);
};

#endif
