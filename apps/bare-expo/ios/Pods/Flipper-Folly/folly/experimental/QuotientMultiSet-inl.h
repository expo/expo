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

#include <folly/experimental/QuotientMultiSet.h>

#include <folly/Format.h>
#include <folly/Portability.h>
#include <folly/experimental/Bits.h>
#include <folly/experimental/Select64.h>
#include <folly/lang/Bits.h>
#include <folly/lang/SafeAssert.h>
#include <glog/logging.h>

#if FOLLY_QUOTIENT_MULTI_SET_SUPPORTED

namespace folly {

namespace qms_detail {

/*
 * Reference: Faster Remainder by Direct Computation: Applications to Compilers
 * and Software Libraries, Software: Practice and Experience 49 (6), 2019.
 */
FOLLY_ALWAYS_INLINE UInt64InverseType getInverse(uint64_t divisor) {
  UInt64InverseType fraction = UInt64InverseType(-1);
  fraction /= divisor;
  fraction += 1;
  return fraction;
}

FOLLY_ALWAYS_INLINE uint64_t
mul128(UInt64InverseType lowbits, uint64_t divisor) {
  UInt64InverseType bottomHalf =
      (lowbits & UINT64_C(0xFFFFFFFFFFFFFFFF)) * divisor;
  bottomHalf >>= 64;
  UInt64InverseType topHalf = (lowbits >> 64) * divisor;
  UInt64InverseType bothHalves = bottomHalf + topHalf;
  bothHalves >>= 64;
  return static_cast<uint64_t>(bothHalves);
}

FOLLY_ALWAYS_INLINE std::pair<uint64_t, uint64_t> getQuotientAndRemainder(
    uint64_t dividend,
    uint64_t divisor,
    UInt64InverseType inverse) {
  if (FOLLY_UNLIKELY(divisor == 1)) {
    return {dividend, 0};
  }
  auto quotient = mul128(inverse, dividend);
  auto remainder = dividend - quotient * divisor;
  DCHECK_LT(remainder, divisor);
  return {quotient, remainder};
}

// Max value for given bits.
FOLLY_ALWAYS_INLINE uint64_t maxValue(uint32_t nbits) {
  return nbits == 64 ? std::numeric_limits<uint64_t>::max()
                     : (uint64_t(1) << nbits) - 1;
}

} // namespace qms_detail

template <class Instructions>
struct QuotientMultiSet<Instructions>::Metadata {
  // Total number of blocks.
  uint64_t numBlocks;
  uint64_t numKeys;
  uint64_t divisor;
  uint8_t keyBits;
  uint8_t remainderBits;

  std::string debugString() const {
    return sformat(
        "Number of blocks: {}\n"
        "Number of elements: {}\n"
        "Divisor: {}\n"
        "Key bits: {}\n"
        "Remainder bits: {}",
        numBlocks,
        numKeys,
        divisor,
        keyBits,
        remainderBits);
  }
} FOLLY_PACK_ATTR;

template <class Instructions>
struct QuotientMultiSet<Instructions>::Block {
  static const Block* get(const char* data) {
    return reinterpret_cast<const Block*>(data);
  }

  static BlockPtr make(size_t remainderBits) {
    auto ptr = reinterpret_cast<Block*>(calloc(blockSize(remainderBits), 1));
    return {ptr, free};
  }

  uint64_t payload;
  uint64_t occupieds;
  uint64_t offset;
  uint64_t runends;
  char remainders[0];

  static uint64_t blockSize(size_t remainderBits) {
    return sizeof(Block) + remainderBits * 8;
  }

  FOLLY_ALWAYS_INLINE bool isOccupied(size_t offsetInBlock) const {
    return ((occupieds >> offsetInBlock) & uint64_t(1)) != 0;
  }

  FOLLY_ALWAYS_INLINE bool isRunend(size_t offsetInBlock) const {
    return ((runends >> offsetInBlock) & uint64_t(1)) != 0;
  }

  FOLLY_ALWAYS_INLINE uint64_t getRemainder(
      size_t offsetInBlock,
      size_t remainderBits,
      size_t remainderMask) const {
    DCHECK_LE(remainderBits, 56);
    const size_t bitPos = offsetInBlock * remainderBits;
    const uint64_t remainderWord =
        loadUnaligned<uint64_t>(remainders + (bitPos / 8));
    return (remainderWord >> (bitPos % 8)) & remainderMask;
  }

  void setOccupied(size_t offsetInBlock) {
    occupieds |= uint64_t(1) << offsetInBlock;
  }

  void setRunend(size_t offsetInBlock) {
    runends |= uint64_t(1) << offsetInBlock;
  }

