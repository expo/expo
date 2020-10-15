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

#include <folly/synchronization/Hazptr-fwd.h>
#include <folly/synchronization/HazptrObj.h>
#include <folly/synchronization/HazptrRec.h>
#include <folly/synchronization/HazptrThrLocal.h>

#include <folly/Memory.h>
#include <folly/Portability.h>
#include <folly/executors/QueuedImmediateExecutor.h>
#include <folly/synchronization/AsymmetricMemoryBarrier.h>

#include <atomic>
#include <unordered_set> // for hash set in bulk_reclaim

///
/// Classes related to hazard pointer domains.
///

namespace folly {

namespace detail {

constexpr int hazptr_domain_rcount_threshold() {
  return 1000;
}

} // namespace detail

/**
 *  hazptr_domain
 *
 *  A domain manages a set of hazard pointers and a set of retired objects.
 *
 *  Most user code need not specify any domains.
 *
 *  Notes on destruction order, tagged objects, locking and deadlock
 *  avoidance:
 *  - Tagged objects support reclamation order guarantees. A call to
 *    cleanup_cohort_tag(tag) guarantees that all objects with the
 *    specified tag are reclaimed before the function returns.
 *  - Due to the strict order, access to the set of tagged objects
 *    needs synchronization and care must be taken to avoid deadlock.
 *  - There are two types of reclamation operations to consider:
 *   - Type A: A Type A reclamation operation is triggered by meeting
 *     some threshold. Reclaimed objects may have different
 *     tags. Hazard pointers are checked and only unprotected objects
 *     are reclaimed. This type is expected to be expensive but
 *     infrequent and the cost is amortized over a large number of
 *     reclaimed objects. This type is needed to guarantee an upper
 *     bound on unreclaimed reclaimable objects.
 *   - Type B: A Type B reclamation operation is triggered by a call
 *     to the function cleanup_cohort_tag for a specific tag. All
 *     objects with the specified tag must be reclaimed
 *     unconditionally before returning from such a function
 *     call. Hazard pointers are not checked. This type of reclamation
 *     operation is expected to be inexpensive and may be invoked more
 *     frequently than Type A.
 *  - Tagged retired objects are kept in a single list in the domain
 *    structure, named tagged_.
 *  - Both Type A and Type B of reclamation pop all the objects in
 *    tagged_ and sort them into two sets of reclaimable and
 *    unreclaimable objects. The objects in the reclaimable set are
 *    reclaimed and the objects in the unreclaimable set are pushed
 *    back in tagged_.
 *  - The tagged_ list is locked between popping all objects and
 *    pushing back unreclaimable objects, in order to guarantee that
 *    Type B operations do not miss any objects that match the
 *    specified tag.
 *  - A Type A operation cannot release the lock on the tagged_ list
 *    before reclaiming reclaimable objects, to prevent concurrent
 *    Type B operations from returning before the reclamation of
 *    objects with matching tags.
 *  - A Type B operation can release the lock on tagged_ before
 *    reclaiming objects because the set of reclaimable objects by
 *    Type B operations are disjoint.
 *  - The lock on the tagged_ list is re-entrant, to prevent deadlock
 *    when reclamation in a Type A operation requires a Type B
 *    reclamation operation to complete.
 *  - The implementation allows only one pattern of re-entrance: An
 *    inner Type B inside an outer Type A.
 *  - An inner Type B operation must have access and ability to modify
 *    the outer Type A operation's set of reclaimable objects and
 *    their children objects in order not to miss objects that match
 *    the specified tag. Hence, Type A operations use data members,
 *    unprotected_ and children_, to keep track of these objects
 *    between reclamation steps and to provide inner Type B operations
 *    access to these objects.
 */
template <template <typename> class Atom>
class hazptr_domain {
  using Obj = hazptr_obj<Atom>;
  using ObjList = hazptr_obj_list<Atom>;
  using RetiredList = hazptr_obj_retired_list<Atom>;
  using Set = std::unordered_set<const void*>;
  using ExecFn = folly::Executor* (*)();

