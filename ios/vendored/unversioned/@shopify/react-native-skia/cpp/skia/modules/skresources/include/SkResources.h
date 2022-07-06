/*
 * Copyright 2019 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkResources_DEFINED
#define SkResources_DEFINED

#include "include/core/SkData.h"
#include "include/core/SkMatrix.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkSamplingOptions.h"
#include "include/core/SkString.h"
#include "include/core/SkTypeface.h"
#include "include/core/SkTypes.h"
#include "include/private/SkMutex.h"
#include "include/private/SkTHash.h"

#include <memory>

class SkAnimCodecPlayer;
class SkImage;

namespace skresources {

/**
 * Image asset proxy interface.
 */
class SK_API ImageAsset : public SkRefCnt {
public:
    /**
     * Returns true if the image asset is animated.
     */
    virtual bool isMultiFrame() = 0;

    /**
     * DEPRECATED: override getFrameData() instead.
     *
     * Returns the SkImage for a given frame.
     *
     * If the image asset is static, getFrame() is only called once, at animation load time.
     * Otherwise, this gets invoked every time the animation time is adjusted (on every seek).
     *
     * Embedders should cache and serve the same SkImage whenever possible, for efficiency.
     *
     * @param t   Frame time code, in seconds, relative to the image layer timeline origin
     *            (in-point).
     */
    virtual sk_sp<SkImage> getFrame(float t);

    struct FrameData {
        // SkImage payload.
        sk_sp<SkImage>    image;
        // Resampling parameters.
        SkSamplingOptions sampling;
        // Additional image transform to be applied before AE scaling rules.
        SkMatrix          matrix = SkMatrix::I();
    };

    /**
     * Returns the payload for a given frame.
     *
     * If the image asset is static, getFrameData() is only called once, at animation load time.
     * Otherwise, this gets invoked every time the animation time is adjusted (on every seek).
     *
     * Embedders should cache and serve the same SkImage whenever possible, for efficiency.
     *
     * @param t   Frame time code, in seconds, relative to the image layer timeline origin
     *            (in-point).
     */
    virtual FrameData getFrameData(float t);
};

class MultiFrameImageAsset final : public ImageAsset {
public:
    /**
    * By default, images are decoded on-the-fly, at rasterization time.
    * Large images may cause jank as decoding is expensive (and can thrash internal caches).
    *
    * Pass |predecode| true to force-decode all images upfront, at the cost of potentially more RAM
    * and slower animation build times.
    */
    static sk_sp<MultiFrameImageAsset> Make(sk_sp<SkData>, bool predecode = false);

    bool isMultiFrame() override;

    sk_sp<SkImage> getFrame(float t) override;

private:
    explicit MultiFrameImageAsset(std::unique_ptr<SkAnimCodecPlayer>, bool predecode);

    sk_sp<SkImage> generateFrame(float t);

    std::unique_ptr<SkAnimCodecPlayer> fPlayer;
    sk_sp<SkImage>                     fCachedFrame;
    bool                               fPreDecode;

    using INHERITED = ImageAsset;
};

/**
 * External track (e.g. audio playback) interface.
 *
 * Used to wrap data payload and playback controllers.
 */
class ExternalTrackAsset : public SkRefCnt {
public:
    /**
     * Playback control callback, emitted for each corresponding Animation::seek().
     *
     * @param t  Frame time code, in seconds, relative to the layer's timeline origin
     *           (in-point).
     *
     * Negative |t| values are used to signal off state (stop playback outside layer span).
     */
    virtual void seek(float t) = 0;
};

/**
 * ResourceProvider is an interface that lets rich-content modules defer loading of external
 * resources (images, fonts, etc.) to embedding clients.
 */
class SK_API ResourceProvider : public SkRefCnt {
public:
    /**
     * Load a generic resource (currently only nested animations) specified by |path| + |name|,
     * and return as an SkData.
     */
    virtual sk_sp<SkData> load(const char[] /* resource_path */,
                               const char[] /* resource_name */) const {
        return nullptr;
    }