  void
  setRemainder(size_t offsetInBlock, size_t remainderBits, uint64_t remainder) {
    DCHECK_LT(offsetInBlock, kBlockSize);
    if (FOLLY_UNLIKELY(remainderBits == 0)) {
      return;
    }
    Bits<uint64_t>::set(
        reinterpret_cast<uint64_t*>(remainders),
        offsetInBlock * remainderBits,
        remainderBits,
        remainder);
  }
} FOLLY_PACK_ATTR;

template <class Instructions>
QuotientMultiSet<Instructions>::QuotientMultiSet(StringPiece data) {
  static_assert(
      kIsLittleEndian, "QuotientMultiSet requires little endianness.");
  StringPiece sp = data;
  CHECK_GE(sp.size(), sizeof(Metadata));
  sp.advance(sp.size() - sizeof(Metadata));
  metadata_ = reinterpret_cast<const Metadata*>(sp.data());
  VLOG(2) << "Metadata: " << metadata_->debugString();

  numBlocks_ = metadata_->numBlocks;
  numSlots_ = numBlocks_ * kBlockSize;
  divisor_ = metadata_->divisor;
  fraction_ = qms_detail::getInverse(divisor_);
  keyBits_ = metadata_->keyBits;
  maxKey_ = qms_detail::maxValue(keyBits_);
  remainderBits_ = metadata_->remainderBits;
  remainderMask_ = qms_detail::maxValue(remainderBits_);
  blockSize_ = Block::blockSize(remainderBits_);

  CHECK_EQ(data.size(), numBlocks_ * blockSize_ + sizeof(Metadata));
  data_ = data.data();
}

template <class Instructions>
auto QuotientMultiSet<Instructions>::equalRange(uint64_t key) const
    -> SlotRange {
  if (key > maxKey_) {
    return {0, 0};
  }
  const auto qr = qms_detail::getQuotientAndRemainder(key, divisor_, fraction_);
  const auto& quotient = qr.first;
  const auto& remainder = qr.second;
  const size_t blockIndex = quotient / kBlockSize;
  const size_t offsetInBlock = quotient % kBlockSize;

  if (FOLLY_UNLIKELY(blockIndex >= numBlocks_)) {
    return {0, 0};
  }

  const auto* occBlock = getBlock(blockIndex);
  __builtin_prefetch(reinterpret_cast<const char*>(&occBlock->occupieds) + 64);
  const auto firstRunend = occBlock->offset;
  if (!occBlock->isOccupied(offsetInBlock)) {
    // Return a position that depends on the contents of the block so
    // we can create a dependency in benchmarks.
    return {firstRunend, firstRunend};
  }

  // Look for the right runend for the given key.
  const uint64_t occupiedRank = Instructions::popcount(
      Instructions::bzhi(occBlock->occupieds, offsetInBlock));
  auto runend = findRunend(occupiedRank, firstRunend);
  auto& slot = runend.first;
  auto& block = runend.second;

  // Iterates over the run backwards to find the slots whose remainder
  // matches the key.
  SlotRange range = {slot + 1, slot + 1};
  while (true) {
    uint64_t slotRemainder =
        block->getRemainder(slot % kBlockSize, remainderBits_, remainderMask_);

    if (slotRemainder > remainder) {
      range.begin = slot;
      range.end = slot;
    } else if (slotRemainder == remainder) {
      range.begin = slot;
    } else {
      break;
    }

    if (FOLLY_UNLIKELY(slot % kBlockSize == 0)) {
      // Reached block start and the run starts from a prev block.
      size_t slotBlockIndex = slot / kBlockSize;
      if (slotBlockIndex > blockIndex) {
        block = getBlock(slotBlockIndex - 1);
      } else {
        break;
      }
    }

    --slot;
    // Encounters the previous run.
    if (block->isRunend(slot % kBlockSize)) {
      break;
    }
  }

  return range;
}

template <class Instructions>
auto QuotientMultiSet<Instructions>::findRunend(
    uint64_t occupiedRank,
    uint64_t firstRunend) const -> std::pair<uint64_t, const Block*> {
  // Look for the right runend.
  size_t slotBlockIndex = firstRunend / kBlockSize;
  auto block = getBlock(slotBlockIndex);
  uint64_t runendWord =
      block->runends & (uint64_t(-1) << (firstRunend % kBlockSize));

  while (true) {
    DCHECK_LE(slotBlockIndex, numBlocks_);

    const size_t numRuns = Instructions::popcount(runendWord);
    if (FOLLY_LIKELY(numRuns > occupiedRank)) {
      break;
    }
    occupiedRank -= numRuns;
    ++slotBlockIndex;
    block = getBlock(slotBlockIndex);
    runendWord = block->runends;
  }

  return {slotBlockIndex * kBlockSize +
              select64<Instructions>(runendWord, occupiedRank),
          block};
}

template <class Instructions>
uint64_t QuotientMultiSet<Instructions>::getBlockPayload(
    uint64_t blockIndex) const {
  DCHECK_LT(blockIndex, numBlocks_);
  return getBlock(blockIndex)->payload;
}

template <class Instructions>
QuotientMultiSet<Instructions>::Iterator::Iterator(
    const QuotientMultiSet<Instructions>* qms)
    : qms_(qms),
      key_(0),
      occBlockIndex_(-1),
      occOffsetInBlock_(0),
      occWord_(0),
      occBlock_(nullptr),
      pos_(-1) {}

template <class Instructions>
bool QuotientMultiSet<Instructions>::Iterator::next() {
  if (pos_ == size_t(-1) ||
      qms_->getBlock(pos_ / kBlockSize)->isRunend(pos_ % kBlockSize)) {
    // Move to start of next run.
    if (!nextOccupied()) {
      return setEnd();
    }

    // Next run either starts at pos + 1 or the start of block
    // specified by occupied slot.
    pos_ = std::max<uint64_t>(pos_ + 1, occBlockIndex_ * kBlockSize);
  } else {
    // Move to next slot since a run must be contiguous.
    pos_++;
  }

  const Block* block = qms_->getBlock(pos_ / kBlockSize);
  uint64_t quotient =
      (occBlockIndex_ * kBlockSize + occOffsetInBlock_) * qms_->divisor_;
  key_ = quotient +
      block->getRemainder(
          pos_ % kBlockSize, qms_->remainderBits_, qms_->remainderMask_);

  DCHECK_LT(pos_, qms_->numBlocks_ * kBlockSize);
  return true;
}

template <class Instructions>
bool QuotientMultiSet<Instructions>::Iterator::skipTo(uint64_t key) {
  if (key > qms_->maxKey_) {
    return false;
  }
  const auto qr =
      qms_detail::getQuotientAndRemainder(key, qms_->divisor_, qms_->fraction_);
  const auto& quotient = qr.first;
  occBlockIndex_ = quotient / kBlockSize;
  occOffsetInBlock_ = quotient % kBlockSize;

  if (FOLLY_UNLIKELY(occBlockIndex_ >= qms_->numBlocks_)) {
    return setEnd();
  }

  occBlock_ = qms_->getBlock(occBlockIndex_);
  occWord_ = occBlock_->occupieds & (uint64_t(-1) << occOffsetInBlock_);
  if (!nextOccupied()) {
    return setEnd();
  }

  // Search for the next runend.
  uint64_t occupiedRank = Instructions::popcount(
      Instructions::bzhi(occBlock_->occupieds, occOffsetInBlock_));
  auto runend = qms_->findRunend(occupiedRank, occBlock_->offset);
  auto& slot = runend.first;
  auto& block = runend.second;
  uint64_t slotBlockIndex = slot / kBlockSize;
  uint64_t slotOffsetInBlock = slot % kBlockSize;
  pos_ = slot;

  uint64_t nextQuotient =
      (occBlockIndex_ * kBlockSize + occOffsetInBlock_) * qms_->divisor_;
  uint64_t nextRemainder = block->getRemainder(
      slotOffsetInBlock, qms_->remainderBits_, qms_->remainderMask_);

  if (nextQuotient + nextRemainder < key) {
    // Lower bound element is at the start of next run.
    return next();
  }

  // Iterate over the run backwards to find the first key that is larger than
  // or equal to the given key.
  while (true) {
    uint64_t slotRemainder = block->getRemainder(
        slotOffsetInBlock, qms_->remainderBits_, qms_->remainderMask_);
    if (nextQuotient + slotRemainder < key) {
      break;
    }
    pos_ = slot;
    nextRemainder = slotRemainder;
    if (FOLLY_UNLIKELY(slotOffsetInBlock == 0)) {
      // Reached block start and the run starts from a prev block.
      if (slotBlockIndex > occBlockIndex_) {
        --slotBlockIndex;
        block = qms_->getBlock(slotBlockIndex);
        slotOffsetInBlock = kBlockSize;
      } else {
        break;
      }
    }
    --slot;
    --slotOffsetInBlock;

    // Encounters the previous run.
    if (block->isRunend(slotOffsetInBlock)) {
      break;
    }
  }

  key_ = nextQuotient + nextRemainder;
  return true;
}

template <class Instructions>
bool QuotientMultiSet<Instructions>::Iterator::nextOccupied() {
  while (FOLLY_UNLIKELY(occWord_ == 0)) {
    if (FOLLY_UNLIKELY(++occBlockIndex_ >= qms_->numBlocks_)) {
      return false;
    }
    occBlock_ = qms_->getBlock(occBlockIndex_);
    occWord_ = occBlock_->occupieds;
  }

  occOffsetInBlock_ = Instructions::ctz(occWord_);
  occWord_ = Instructions::blsr(occWord_);
  return true;
}

} // namespace folly

#endif // FOLLY_QUOTIENT_MULTI_SET_SUPPORTED