  static constexpr int kThreshold = detail::hazptr_domain_rcount_threshold();
  static constexpr int kMultiplier = 2;
  static constexpr uint64_t kSyncTimePeriod{2000000000}; // nanoseconds
  static constexpr uintptr_t kTagBit = hazptr_obj<Atom>::kTagBit;

  static folly::Executor* get_default_executor() {
    return &folly::QueuedImmediateExecutor::instance();
  }

  Atom<hazptr_rec<Atom>*> hazptrs_{nullptr};
  Atom<hazptr_obj<Atom>*> retired_{nullptr};
  Atom<uint64_t> sync_time_{0};
  /* Using signed int for rcount_ because it may transiently be negative.
     Using signed int for all integer variables that may be involved in
     calculations related to the value of rcount_. */
  Atom<int> hcount_{0};
  Atom<int> rcount_{0};
  Atom<uint16_t> num_bulk_reclaims_{0};
  bool shutdown_{false};
  RetiredList untagged_;
  RetiredList tagged_;
  Obj* unprotected_; // List of unprotected objects being reclaimed
  ObjList children_; // Children of unprotected objects being reclaimed
  Atom<uint64_t> tagged_sync_time_{0};
  Atom<uint64_t> untagged_sync_time_{0};
  Atom<ExecFn> exec_fn_{nullptr};
  Atom<int> exec_backlog_{0};

 public:
  /** Constructor */
  hazptr_domain() = default;

  /** Destructor */
  ~hazptr_domain() {
    shutdown_ = true;
    reclaim_all_objects();
    free_hazptr_recs();
    DCHECK(tagged_.empty());
  }

  hazptr_domain(const hazptr_domain&) = delete;
  hazptr_domain(hazptr_domain&&) = delete;
  hazptr_domain& operator=(const hazptr_domain&) = delete;
  hazptr_domain& operator=(hazptr_domain&&) = delete;

  void set_executor(ExecFn exfn) {
    exec_fn_.store(exfn, std::memory_order_release);
  }

  void clear_executor() {
    exec_fn_.store(nullptr, std::memory_order_release);
  }

  /** retire - nonintrusive - allocates memory */
  template <typename T, typename D = std::default_delete<T>>
  void retire(T* obj, D reclaim = {}) {
    struct hazptr_retire_node : hazptr_obj<Atom> {
      std::unique_ptr<T, D> obj_;
      hazptr_retire_node(T* retireObj, D toReclaim)
          : obj_{retireObj, std::move(toReclaim)} {}
    };

    auto node = new hazptr_retire_node(obj, std::move(reclaim));
    node->reclaim_ = [](hazptr_obj<Atom>* p, hazptr_obj_list<Atom>&) {
      delete static_cast<hazptr_retire_node*>(p);
    };
    hazptr_obj_list<Atom> l(node);
    push_retired(l);
  }

  /** cleanup */
  void cleanup() noexcept {
    relaxed_cleanup();
    wait_for_zero_bulk_reclaims(); // wait for concurrent bulk_reclaim-s
  }

  /** cleanup_cohort_tag */
  void cleanup_cohort_tag(const hazptr_obj_cohort<Atom>* cohort) noexcept {
    auto tag = reinterpret_cast<uintptr_t>(cohort) + kTagBit;
    auto obj = tagged_.pop_all(RetiredList::kAlsoLock);
    ObjList match, nomatch;
    list_match_tag(tag, obj, match, nomatch);
    if (unprotected_) { // There must be ongoing do_reclamation
      ObjList match2, nomatch2;
      list_match_tag(tag, unprotected_, match2, nomatch2);
      match.splice(match2);
      unprotected_ = nomatch2.head();
    }
    if (children_.head()) {
      ObjList match2, nomatch2;
      list_match_tag(tag, children_.head(), match2, nomatch2);
      match.splice(match2);
      children_ = std::move(nomatch2);
    }
    auto count = nomatch.count();
    nomatch.set_count(0);
    tagged_.push_unlock(nomatch);
    obj = match.head();
    reclaim_list_transitive(obj);
    if (count >= threshold()) {
      check_threshold_and_reclaim(
          tagged_, RetiredList::kAlsoLock, tagged_sync_time_);
    }
  }

