/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_PUBLIC_GCCONFIG_H
#define HERMES_PUBLIC_GCCONFIG_H

#include "hermes/Public/CtorConfig.h"
#include "hermes/Public/GCTripwireContext.h"

#include <algorithm>
#include <cassert>
#include <chrono>
#include <cstdint>
#include <functional>
#include <limits>
#include <memory>
#include <string>
#include <vector>

namespace hermes {
namespace vm {

/// A type big enough to accomodate the entire allocated address space.
/// Individual allocations are always 'uint32_t', but on a 64-bit machine we
/// might want to accommodate a larger total heap (or not, in which case we keep
/// it 32-bit).
using gcheapsize_t = uint32_t;

/// Represents a value before and after an event.
/// NOTE: Not a std::pair because using the names are more readable than first
/// and second.
struct BeforeAndAfter {
  uint64_t before;
  uint64_t after;
};

struct GCAnalyticsEvent {
  /// The same value as \p Name from GCConfig. Stored here for simplicity of
  /// the API since this is passed in callbacks that might not be able to store
  /// the name. For a given Runtime, this will be the same value every time.
  std::string runtimeDescription;

  /// The kind of GC this was. For a given Runtime, this will be the same value
  /// every time.
  std::string gcKind;

  /// The type of collection that ran, typically differentiating a "young"
  /// generation GC and an "old" generation GC. When other values say they're
  /// "scoped to the collectionType", it means that for a generation GC
  /// they're only reporting the numbers for that generation.
  std::string collectionType;

  /// The cause of this GC. Can be an arbitrary string describing the cause.
  /// Typically "natural" is used to mean that the GC decided it was time, and
  /// other causes mean it was forced by some other condition.
  std::string cause;

  /// The wall time a collection took from start to end.
  std::chrono::milliseconds duration;

  /// The CPU time a collection took from start to end. This time measure will
  /// exclude time waiting on disk, mutexes, or time spent not scheduled to run.
  std::chrono::milliseconds cpuDuration;

  /// The number of bytes allocated in the heap before and after the collection.
  /// measurement does not include fragmentation, and is the same as the sum of
  /// all sizes in calls to \p GC::makeA into that generation (including any
  /// rounding up the GC does).
  /// The value is scoped to the \p collectionType.
  BeforeAndAfter allocated;

  /// The number of bytes in use by the heap before and after the collection.
  /// This measurement can include fragmentation if the \p gcKind has that
  /// concept.
  /// The value is scoped to the \p collectionType.
  BeforeAndAfter size;

  /// The number of bytes external to the JS heap before and after the
  /// collection.
  /// The value is scoped to the \p collectionType.
  BeforeAndAfter external;

  /// The ratio of cells that survived the collection to all cells before
  /// the collection. Note that this is in term of sizes of cells, not the
  /// numbers of cells. Excludes any cells not in direct use by the JS program,
  /// such as FillerCell or FreelistCell.
  /// The value is scoped to the \p collectionType.
  double survivalRatio;

