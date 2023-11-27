/*
 * Copyright 2012 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkChecksum_DEFINED
#define SkChecksum_DEFINED

#include "include/core/SkString.h"
#include "include/private/base/SkAPI.h"

#include <cstddef>
#include <cstdint>
#include <string>
#include <string_view>
#include <type_traits>

/**
 * Our hash functions are exposed as SK_SPI (e.g. SkParagraph)
 */
namespace SkChecksum {
    /**
     * uint32_t -> uint32_t hash, useful for when you're about to truncate this hash but you
     * suspect its low bits aren't well mixed.
     *
     * This is the Murmur3 finalizer.
     */
    static inline uint32_t Mix(uint32_t hash) {
        hash ^= hash >> 16;
        hash *= 0x85ebca6b;
        hash ^= hash >> 13;
        hash *= 0xc2b2ae35;
        hash ^= hash >> 16;
        return hash;
    }

    /**
     * uint32_t -> uint32_t hash, useful for when you're about to truncate this hash but you
     * suspect its low bits aren't well mixed.
     *
     *  This version is 2-lines cheaper than Mix, but seems to be sufficient for the font cache.
     */
    static inline uint32_t CheapMix(uint32_t hash) {
        hash ^= hash >> 16;
        hash *= 0x85ebca6b;
        hash ^= hash >> 16;
        return hash;
    }

    /**
     * This is a fast, high-quality 32-bit hash. We make no guarantees about this remaining stable
     * over time, or being consistent across devices.
     *
     * For now, this is a 64-bit wyhash, truncated to 32-bits.
     * See: https://github.com/wangyi-fudan/wyhash
     */
    uint32_t SK_SPI Hash32(const void* data, size_t bytes, uint32_t seed = 0);

    /**
     * This is a fast, high-quality 64-bit hash. We make no guarantees about this remaining stable
     * over time, or being consistent across devices.
     *
     * For now, this is a 64-bit wyhash.
     * See: https://github.com/wangyi-fudan/wyhash
     */
    uint64_t SK_SPI Hash64(const void* data, size_t bytes, uint64_t seed = 0);

}  // namespace SkChecksum

// SkGoodHash should usually be your first choice in hashing data.
// It should be both reasonably fast and high quality.
struct SkGoodHash {
    template <typename K>
    std::enable_if_t<std::has_unique_object_representations<K>::value && sizeof(K) == 4, uint32_t>
    operator()(const K& k) const {
        return SkChecksum::Mix(*(const uint32_t*)&k);
    }

    template <typename K>
    std::enable_if_t<std::has_unique_object_representations<K>::value && sizeof(K) != 4, uint32_t>
    operator()(const K& k) const {
        return SkChecksum::Hash32(&k, sizeof(K));
    }

    uint32_t operator()(const SkString& k) const {
        return SkChecksum::Hash32(k.c_str(), k.size());
    }

    uint32_t operator()(const std::string& k) const {
        return SkChecksum::Hash32(k.c_str(), k.size());
    }

    uint32_t operator()(std::string_view k) const {
        return SkChecksum::Hash32(k.data(), k.size());
    }
};

// The default hashing behavior in SkGoodHash requires the type to have a unique object
// representation (i.e. all bits in contribute to its identity so can be hashed directly). This is
// false when a struct has padding for alignment (which can be avoided by using
// SK_BEGIN|END_REQUIRE_DENSE) or if the struct has floating point members since there are multiple
// bit representations for NaN.
//
// Often Skia code has externally removed the possibility of NaN so the bit representation of a
// non-NaN float will still hash correctly. SkForceDirectHash<K> produces the same as SkGoodHash
// for K's that do not satisfy std::has_unique_object_representation. It should be used sparingly
// and it's use may highlight design issues with the key's data that might warrant an explicitly
// implemented hash function.
template <typename K>
struct SkForceDirectHash {
    uint32_t operator()(const K& k) const {
        return SkChecksum::Hash32(&k, sizeof(K));
    }
};

#endif