  void
  list_match_tag(uintptr_t tag, Obj* obj, ObjList& match, ObjList& nomatch) {
    list_match_condition(
        obj, match, nomatch, [tag](Obj* o) { return o->cohort_tag() == tag; });
  }

 private:
  using hazptr_rec_alloc = AlignedSysAllocator<
      hazptr_rec<Atom>,
      FixedAlign<alignof(hazptr_rec<Atom>)>>;

  friend void hazptr_domain_push_list<Atom>(
      hazptr_obj_list<Atom>&,
      hazptr_domain<Atom>&) noexcept;
  friend void hazptr_domain_push_retired<Atom>(
      hazptr_obj_list<Atom>&,
      bool check,
      hazptr_domain<Atom>&) noexcept;
  friend class hazptr_holder<Atom>;
  friend class hazptr_obj<Atom>;
  friend class hazptr_obj_cohort<Atom>;
#if FOLLY_HAZPTR_THR_LOCAL
  friend class hazptr_tc<Atom>;
#endif

  /** hprec_acquire */
  hazptr_rec<Atom>* hprec_acquire() {
    auto rec = try_acquire_existing_hprec();
    return rec != nullptr ? rec : acquire_new_hprec();
  }

  /** hprec_release */
  void hprec_release(hazptr_rec<Atom>* hprec) noexcept {
    hprec->release();
  }

  /** push_retired */
  void push_retired(hazptr_obj_list<Atom>& l, bool check = true) {
    /*** Full fence ***/ asymmetricLightBarrier();
    while (true) {
      auto r = retired();
      l.tail()->set_next(r);
      if (retired_.compare_exchange_weak(
              r,
              l.head(),
              std::memory_order_release,
              std::memory_order_acquire)) {
        break;
      }
    }
    rcount_.fetch_add(l.count(), std::memory_order_release);
    if (check) {
      check_cleanup_and_reclaim();
    }
  }

  /** push_list */
  void push_list(ObjList& l) {
    if (l.empty()) {
      return;
    }
    uintptr_t btag = l.head()->cohort_tag();
    bool tagged = ((btag & kTagBit) == kTagBit);
    RetiredList& rlist = tagged ? tagged_ : untagged_;
    Atom<uint64_t>& sync_time =
        tagged ? tagged_sync_time_ : untagged_sync_time_;
    /*** Full fence ***/ asymmetricLightBarrier();
    /* Only tagged lists need to be locked because tagging is used to
     * guarantee the identification of all objects with a specific
     * tag. Locking protects against concurrent hazptr_cleanup_tag()
     * calls missing tagged objects. */
    bool lock =
        tagged ? RetiredList::kMayBeLocked : RetiredList::kMayNotBeLocked;
    rlist.push(l, lock);
    check_threshold_and_reclaim(rlist, lock, sync_time);
  }

  /** threshold */
  int threshold() {
    auto thresh = kThreshold;
    return std::max(thresh, kMultiplier * hcount());
  }

  /** check_threshold_and_reclaim */
  void check_threshold_and_reclaim(
      RetiredList& rlist,
      bool lock,
      Atom<uint64_t>& sync_time) {
    if (!(lock && rlist.check_lock()) &&
        (rlist.check_threshold_try_zero_count(threshold()) ||
         check_sync_time(sync_time))) {
      if (std::is_same<Atom<int>, std::atomic<int>>{} &&
          this == &default_hazptr_domain<Atom>() &&
          FLAGS_folly_hazptr_use_executor) {
        invoke_reclamation_in_executor(rlist, lock);
      } else {
        do_reclamation(rlist, lock);
      }
    }
  }

