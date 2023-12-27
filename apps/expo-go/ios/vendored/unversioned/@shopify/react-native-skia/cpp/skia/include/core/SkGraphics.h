/*
 * Copyright 2006 The Android Open Source Project
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkGraphics_DEFINED
#define SkGraphics_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

#include <cstddef>
#include <cstdint>
#include <memory>

class SkData;
class SkImageGenerator;
class SkOpenTypeSVGDecoder;
class SkTraceMemoryDump;

class SK_API SkGraphics {
public:
    /**
     *  Call this at process initialization time if your environment does not
     *  permit static global initializers that execute code.
     *  Init() is thread-safe and idempotent.
     */
    static void Init();

    /**
     *  Return the max number of bytes that should be used by the font cache.
     *  If the cache needs to allocate more, it will purge previous entries.
     *  This max can be changed by calling SetFontCacheLimit().
     */
    static size_t GetFontCacheLimit();

    /**
     *  Specify the max number of bytes that should be used by the font cache.
     *  If the cache needs to allocate more, it will purge previous entries.
     *
     *  This function returns the previous setting, as if GetFontCacheLimit()
     *  had be called before the new limit was set.
     */
    static size_t SetFontCacheLimit(size_t bytes);

    /**
     *  Return the number of bytes currently used by the font cache.
     */
    static size_t GetFontCacheUsed();

    /**
     *  Return the number of entries in the font cache.
     *  A cache "entry" is associated with each typeface + pointSize + matrix.
     */
    static int GetFontCacheCountUsed();

    /**
     *  Return the current limit to the number of entries in the font cache.
     *  A cache "entry" is associated with each typeface + pointSize + matrix.
     */
    static int GetFontCacheCountLimit();

    /**
     *  Set the limit to the number of entries in the font cache, and return
     *  the previous value. If this new value is lower than the previous,
     *  it will automatically try to purge entries to meet the new limit.
     */
    static int SetFontCacheCountLimit(int count);

    /**
     *  For debugging purposes, this will attempt to purge the font cache. It
     *  does not change the limit, but will cause subsequent font measures and
     *  draws to be recreated, since they will no longer be in the cache.
     */
    static void PurgeFontCache();

    /**
     *  If the strike cache is above the cache limit, attempt to purge strikes
     *  with pinners. This should be called after clients release locks on
     *  pinned strikes.
     */
    static void PurgePinnedFontCache();

    /**
     *  This function returns the memory used for temporary images and other resources.
     */
    static size_t GetResourceCacheTotalBytesUsed();

    /**
     *  These functions get/set the memory usage limit for the resource cache, used for temporary
     *  bitmaps and other resources. Entries are purged from the cache when the memory useage
     *  exceeds this limit.
     */
    static size_t GetResourceCacheTotalByteLimit();
    static size_t SetResourceCacheTotalByteLimit(size_t newLimit);

    /**
     *  For debugging purposes, this will attempt to purge the resource cache. It
     *  does not change the limit.
     */
    static void PurgeResourceCache();

    /**
     *  When the cachable entry is very lage (e.g. a large scaled bitmap), adding it to the cache
     *  can cause most/all of the existing entries to be purged. To avoid the, the client can set
     *  a limit for a single allocation. If a cacheable entry would have been cached, but its size
     *  exceeds this limit, then we do not attempt to cache it at all.
     *
     *  Zero is the default value, meaning we always attempt to cache entries.
     */
    static size_t GetResourceCacheSingleAllocationByteLimit();
    static size_t SetResourceCacheSingleAllocationByteLimit(size_t newLimit);

    /**
     *  Dumps memory usage of caches using the SkTraceMemoryDump interface. See SkTraceMemoryDump
     *  for usage of this method.
     */
    static void DumpMemoryStatistics(SkTraceMemoryDump* dump);

    /**
     *  Free as much globally cached memory as possible. This will purge all private caches in Skia,
     *  including font and image caches.
     *
     *  If there are caches associated with GPU context, those will not be affected by this call.
     */
    static void PurgeAllCaches();

    typedef std::unique_ptr<SkImageGenerator>
                                            (*ImageGeneratorFromEncodedDataFactory)(sk_sp<SkData>);

    /**
     *  To instantiate images from encoded data, first looks at this runtime function-ptr. If it
     *  exists, it is called to create an SkImageGenerator from SkData. If there is no function-ptr
     *  or there is, but it returns NULL, then skia will call its internal default implementation.
     *
     *  Returns the previous factory (which could be NULL).
     */
    static ImageGeneratorFromEncodedDataFactory
                    SetImageGeneratorFromEncodedDataFactory(ImageGeneratorFromEncodedDataFactory);

    /**
     *  To draw OpenType SVG data, Skia will look at this runtime function pointer. If this function
     *  pointer is set, the SkTypeface implementations which support OpenType SVG will call this
     *  function to create an SkOpenTypeSVGDecoder to decode the OpenType SVG and draw it as needed.
     *  If this function is not set, the SkTypeface implementations will generally not support
     *  OpenType SVG and attempt to use other glyph representations if available.
     */
    using OpenTypeSVGDecoderFactory =
            std::unique_ptr<SkOpenTypeSVGDecoder> (*)(const uint8_t* svg, size_t length);
    static OpenTypeSVGDecoderFactory SetOpenTypeSVGDecoderFactory(OpenTypeSVGDecoderFactory);
    static OpenTypeSVGDecoderFactory GetOpenTypeSVGDecoderFactory();
};

#endif
