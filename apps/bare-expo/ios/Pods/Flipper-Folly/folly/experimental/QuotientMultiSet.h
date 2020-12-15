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

#include <deque>
#include <utility>

#include <folly/Portability.h>
#include <folly/Range.h>
#include <folly/experimental/Instructions.h>
#include <folly/io/IOBuf.h>
#include <folly/io/IOBufQueue.h>

// A 128-bit integer type is needed for fast division.
#define FOLLY_QUOTIENT_MULTI_SET_SUPPORTED FOLLY_HAVE_INT128_T

#if FOLLY_QUOTIENT_MULTI_SET_SUPPORTED

namespace folly {

namespace qms_detail {

using UInt64InverseType = __uint128_t;

} // namespace qms_detail

/**
 * A space-efficient static data structure to store a non-decreasing sequence of
 * b-bit integers. If the integers are uniformly distributed lookup is O(1)-time
 * and performs a single random memory lookup with high probability.
 *
 * Space for n keys is bounded by (5 + b - log(n / loadFactor)) / loadFactor
 * bits per element, which makes it particularly efficient for very dense
 * sets. Note that 1 bit is taken up by the user-provided block payloads, and 1
 * depends on how close the table size is to a power of 2. Experimentally,
 * performance is good up to load factor 95%.
 *
 * Lookup returns a range of positions in the table. The intended use case is to
 * store hashes, as the first layer of a multi-layer hash table. If b is sized
 * to floor(log(n)) + k, the probability of a false positive (a non-empty range
 * is returned for a non-existent key) is approximately 2^-k, which makes it
 * competitive with a Bloom filter for low FP probabilities, with the additional
 * benefit that it also returns a range of positions to restrict the search in
 * subsequent layers.
 *
 * The data structure is inspired by the Rank-Select Quotient Filter
 * introduced in
 *
 *   Prashant Pandey, Michael A. Bender, Rob Johnson and Robert Patro,
 *   A General-Purpose Counting Filter: Making Every Bit Count, SIGMOD, 2017
 *
 * Besides being static, QuotientMultiSet differs from the data structure from
 * the paper in the following ways:
 *
 * - The table size can be arbitrary, rather than just powers-of-2. This can
 *   waste up to a bit for each residual, but it prevents 2x overhead when the
 *   desired table size is slightly larger than a power of 2.
 *
 * - Within each block all the holes are moved at the end. This enables
 *   efficient iteration, and makes the returned positions a contiguous range
 *   for each block, which allows to use them to index into a secondary data
 *   structure. An arbitrary 64-bit payload can be attached to each block; for
 *   example, this can be used to store the number of elements up to that block,
 *   so that positions can be translated to the element rank. Alternatively, the
 *   payload can be used to address blocks in the secondary data structure.
 *
 * - Correctness does not depend on the keys being uniformly distributed.
 *   However, performance does, as for arbitrary keys the worst-case lookup time
 *   can be linear.
 *
 * Implemented by Matt Ma based on a prototype by Giuseppe Ottaviano and
 * Sebastiano Vigna.
 *
 * Data layout:
 * ------------------------------------------------------------------------
 * | Block | Block | Block | Block |  ...                         | Block |
 * ------------------------------------------------------------------------
 *                /        |
 * ------------------------------------------------------------------------
 * | Payload | Occupieds | Offset | Runends |       Remainders * 64       |
 * ------------------------------------------------------------------------
 *
 * Each block contains 64 slots. Keys mapping to the same slot are stored
 * contiguously in a run. The occupieds and runends bitvectors are the
 * concatenation of the corresponding words in each block.
 *
 * - Occupieds bit indicates whether there is a key mapping to this quotient.
 *
 * - Offset stores the position of the runend of the first run in this block.
 *
 * - Runends bit indicates whether the slot is the end of some run. 1s in
 *   occupieds and runends bits are in 1-1 correspondence: the i-th 1 in the
 *   runends vector marks the run end of the i-th 1 in the occupieds.
 */

template <class Instructions = compression::instructions::Default>
class QuotientMultiSet final {
 public:
  explicit QuotientMultiSet(StringPiece data);

  // Each block contains 64 elements.
  static constexpr size_t kBlockSize = 64;

  // Position range of given key. End is not included. Range can be empty if the
  // key is not found, in which case the values of begin and end are
  // unspecified.
  struct SlotRange {
    size_t begin = 0;
    size_t end = 0;

    explicit operator bool() const {
      DCHECK_LE(begin, end);
      return begin < end;
    }
  };

  class Iterator;

  // Get the position range for the given key.
  SlotRange equalRange(uint64_t key) const;

  // Get payload of given block.
  uint64_t getBlockPayload(uint64_t blockIndex) const;

  friend class QuotientMultiSetBuilder;

 private:
  // Metadata to describe a quotient table.
  struct Metadata;

  // Block contains payload, occupieds, runends, offsets and 64 remainders.
  struct Block;
  using BlockPtr = std::unique_ptr<Block, decltype(free)*>;

  const Block* getBlock(size_t blockIndex) const {
    return Block::get(data_ + blockIndex * blockSize_);
  }

  FOLLY_ALWAYS_INLINE std::pair<uint64_t, const Block*> findRunend(
      uint64_t occupiedRank,
      uint64_t startPos) const;