  /** check_sync_time_and_reclaim **/
  void check_sync_time_and_reclaim() {
    if (!tagged_.check_lock() && check_sync_time()) {
      do_reclamation(tagged_, RetiredList::kAlsoLock);
      do_reclamation(untagged_, RetiredList::kDontLock);
    }
  }

  /** do_reclamation */
  void do_reclamation(RetiredList& rlist, bool lock) {
    auto obj = rlist.pop_all(lock == RetiredList::kAlsoLock);
    if (!obj) {
      if (lock) {
        ObjList l;
        rlist.push_unlock(l);
      }
      return;
    }
    /*** Full fence ***/ asymmetricHeavyBarrier(AMBFlags::EXPEDITED);
    auto hprec = hazptrs_.load(std::memory_order_acquire);
    /* Read hazard pointer values into private search structure */
    Set hs;
    for (; hprec; hprec = hprec->next()) {
      hs.insert(hprec->hazptr());
    }
    /* Check objects against hazard pointer values */
    ObjList match, nomatch;
    list_match_condition(obj, match, nomatch, [&](Obj* o) {
      return hs.count(o->raw_ptr()) > 0;
    });
    /* Reclaim unprotected objects and push back protected objects and
       children of reclaimed objects */
    if (lock) {
      unprotected_ = nomatch.head();
      DCHECK(children_.empty());
      reclaim_unprotected_safe();
      match.splice(children_);
      rlist.push_unlock(match);
    } else {
      ObjList children;
      reclaim_unprotected_unsafe(nomatch.head(), children);
      match.splice(children);
      rlist.push(match, false);
    }
  }

  /** lookup_and_reclaim */
  void lookup_and_reclaim(Obj* obj, const Set& hs, ObjList& keep) {
    while (obj) {
      auto next = obj->next();
      DCHECK_NE(obj, next);
      if (hs.count(obj->raw_ptr()) == 0) {
        (*(obj->reclaim()))(obj, keep);
      } else {
        keep.push(obj);
      }
      obj = next;
    }
  }

  /** list_match_condition */
  template <typename Cond>
  void list_match_condition(
      Obj* obj,
      ObjList& match,
      ObjList& nomatch,
      const Cond& cond) {
    while (obj) {
      auto next = obj->next();
      DCHECK_NE(obj, next);
      if (cond(obj)) {
        match.push(obj);
      } else {
        nomatch.push(obj);
      }
      obj = next;
    }
  }

  /** reclaim_unprotected_safe */
  void reclaim_unprotected_safe() {
    while (unprotected_) {
      auto obj = unprotected_;
      unprotected_ = obj->next();
      (*(obj->reclaim()))(obj, children_);
    }
  }

  /** reclaim_unprotected_unsafe */
  void reclaim_unprotected_unsafe(Obj* obj, ObjList& children) {
    while (obj) {
      auto next = obj->next();
      (*(obj->reclaim()))(obj, children);
      obj = next;
    }
  }

  /** reclaim_unconditional */
  void reclaim_unconditional(Obj* head, ObjList& children) {
    while (head) {
      auto next = head->next();
      (*(head->reclaim()))(head, children);
      head = next;
    }
  }

  hazptr_rec<Atom>* head() const noexcept {
    return hazptrs_.load(std::memory_order_acquire);
  }

  hazptr_obj<Atom>* retired() const noexcept {
    return retired_.load(std::memory_order_acquire);
  }

  int hcount() const noexcept {
    return hcount_.load(std::memory_order_acquire);
  }

  int rcount() const noexcept {
    return rcount_.load(std::memory_order_acquire);
  }

  bool reached_threshold(int rc, int hc) const noexcept {
    return rc >= kThreshold && rc >= kMultiplier * hc;
  }

  void reclaim_all_objects() {
    auto head = retired_.exchange(nullptr);
    reclaim_list_transitive(head);
    head = untagged_.pop_all(RetiredList::kDontLock);
    reclaim_list_transitive(head);
  }