    /**
     * Load an image asset specified by |path| + |name|, and returns the corresponding
     * ImageAsset proxy.
     */
    virtual sk_sp<ImageAsset> loadImageAsset(const char[] /* resource_path */,
                                             const char[] /* resource_name */,
                                             const char[] /* resource_id   */) const {
        return nullptr;
    }

    /**
     * Load an external audio track specified by |path|/|name|/|id|.
     */
    virtual sk_sp<ExternalTrackAsset> loadAudioAsset(const char[] /* resource_path */,
                                                     const char[] /* resource_name */,
                                                     const char[] /* resource_id   */) {
        return nullptr;
    }

    /**
     * DEPRECATED: implement loadTypeface() instead.
     *
     * Load an external font and return as SkData.
     *
     * @param name  font name    ("fName" Lottie property)
     * @param url   web font URL ("fPath" Lottie property)
     *
     * -- Note --
     *
     *   This mechanism assumes monolithic fonts (single data blob).  Some web font providers may
     *   serve multiple font blobs, segmented for various unicode ranges, depending on user agent
     *   capabilities (woff, woff2).  In that case, the embedder would need to advertise no user
     *   agent capabilities when fetching the URL, in order to receive full font data.
     */
    virtual sk_sp<SkData> loadFont(const char[] /* name */,
                                   const char[] /* url  */) const {
        return nullptr;
    }

    /**
     * Load an external font and return as SkTypeface.
     *
     * @param name  font name
     * @param url   web font URL
     */
    virtual sk_sp<SkTypeface> loadTypeface(const char[] /* name */,
                                           const char[] /* url  */) const {
        return nullptr;
    }
};

class FileResourceProvider final : public ResourceProvider {
public:
    static sk_sp<FileResourceProvider> Make(SkString base_dir, bool predecode = false);

    sk_sp<SkData> load(const char resource_path[], const char resource_name[]) const override;

    sk_sp<ImageAsset> loadImageAsset(const char[], const char[], const char[]) const override;

private:
    FileResourceProvider(SkString, bool);

    const SkString fDir;
    const bool     fPredecode;

    using INHERITED = ResourceProvider;
};

class ResourceProviderProxyBase : public ResourceProvider {
protected:
    explicit ResourceProviderProxyBase(sk_sp<ResourceProvider>);

    sk_sp<SkData> load(const char[], const char[]) const override;
    sk_sp<ImageAsset> loadImageAsset(const char[], const char[], const char[]) const override;
    sk_sp<SkTypeface> loadTypeface(const char[], const char[]) const override;
    sk_sp<SkData> loadFont(const char[], const char[]) const override;
    sk_sp<ExternalTrackAsset> loadAudioAsset(const char[], const char[], const char[]) override;

private:
    const sk_sp<ResourceProvider> fProxy;
};

class SK_API CachingResourceProvider final : public ResourceProviderProxyBase {
public:
    static sk_sp<CachingResourceProvider> Make(sk_sp<ResourceProvider> rp) {
        return rp ? sk_sp<CachingResourceProvider>(new CachingResourceProvider(std::move(rp)))
                  : nullptr;
    }

private:
    explicit CachingResourceProvider(sk_sp<ResourceProvider>);

    sk_sp<ImageAsset> loadImageAsset(const char[], const char[], const char[]) const override;

    mutable SkMutex                                 fMutex;
    mutable SkTHashMap<SkString, sk_sp<ImageAsset>> fImageCache;

    using INHERITED = ResourceProviderProxyBase;
};

class DataURIResourceProviderProxy final : public ResourceProviderProxyBase {
public:
    static sk_sp<DataURIResourceProviderProxy> Make(sk_sp<ResourceProvider> rp,
                                                    bool predecode = false);

private:
    DataURIResourceProviderProxy(sk_sp<ResourceProvider>, bool);

    sk_sp<ImageAsset> loadImageAsset(const char[], const char[], const char[]) const override;
    sk_sp<SkTypeface> loadTypeface(const char[], const char[]) const override;

    const bool fPredecode;

    using INHERITED = ResourceProviderProxyBase;
};

} // namespace skresources

#endif // SkResources_DEFINED
