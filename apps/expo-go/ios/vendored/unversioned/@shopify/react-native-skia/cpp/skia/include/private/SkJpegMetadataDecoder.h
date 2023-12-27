/*
 * Copyright 2013 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkJpegMetadataDecoder_DEFINED
#define SkJpegMetadataDecoder_DEFINED

#include "include/core/SkData.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkTypes.h"

#include <memory>
#include <vector>

struct SkGainmapInfo;

/**
 * An interface that can be used to extract metadata from an encoded JPEG file.
 */
class SK_API SkJpegMetadataDecoder {
public:
    SkJpegMetadataDecoder() {}
    virtual ~SkJpegMetadataDecoder() {}

    SkJpegMetadataDecoder(const SkJpegMetadataDecoder&) = delete;
    SkJpegMetadataDecoder& operator=(const SkJpegMetadataDecoder&) = delete;

    /**
     * A segment from a JPEG file. This is usually populated from a jpeg_marker_struct.
     */
    struct SK_API Segment {
        Segment(uint8_t marker, sk_sp<SkData> data) : fMarker(marker), fData(std::move(data)) {}

        // The segment's marker.
        uint8_t fMarker = 0;

        // The segment's parameters (not including the marker and parameter length).
        sk_sp<SkData> fData;
    };

    /**
     * Create metadata for the specified segments from a JPEG file's header (defined as all segments
     * before the first StartOfScan). This may return nullptr.
     */
    static std::unique_ptr<SkJpegMetadataDecoder> Make(std::vector<Segment> headerSegments);

    /**
     * Return the Exif data attached to the image (if any) and nullptr otherwise. If |copyData| is
     * false, then the returned SkData may directly reference the data provided when this object was
     * created.
     */
    virtual sk_sp<SkData> getExifMetadata(bool copyData) const = 0;

    /**
     * Return the ICC profile of the image if any, and nullptr otherwise. If |copyData| is false,
     * then the returned SkData may directly reference the data provided when this object was
     * created.
     */
    virtual sk_sp<SkData> getICCProfileData(bool copyData) const = 0;

    /**
     * Return true if there is a possibility that this image contains a gainmap image.
     */
    virtual bool mightHaveGainmapImage() const = 0;

    /**
     * Given a JPEG encoded image |baseImageData|, return in |outGainmapImageData| the JPEG encoded
     * gainmap image and return in |outGainmapInfo| its gainmap rendering parameters. Return true if
     * both output variables were successfully populated, otherwise return false.
     */
    virtual bool findGainmapImage(sk_sp<SkData> baseImageData,
                                  sk_sp<SkData>& outGainmapImagedata,
                                  SkGainmapInfo& outGainmapInfo) = 0;
};

#endif