  void reclaim_list_transitive(Obj* head) {
    while (head) {
      ObjList children;
      reclaim_unconditional(head, children);
      head = children.head();
    }
  }

  void free_hazptr_recs() {
    /* Leak the hazard pointers for the default domain to avoid
       destruction order issues with thread caches.  */
    if (this == &default_hazptr_domain<Atom>()) {
      return;
    }
    auto rec = head();
    while (rec) {
      auto next = rec->next();
      DCHECK(!rec->active());
      rec->~hazptr_rec<Atom>();
      hazptr_rec_alloc{}.deallocate(rec, 1);
      rec = next;
    }
  }

  void check_cleanup_and_reclaim() {
    if (try_timed_cleanup()) {
      return;
    }
    if (reached_threshold(rcount(), hcount())) {
      try_bulk_reclaim();
    }
  }

  void relaxed_cleanup() noexcept {
#if FOLLY_HAZPTR_THR_LOCAL
    hazptr_obj<Atom>* h = nullptr;
    hazptr_obj<Atom>* t = nullptr;
    for (hazptr_priv<Atom>& priv :
         hazptr_priv_singleton<Atom>::accessAllThreads()) {
      priv.collect(h, t);
    }
    if (h) {
      DCHECK(t);
      hazptr_obj_list<Atom> l(h, t, 0);
      push_retired(l);
    }
#endif
    rcount_.store(0, std::memory_order_release);
    bulk_reclaim(true);
  }

  void wait_for_zero_bulk_reclaims() {
    while (num_bulk_reclaims_.load(std::memory_order_acquire) > 0) {
      std::this_thread::yield();
    }
  }

  void try_bulk_reclaim() {
    auto hc = hcount();
    auto rc = rcount();
    if (!reached_threshold(rc, hc)) {
      return;
    }
    rc = rcount_.exchange(0, std::memory_order_release);
    if (!reached_threshold(rc, hc)) {
      /* No need to add rc back to rcount_. At least one concurrent
         try_bulk_reclaim will proceed to bulk_reclaim. */
      return;
    }
    bulk_reclaim();
  }

  void bulk_reclaim(bool transitive = false) {
    num_bulk_reclaims_.fetch_add(1, std::memory_order_acquire);
    while (true) {
      auto obj = retired_.exchange(nullptr, std::memory_order_acquire);
      /*** Full fence ***/ asymmetricHeavyBarrier(AMBFlags::EXPEDITED);
      auto rec = hazptrs_.load(std::memory_order_acquire);
      /* Part 1 - read hazard pointer values into private search structure */
      std::unordered_set<const void*> hashset; // TOTO: lock-free fixed hash set
      for (; rec; rec = rec->next()) {
        hashset.insert(rec->hazptr());
      }
      /* Part 2 - for each retired object, reclaim if no match */
      if (bulk_lookup_and_reclaim(obj, hashset) || !transitive) {
        break;
      }
    }
    num_bulk_reclaims_.fetch_sub(1, std::memory_order_release);
  }

  bool bulk_lookup_and_reclaim(
      hazptr_obj<Atom>* obj,
      const std::unordered_set<const void*>& hashset) {
    hazptr_obj_list<Atom> children;
    hazptr_obj_list<Atom> matched;
    while (obj) {
      auto next = obj->next();
      DCHECK_NE(obj, next);
      if (hashset.count(obj->raw_ptr()) == 0) {
        (*(obj->reclaim()))(obj, children);
      } else {
        matched.push(obj);
      }
      obj = next;
    }
#if FOLLY_HAZPTR_THR_LOCAL
    if (!shutdown_) {
      hazptr_priv_tls<Atom>().push_all_to_domain(false);
    }
#endif
    bool done = ((children.count() == 0) && (retired() == nullptr));
    matched.splice(children);
    if (matched.count() > 0) {
      push_retired(matched, false /* don't call bulk_reclaim recursively */);
    }
    return done;
  }

