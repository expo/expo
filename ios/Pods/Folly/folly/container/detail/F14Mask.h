/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <algorithm>
#include <cstdint>

#include <folly/Bits.h>
#include <folly/ConstexprMath.h>
#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/lang/Assume.h>
#include <folly/lang/SafeAssert.h>

#if (FOLLY_SSE >= 2 || (FOLLY_NEON && FOLLY_AARCH64)) && !FOLLY_MOBILE

namespace folly {
namespace f14 {
namespace detail {

template <typename T>
FOLLY_ALWAYS_INLINE static unsigned findFirstSetNonZero(T mask) {
  assume(mask != 0);
  if (sizeof(mask) == sizeof(unsigned)) {
    return __builtin_ctz(static_cast<unsigned>(mask));
  } else {
    return __builtin_ctzll(mask);
  }
}

#if FOLLY_NEON
using MaskType = uint64_t;

constexpr unsigned kMaskSpacing = 4;
#else // SSE2
using MaskType = uint32_t;

constexpr unsigned kMaskSpacing = 1;
#endif

template <unsigned BitCount>
struct FullMask {
  static constexpr MaskType value =
      (FullMask<BitCount - 1>::value << kMaskSpacing) + 1;
};

template <>
struct FullMask<1> : std::integral_constant<MaskType, 1> {};

#if FOLLY_ARM
// Mask iteration is different for ARM because that is the only platform
// for which the mask is bigger than a register.

// Iterates a mask, optimized for the case that only a few bits are set
class SparseMaskIter {
  static_assert(kMaskSpacing == 4, "");

  uint32_t interleavedMask_;

 public:
  explicit SparseMaskIter(MaskType mask)
      : interleavedMask_{static_cast<uint32_t>(((mask >> 32) << 2) | mask)} {}

  bool hasNext() {
    return interleavedMask_ != 0;
  }

  unsigned next() {
    FOLLY_SAFE_DCHECK(hasNext(), "");
    unsigned i = findFirstSetNonZero(interleavedMask_);
    interleavedMask_ &= (interleavedMask_ - 1);
    return ((i >> 2) | (i << 2)) & 0xf;
  }
};

// Iterates a mask, optimized for the case that most bits are set
class DenseMaskIter {
  static_assert(kMaskSpacing == 4, "");

  std::size_t count_;
  unsigned index_;
  uint8_t const* tags_;

 public:
  explicit DenseMaskIter(uint8_t const* tags, MaskType mask) {
    if (mask == 0) {
      count_ = 0;
    } else {
      count_ = popcount(static_cast<uint32_t>(((mask >> 32) << 2) | mask));
      if (LIKELY((mask & 1) != 0)) {
        index_ = 0;
      } else {
        index_ = findFirstSetNonZero(mask) / kMaskSpacing;
      }
      tags_ = tags;
    }
  }

  bool hasNext() {
    return count_ > 0;
  }

  unsigned next() {
    auto rv = index_;
    --count_;
    if (count_ > 0) {
      do {
        ++index_;
      } while ((tags_[index_] & 0x80) == 0);
    }
    FOLLY_SAFE_DCHECK(index_ < 16, "");
    return rv;
  }
};

#else
// Iterates a mask, optimized for the case that only a few bits are set
class SparseMaskIter {
  MaskType mask_;

 public:
  explicit SparseMaskIter(MaskType mask) : mask_{mask} {}

  bool hasNext() {
    return mask_ != 0;
  }

  unsigned next() {
    FOLLY_SAFE_DCHECK(hasNext(), "");
    unsigned i = findFirstSetNonZero(mask_);
    mask_ &= (mask_ - 1);
    return i / kMaskSpacing;
  }
};

// Iterates a mask, optimized for the case that most bits are set
class DenseMaskIter {
  MaskType mask_;
  unsigned index_{0};

 public:
  explicit DenseMaskIter(uint8_t const*, MaskType mask) : mask_{mask} {}

  bool hasNext() {
    return mask_ != 0;
  }

  unsigned next() {
    FOLLY_SAFE_DCHECK(hasNext(), "");
    if (LIKELY((mask_ & 1) != 0)) {
      mask_ >>= kMaskSpacing;
      return index_++;
    } else {
      unsigned s = findFirstSetNonZero(mask_);
      unsigned rv = index_ + (s / kMaskSpacing);
      mask_ >>= (s + kMaskSpacing);
      index_ = rv + 1;
      return rv;
    }
  }
};
#endif

// Iterates a mask, returning pairs of [begin,end) index covering blocks
// of set bits
class MaskRangeIter {
  MaskType mask_;
  unsigned shift_{0};

 public:
  explicit MaskRangeIter(MaskType mask) {
    // If kMaskSpacing is > 1 then there will be empty bits even for
    // contiguous ranges.  Fill them in.
    mask_ = mask * ((1 << kMaskSpacing) - 1);
  }

  bool hasNext() {
    return mask_ != 0;
  }

  std::pair<unsigned, unsigned> next() {
    FOLLY_SAFE_DCHECK(hasNext(), "");
    auto s = shift_;
    unsigned b = findFirstSetNonZero(mask_);
    unsigned e = findFirstSetNonZero(~(mask_ | (mask_ - 1)));
    mask_ >>= e;
    shift_ = s + e;
    return std::make_pair((s + b) / kMaskSpacing, (s + e) / kMaskSpacing);
  }
};

// Holds the result of an index query that has an optional result,
// interpreting a mask of 0 to be the empty answer and the index of the
// last set bit to be the non-empty answer
class LastOccupiedInMask {
  MaskType mask_;

 public:
  explicit LastOccupiedInMask(MaskType mask) : mask_{mask} {}

  bool hasIndex() const {
    return mask_ != 0;
  }

  unsigned index() const {
    assume(mask_ != 0);
    return (findLastSet(mask_) - 1) / kMaskSpacing;
  }
};

// Holds the result of an index query that has an optional result,
// interpreting a mask of 0 to be the empty answer and the index of the
// first set bit to be the non-empty answer
class FirstEmptyInMask {
  MaskType mask_;

 public:
  explicit FirstEmptyInMask(MaskType mask) : mask_{mask} {}

  bool hasIndex() const {
    return mask_ != 0;
  }

  unsigned index() const {
    FOLLY_SAFE_DCHECK(mask_ != 0, "");
    return findFirstSetNonZero(mask_) / kMaskSpacing;
  }
};

} // namespace detail
} // namespace f14
} // namespace folly

#endif