  /// A list of metadata tags to annotate this event with.
  std::vector<std::string> tags;
};

/// Parameters to control a tripwire function called when the live set size
/// surpasses a given threshold after collections.  Check documentation in
/// README.md
#define GC_TRIPWIRE_FIELDS(F)                                                  \
  /* If the heap size is above this threshold after a collection, the tripwire \
   * is triggered. */                                                          \
  F(constexpr, gcheapsize_t, Limit, std::numeric_limits<gcheapsize_t>::max())  \
                                                                               \
  /* The callback to call when the tripwire is considered triggered. */        \
  F(HERMES_NON_CONSTEXPR,                                                      \
    std::function<void(GCTripwireContext &)>,                                  \
    Callback,                                                                  \
    nullptr)                                                                   \
  /* GC_TRIPWIRE_FIELDS END */

_HERMES_CTORCONFIG_STRUCT(GCTripwireConfig, GC_TRIPWIRE_FIELDS, {})

#undef HEAP_TRIPWIRE_FIELDS

#define GC_HANDLESAN_FIELDS(F)                                        \
  /* The probability with which the GC should keep moving the heap */ \
  /* to detect stale GC handles. */                                   \
  F(constexpr, double, SanitizeRate, 0.0)                             \
  /* Random seed to use for basis of decisions whether or not to */   \
  /* sanitize. A negative value will mean a seed will be chosen at */ \
  /* random. */                                                       \
  F(constexpr, int64_t, RandomSeed, -1)                               \
  /* GC_HANDLESAN_FIELDS END */

_HERMES_CTORCONFIG_STRUCT(GCSanitizeConfig, GC_HANDLESAN_FIELDS, {})

#undef GC_HANDLESAN_FIELDS

/// How aggressively to return unused memory to the OS.
enum ReleaseUnused {
  kReleaseUnusedNone = 0, /// Don't try to release unused memory.
  kReleaseUnusedOld, /// Only old gen, on full collections.
  kReleaseUnusedYoungOnFull, /// Also young gen, but only on full collections.
  kReleaseUnusedYoungAlways /// Also young gen, also on young gen collections.
};

enum class GCEventKind {
  CollectionStart,
  CollectionEnd,
};

/// Parameters for GC Initialisation.  Check documentation in README.md
/// constexpr indicates that the default value is constexpr.
#define GC_FIELDS(F)                                                     \
  /* Minimum heap size hint. */                                          \
  F(constexpr, gcheapsize_t, MinHeapSize, 0)                             \
                                                                         \
  /* Initial heap size hint. */                                          \
  F(constexpr, gcheapsize_t, InitHeapSize, 32 << 20)                     \
                                                                         \
  /* Maximum heap size hint. */                                          \
  F(constexpr, gcheapsize_t, MaxHeapSize, 3u << 30)                      \
                                                                         \
  /* Sizing heuristic: fraction of heap to be occupied by live data. */  \
  F(constexpr, double, OccupancyTarget, 0.5)                             \
                                                                         \
  /* Number of consecutive full collections considered to be an OOM. */  \
  F(constexpr,                                                           \
    unsigned,                                                            \
    EffectiveOOMThreshold,                                               \
    std::numeric_limits<unsigned>::max())                                \
                                                                         \
  /* Sanitizer configuration for the GC. */                              \
  F(constexpr, GCSanitizeConfig, SanitizeConfig)                         \
                                                                         \
  /* Whether to Keep track of GC Statistics. */                          \
  F(constexpr, bool, ShouldRecordStats, false)                           \
                                                                         \
  /* How aggressively to return unused memory to the OS. */              \
  F(constexpr, ReleaseUnused, ShouldReleaseUnused, kReleaseUnusedOld)    \
                                                                         \
  /* Name for this heap in logs. */                                      \
  F(HERMES_NON_CONSTEXPR, std::string, Name, "")                         \
                                                                         \
  /* Configuration for the Heap Tripwire. */                             \
  F(HERMES_NON_CONSTEXPR, GCTripwireConfig, TripwireConfig)              \
                                                                         \
  /* Whether to (initially) allocate from the young gen (true) or the */ \
  /* old gen (false). */                                                 \
  F(constexpr, bool, AllocInYoung, true)                                 \
                                                                         \
  /* Whether to fill the YG with invalid data after each collection. */  \
  F(constexpr, bool, OverwriteDeadYGObjects, false)                      \
                                                                         \
  /* Whether to revert, if necessary, to young-gen allocation at TTI. */ \
  F(constexpr, bool, RevertToYGAtTTI, false)                             \
                                                                         \
  /* Whether to use mprotect on GC metadata between GCs. */              \
  F(constexpr, bool, ProtectMetadata, false)                             \
                                                                         \
  /* Callout for an analytics event. */                                  \
  F(HERMES_NON_CONSTEXPR,                                                \
    std::function<void(const GCAnalyticsEvent &)>,                       \
    AnalyticsCallback,                                                   \
    nullptr)                                                             \
                                                                         \
  /* Called at GC events (see GCEventKind enum for the list). The */     \
  /* second argument contains human-readable details about the event. */ \
  /* NOTE: The function MUST NOT invoke any methods on the Runtime. */   \
  F(HERMES_NON_CONSTEXPR,                                                \
    std::function<void(GCEventKind, const char *)>,                      \
    Callback,                                                            \
    nullptr)                                                             \
  /* GC_FIELDS END */

_HERMES_CTORCONFIG_STRUCT(GCConfig, GC_FIELDS, {
  if (builder.hasMinHeapSize()) {
    if (builder.hasInitHeapSize()) {
      // If both are specified, normalize the initial size up to the minimum,
      // if necessary.
      InitHeapSize_ = std::max(MinHeapSize_, InitHeapSize_);
    } else {
      // If the minimum is set explicitly, but the initial heap size is not,
      // use the minimum as the initial size.
      InitHeapSize_ = MinHeapSize_;
    }
  }
  assert(InitHeapSize_ >= MinHeapSize_);

  // Make sure the max is at least the Init.
  MaxHeapSize_ = std::max(InitHeapSize_, MaxHeapSize_);
})

#undef GC_FIELDS

} // namespace vm
} // namespace hermes

#endif // HERMES_PUBLIC_GCCONFIG_H