  bool check_sync_time(Atom<uint64_t>& sync_time) {
    uint64_t time = std::chrono::duration_cast<std::chrono::nanoseconds>(
                        std::chrono::steady_clock::now().time_since_epoch())
                        .count();
    auto prevtime = sync_time.load(std::memory_order_relaxed);
    if (time < prevtime ||
        !sync_time.compare_exchange_strong(
            prevtime, time + kSyncTimePeriod, std::memory_order_relaxed)) {
      return false;
    }
    return true;
  }

  bool try_timed_cleanup() {
    if (!check_sync_time(sync_time_)) {
      return false;
    }
    relaxed_cleanup(); // calling regular cleanup may self deadlock
    return true;
  }

  hazptr_rec<Atom>* try_acquire_existing_hprec() {
    auto rec = head();
    while (rec) {
      auto next = rec->next();
      if (rec->try_acquire()) {
        return rec;
      }
      rec = next;
    }
    return nullptr;
  }

  hazptr_rec<Atom>* acquire_new_hprec() {
    auto rec = hazptr_rec_alloc{}.allocate(1);
    new (rec) hazptr_rec<Atom>();
    rec->set_active();
    rec->set_domain(this);
    while (true) {
      auto h = head();
      rec->set_next(h);
      if (hazptrs_.compare_exchange_weak(
              h, rec, std::memory_order_release, std::memory_order_acquire)) {
        break;
      }
    }
    hcount_.fetch_add(1);
    return rec;
  }

  void invoke_reclamation_in_executor(RetiredList& rlist, bool lock) {
    auto fn = exec_fn_.load(std::memory_order_acquire);
    auto ex = fn ? fn() : get_default_executor();
    auto backlog = exec_backlog_.fetch_add(1, std::memory_order_relaxed);
    if (ex) {
      ex->add([this, &rlist, lock] {
        exec_backlog_.store(0, std::memory_order_relaxed);
        do_reclamation(rlist, lock);
      });
    } else {
      LOG(INFO) << "Skip asynchronous reclamation by hazptr executor";
    }
    if (backlog >= 10) {
      LOG(WARNING) << backlog
                   << " request backlog for hazptr reclamation executora";
    }
  }
}; // hazptr_domain

/**
 *  Free functions related to hazptr domains
 */

/** default_hazptr_domain: Returns reference to the default domain */

template <template <typename> class Atom>
struct hazptr_default_domain_helper {
  static FOLLY_ALWAYS_INLINE hazptr_domain<Atom>& get() {
    static hazptr_domain<Atom> domain;
    return domain;
  }
};

template <>
struct hazptr_default_domain_helper<std::atomic> {
  static FOLLY_ALWAYS_INLINE hazptr_domain<std::atomic>& get() {
    return default_domain;
  }
};

template <template <typename> class Atom>
FOLLY_ALWAYS_INLINE hazptr_domain<Atom>& default_hazptr_domain() {
  return hazptr_default_domain_helper<Atom>::get();
}

/** hazptr_domain_push_retired: push a list of retired objects into a domain */
template <template <typename> class Atom>
void hazptr_domain_push_retired(
    hazptr_obj_list<Atom>& l,
    bool check,
    hazptr_domain<Atom>& domain) noexcept {
  domain.push_retired(l, check);
}

/** hazptr_domain_push_list */
template <template <typename> class Atom>
void hazptr_domain_push_list(
    hazptr_obj_list<Atom>& l,
    hazptr_domain<Atom>& domain) noexcept {
  domain.push_list(l);
}

/** hazptr_retire */
template <template <typename> class Atom, typename T, typename D>
FOLLY_ALWAYS_INLINE void hazptr_retire(T* obj, D reclaim) {
  default_hazptr_domain<Atom>().retire(obj, std::move(reclaim));
}

/** hazptr_cleanup: Reclaims all reclaimable objects retired to the domain */
template <template <typename> class Atom>
void hazptr_cleanup(hazptr_domain<Atom>& domain) noexcept {
  domain.cleanup();
}

} // namespace folly
