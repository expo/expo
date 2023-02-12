// Copyright 2019 Google LLC.
#ifndef ParagraphCache_DEFINED
#define ParagraphCache_DEFINED

#include "include/private/SkMutex.h"
#include "src/core/SkLRUCache.h"
#include <functional>  // std::function

#define PARAGRAPH_CACHE_STATS

namespace skia {
namespace textlayout {

enum InternalState {
  kUnknown = 0,
  kShaped = 2,
  kClusterized = 3,
  kMarked = 4,
  kLineBroken = 5,
  kFormatted = 6,
  kDrawn = 7
};

class ParagraphImpl;
class ParagraphCacheKey;
class ParagraphCacheValue;

class ParagraphCache {
public:
    ParagraphCache();
    ~ParagraphCache();

    void abandon();
    void reset();
    bool updateParagraph(ParagraphImpl* paragraph);
    bool findParagraph(ParagraphImpl* paragraph);

    // For testing
    void setChecker(std::function<void(ParagraphImpl* impl, const char*, bool)> checker) {
        fChecker = std::move(checker);
    }
    void printStatistics();
    void turnOn(bool value) { fCacheIsOn = value; }
    int count() { return fLRUCacheMap.count(); }

    bool isPossiblyTextEditing(ParagraphImpl* paragraph);

 private:

    struct Entry;
    void updateFrom(const ParagraphImpl* paragraph, Entry* entry);
    void updateTo(ParagraphImpl* paragraph, const Entry* entry);

     mutable SkMutex fParagraphMutex;
     std::function<void(ParagraphImpl* impl, const char*, bool)> fChecker;

    static const int kMaxEntries = 128;

    struct KeyHash {
        uint32_t operator()(const ParagraphCacheKey& key) const;
    };

    SkLRUCache<ParagraphCacheKey, std::unique_ptr<Entry>, KeyHash> fLRUCacheMap;
    bool fCacheIsOn;
    ParagraphCacheValue* fLastCachedValue;

#ifdef PARAGRAPH_CACHE_STATS
    int fTotalRequests;
    int fCacheMisses;
    int fHashMisses; // cache hit but hash table missed
#endif
};

}  // namespace textlayout
}  // namespace skia

#endif  // ParagraphCache_DEFINED