  const Metadata* metadata_;
  const char* data_;
  // Total number of blocks.
  size_t numBlocks_;
  size_t numSlots_;
  // Number of bytes per block.
  size_t blockSize_;
  // Divisor for mapping from keys to slots.
  uint64_t divisor_;
  // fraction_ = 1 / divisor_.
  qms_detail::UInt64InverseType fraction_;
  // Number of key bits.
  size_t keyBits_;
  uint64_t maxKey_;
  // Number of remainder bits.
  size_t remainderBits_;
  uint64_t remainderMask_;
};

template <class Instructions>
class QuotientMultiSet<Instructions>::Iterator {
 public:
  explicit Iterator(const QuotientMultiSet<Instructions>* qms);

  // Advance to the next key.
  bool next();

  // Skip forward to the first key >= the given key.
  bool skipTo(uint64_t key);

  bool done() const {
    return pos_ == qms_->numSlots_;
  }

  // Return current key.
  uint64_t key() const {
    return key_;
  }

  // Return current position in quotient multiset.
  size_t pos() const {
    return pos_;
  }

 private:
  // Position the iterator at the end and return false.
  // Shortcut for use when implementing doNext, etc: return setEnd();
  bool setEnd() {
    pos_ = qms_->numSlots_;
    return false;
  }

  // Move to next occupied.
  bool nextOccupied();

  const QuotientMultiSet<Instructions>* qms_;
  uint64_t key_;

  // State members for the quotient occupied position.
  // Block index of key_'s occupied slot.
  size_t occBlockIndex_;
  // Block offset of key_'s occupied slot.
  uint64_t occOffsetInBlock_;
  // Occupied words of the occupiedBlock_ after quotientBlockOffset_.
  uint64_t occWord_;
  // Block of the current occupied slot.
  const Block* occBlock_;

  // State member for the actual key position.
  // Position of the current key_.
  size_t pos_;
};

/*
 * Class to build a QuotientMultiSet.
 *
 * The builder requires inserting elements in non-decreasing order.
 * Example usage:
 *   QuotientMultiSetBuilder builder(...);
 *   while (...) {
 *     if (builder.insert(key)) {
 *       builder.setBlockPayload(payload);
 *     }
 *     if (builder.numReadyBlocks() > N) {
 *       buff = builder.flush();
 *       write(buff);
 *     }
 *   }
 *   buff = builder.close();
 *   write(buff)
 */
class QuotientMultiSetBuilder final {
 public:
  QuotientMultiSetBuilder(
      size_t keyBits,
      size_t expectedElements,
      double loadFactor = kDefaultMaxLoadFactor);
  ~QuotientMultiSetBuilder();

  using Metadata = QuotientMultiSet<>::Metadata;
  using Block = QuotientMultiSet<>::Block;

  // Keeps load factor <= 0.95.
  constexpr static double kDefaultMaxLoadFactor = 0.95;

  constexpr static size_t kBlockSize = QuotientMultiSet<>::kBlockSize;

  // Returns whether the key's slot is in a newly created block.
  // Only allows insert keys in nondecreasing order.
  bool insert(uint64_t key);

  // Set payload of the latest created block.
  // Can only be called immediately after an add() that returns true.
  void setBlockPayload(uint64_t payload);

  // Return all ready blocks till now. The ownership of these blocks will be
  // transferred to the caller.
  void flush(IOBufQueue& buff);

  // Return all remaining blocks since last flush call and the final quotient
  // table metadata. The ownership of these blocks will be transferred to the
  // caller.
  void close(folly::IOBufQueue& buff);

  size_t numReadyBlocks() {
    return readyBlocks_;
  }

 private:
  using BlockPtr = QuotientMultiSet<>::BlockPtr;

  struct BlockWithState {
    BlockWithState(BlockPtr ptr, size_t idx)
        : block(std::move(ptr)), index(idx), ready(false) {}

    BlockPtr block;
    size_t index;
    bool ready;
  };

  // Allocate space for blocks until limitIndex (included).
  bool maybeAllocateBlocks(size_t limitIndex);

  // Close the previous run.
  void closePreviousRun();

  // Move ready blocks to given IOBufQueue.
  void moveReadyBlocks(IOBufQueue& buff);

  // Get block for given block index.
  BlockWithState& getBlock(uint64_t blockIndex) {
    CHECK_GE(blockIndex, blocks_.front().index);
    return blocks_[blockIndex - blocks_.front().index];
  }

  // Number of key bits.
  const size_t keyBits_;
  const uint64_t maxKey_;

  // Total number of blocks.
  size_t numBlocks_ = 0;
  // Number of bytes per block.
  size_t blockSize_ = 0;
  // Divisor for mapping from keys to slots.
  uint64_t divisor_;
  // fraction_ = 1 / divisor_.
  qms_detail::UInt64InverseType fraction_;
  // Number of remainder bits.
  uint64_t remainderBits_;

  size_t numKeys_ = 0;
  size_t numRuns_ = 0;

  uint64_t prevKey_ = 0;
  // Next slot to be used.
  size_t nextSlot_ = 0;
  // The actual start of previous run.
  size_t prevRunStart_ = 0;
  // The quotient of previous run.
  size_t prevOccupiedQuotient_ = 0;
  // Number of ready blocks in deque.
  size_t readyBlocks_ = 0;

  // Contains blocks since last flush call.
  std::deque<BlockWithState> blocks_;

  IOBufQueue buff_;
};

} // namespace folly

#include <folly/experimental/QuotientMultiSet-inl.h>

#endif // FOLLY_QUOTIENT_MULTI_SET_SUPPORTED
