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

/*
 * This header defines two classes that very nearly model
 * AssociativeContainer (but not quite).  These implement set-like and
 * map-like behavior on top of a sorted vector, instead of using
 * rb-trees like std::set and std::map.
 *
 * This is potentially useful in cases where the number of elements in
 * the set or map is small, or when you want to avoid using more
 * memory than necessary and insertions/deletions are much more rare
 * than lookups (these classes have O(N) insertions/deletions).
 *
 * In the interest of using these in conditions where the goal is to
 * minimize memory usage, they support a GrowthPolicy parameter, which
 * is a class defining a single function called increase_capacity,
 * which will be called whenever we are about to insert something: you
 * can then decide to call reserve() based on the current capacity()
 * and size() of the passed in vector-esque Container type.  An
 * example growth policy that grows one element at a time:
 *
 *    struct OneAtATimePolicy {
 *      template <class Container>
 *      void increase_capacity(Container& c) {
 *        if (c.size() == c.capacity()) {
 *          c.reserve(c.size() + 1);
 *        }
 *      }
 *    };
 *
 *    typedef sorted_vector_set<int,
 *                              std::less<int>,
 *                              std::allocator<int>,
 *                              OneAtATimePolicy>
 *            OneAtATimeIntSet;
 *
 * Important differences from std::set and std::map:
 *   - insert() and erase() invalidate iterators and references.
       erase(iterator) returns an iterator pointing to the next valid element.
 *   - insert() and erase() are O(N)
 *   - our iterators model RandomAccessIterator
 *   - sorted_vector_map::value_type is pair<K,V>, not pair<const K,V>.
 *     (This is basically because we want to store the value_type in
 *     std::vector<>, which requires it to be Assignable.)
 *   - insert() single key variants, emplace(), and emplace_hint() only provide
 *     the strong exception guarantee (unchanged when exception is thrown) when
 *     std::is_nothrow_move_constructible<value_type>::value is true.
 */

#pragma once

#include <algorithm>
#include <cassert>
#include <initializer_list>
#include <iterator>
#include <memory>
#include <stdexcept>
#include <type_traits>
#include <utility>
#include <vector>

#include <folly/ScopeGuard.h>
#include <folly/Traits.h>
#include <folly/Utility.h>
#include <folly/lang/Exception.h>
#include <folly/memory/MemoryResource.h>

namespace folly {

//////////////////////////////////////////////////////////////////////

namespace detail {

template <typename, typename Compare, typename Key, typename T>
struct sorted_vector_enable_if_is_transparent {};

template <typename Compare, typename Key, typename T>
struct sorted_vector_enable_if_is_transparent<
    void_t<typename Compare::is_transparent>,
    Compare,
    Key,
    T> {
  using type = T;
};

// This wrapper goes around a GrowthPolicy and provides iterator
// preservation semantics, but only if the growth policy is not the
// default (i.e. nothing).
template <class Policy>
struct growth_policy_wrapper : private Policy {
  template <class Container, class Iterator>
  Iterator increase_capacity(Container& c, Iterator desired_insertion) {
    typedef typename Container::difference_type diff_t;
    diff_t d = desired_insertion - c.begin();
    Policy::increase_capacity(c);
    return c.begin() + d;
  }
};
template <>
struct growth_policy_wrapper<void> {
  template <class Container, class Iterator>
  Iterator increase_capacity(Container&, Iterator it) {
    return it;
  }
};

/*
 * This helper returns the distance between two iterators if it is
 * possible to figure it out without messing up the range
 * (i.e. unless they are InputIterators).  Otherwise this returns
 * -1.
 */
template <class Iterator>
int distance_if_multipass(Iterator first, Iterator last) {
  typedef typename std::iterator_traits<Iterator>::iterator_category categ;
  if (std::is_same<categ, std::input_iterator_tag>::value) {
    return -1;
  }
  return std::distance(first, last);
}

template <class OurContainer, class Vector, class GrowthPolicy, class Value>
typename OurContainer::iterator insert_with_hint(
    OurContainer& sorted,
    Vector& cont,
    typename OurContainer::const_iterator hint,
    Value&& value,
    GrowthPolicy& po) {
  const typename OurContainer::value_compare& cmp(sorted.value_comp());
  if (hint == cont.end() || cmp(value, *hint)) {
    if (hint == cont.begin() || cmp(*(hint - 1), value)) {
      hint = po.increase_capacity(cont, hint);
      return cont.insert(hint, std::forward<Value>(value));
    } else {
      return sorted.insert(std::forward<Value>(value)).first;
    }
  }

  if (cmp(*hint, value)) {
    if (hint + 1 == cont.end() || cmp(value, *(hint + 1))) {
      hint = po.increase_capacity(cont, hint + 1);
      return cont.insert(hint, std::forward<Value>(value));
    } else {
      return sorted.insert(std::forward<Value>(value)).first;
    }
  }

  // Value and *hint did not compare, so they are equal keys.
  return sorted.begin() + std::distance(sorted.cbegin(), hint);
}

template <class OurContainer, class Vector, class InputIterator>
void bulk_insert(
    OurContainer& sorted,
    Vector& cont,
    InputIterator first,
    InputIterator last) {
  // prevent deref of middle where middle == cont.end()
  if (first == last) {
    return;
  }

  auto const& cmp(sorted.value_comp());

  int const d = distance_if_multipass(first, last);
  if (d != -1) {
    cont.reserve(cont.size() + d);
  }
  auto const prev_size = cont.size();

  std::copy(first, last, std::back_inserter(cont));
  auto const middle = cont.begin() + prev_size;
  if (!std::is_sorted(middle, cont.end(), cmp)) {
    std::sort(middle, cont.end(), cmp);
  }
  if (middle != cont.begin() && !cmp(*(middle - 1), *middle)) {
    std::inplace_merge(cont.begin(), middle, cont.end(), cmp);
  }
  cont.erase(
      std::unique(
          cont.begin(),
          cont.end(),
          [&](typename OurContainer::value_type const& a,
              typename OurContainer::value_type const& b) {
            return !cmp(a, b) && !cmp(b, a);
          }),
      cont.end());
}

template <typename Container, typename Compare>
bool is_sorted_unique(Container const& container, Compare const& comp) {
  if (container.empty()) {
    return true;
  }
  auto const e = container.end();
  for (auto a = container.begin(), b = std::next(a); b != e; ++a, ++b) {
    if (!comp(*a, *b)) {
      return false;
    }
  }
  return true;
}

template <typename Container, typename Compare>
Container&& as_sorted_unique(Container&& container, Compare const& comp) {
  std::sort(container.begin(), container.end(), comp);
  container.erase(
      std::unique(
          container.begin(),
          container.end(),
          [&](auto const& a, auto const& b) {
            return !comp(a, b) && !comp(b, a);
          }),
      container.end());
  return static_cast<Container&&>(container);
}
} // namespace detail

//////////////////////////////////////////////////////////////////////

/**
 * A sorted_vector_set is a container similar to std::set<>, but
 * implemented as a sorted array with std::vector<>.
 *
 * @param class T               Data type to store
 * @param class Compare         Comparison function that imposes a
 *                              strict weak ordering over instances of T
 * @param class Allocator       allocation policy
 * @param class GrowthPolicy    policy object to control growth
 *
 * @author Aditya Agarwal <aditya@fb.com>
 * @author Akhil Wable    <akhil@fb.com>
 * @author Jordan DeLong  <delong.j@fb.com>
 */
template <
    class T,
    class Compare = std::less<T>,
    class Allocator = std::allocator<T>,
    class GrowthPolicy = void,
    class Container = std::vector<T, Allocator>>
class sorted_vector_set : detail::growth_policy_wrapper<GrowthPolicy> {
  detail::growth_policy_wrapper<GrowthPolicy>& get_growth_policy() {
    return *this;
  }

  template <typename K, typename V, typename C = Compare>
  using if_is_transparent =
      _t<detail::sorted_vector_enable_if_is_transparent<void, C, K, V>>;

  struct EBO;

 public:
  typedef T value_type;
  typedef T key_type;
  typedef Compare key_compare;
  typedef Compare value_compare;
  typedef Allocator allocator_type;
  typedef Container container_type;

  typedef typename Container::pointer pointer;
  typedef typename Container::reference reference;
  typedef typename Container::const_reference const_reference;
  /*
   * XXX: Our normal iterator ought to also be a constant iterator
   * (cf. Defect Report 103 for std::set), but this is a bit more of a
   * pain.
   */
  typedef typename Container::iterator iterator;
  typedef typename Container::const_iterator const_iterator;
  typedef typename Container::difference_type difference_type;
  typedef typename Container::size_type size_type;
  typedef typename Container::reverse_iterator reverse_iterator;
  typedef typename Container::const_reverse_iterator const_reverse_iterator;

  sorted_vector_set() : m_(Compare(), Allocator()) {}

  sorted_vector_set(const sorted_vector_set&) = default;

  sorted_vector_set(const sorted_vector_set& other, const Allocator& alloc)
      : m_(other.m_, alloc) {}

  sorted_vector_set(sorted_vector_set&&) = default;

  sorted_vector_set(sorted_vector_set&& other, const Allocator& alloc) noexcept(
      std::is_nothrow_constructible<EBO, EBO&&, const Allocator&>::value)
      : m_(std::move(other.m_), alloc) {}

  explicit sorted_vector_set(const Allocator& alloc) : m_(Compare(), alloc) {}

  explicit sorted_vector_set(
      const Compare& comp,
      const Allocator& alloc = Allocator())
      : m_(comp, alloc) {}

  template <class InputIterator>
  sorted_vector_set(
      InputIterator first,
      InputIterator last,
      const Compare& comp = Compare(),
      const Allocator& alloc = Allocator())
      : m_(comp, alloc) {
    // This is linear if [first, last) is already sorted (and if we
    // can figure out the distance between the two iterators).
    insert(first, last);
  }

  template <class InputIterator>
  sorted_vector_set(
      InputIterator first,
      InputIterator last,
      const Allocator& alloc)
      : m_(Compare(), alloc) {
    // This is linear if [first, last) is already sorted (and if we
    // can figure out the distance between the two iterators).
    insert(first, last);
  }

  /* implicit */ sorted_vector_set(
      std::initializer_list<value_type> list,
      const Compare& comp = Compare(),
      const Allocator& alloc = Allocator())
      : m_(comp, alloc) {
    insert(list.begin(), list.end());
  }

  sorted_vector_set(
      std::initializer_list<value_type> list,
      const Allocator& alloc)
      : m_(Compare(), alloc) {
    insert(list.begin(), list.end());
  }

  // Construct a sorted_vector_set by stealing the storage of a prefilled
  // container. The container need not be sorted already. This supports
  // bulk construction of sorted_vector_set with zero allocations, not counting
  // those performed by the caller. (The iterator range constructor performs at
  // least one allocation).
  //
  // Note that `sorted_vector_set(const Container& container)` is not provided,
  // since the purpose of this constructor is to avoid an unnecessary copy.
  explicit sorted_vector_set(
      Container&& container,
      const Compare& comp = Compare())
      : sorted_vector_set(
            sorted_unique,
            detail::as_sorted_unique(std::move(container), comp),
            comp) {}

  // Construct a sorted_vector_set by stealing the storage of a prefilled
  // container. Its elements must be sorted and unique, as sorted_unique_t
  // hints. Supports bulk construction of sorted_vector_set with zero
  // allocations, not counting those performed by the caller. (The iterator
  // range constructor performs at least one allocation).
  //
  // Note that `sorted_vector_set(sorted_unique_t, const Container& container)`
  // is not provided, since the purpose of this constructor is to avoid an extra
  // copy.
  sorted_vector_set(
      sorted_unique_t,
      Container&& container,
      const Compare& comp = Compare()) noexcept(std::
                                                    is_nothrow_constructible<
                                                        EBO,
                                                        const Compare&,
                                                        Container&&>::value)
      : m_(comp, std::move(container)) {
    assert(detail::is_sorted_unique(m_.cont_, value_comp()));
  }

  Allocator get_allocator() const {
    return m_.cont_.get_allocator();
  }

  sorted_vector_set& operator=(const sorted_vector_set& other) = default;

  sorted_vector_set& operator=(sorted_vector_set&& other) = default;

  sorted_vector_set& operator=(std::initializer_list<value_type> ilist) {
    clear();
    insert(ilist.begin(), ilist.end());
    return *this;
  }

  key_compare key_comp() const {
    return m_;
  }
  value_compare value_comp() const {
    return m_;
  }

  iterator begin() {
    return m_.cont_.begin();
  }
  iterator end() {
    return m_.cont_.end();
  }
  const_iterator cbegin() const {
    return m_.cont_.cbegin();
  }
  const_iterator begin() const {
    return m_.cont_.begin();
  }
  const_iterator cend() const {
    return m_.cont_.cend();
  }
  const_iterator end() const {
    return m_.cont_.end();
  }
  reverse_iterator rbegin() {
    return m_.cont_.rbegin();
  }
  reverse_iterator rend() {
    return m_.cont_.rend();
  }
  const_reverse_iterator rbegin() const {
    return m_.cont_.rbegin();
  }
  const_reverse_iterator rend() const {
    return m_.cont_.rend();
  }

  void clear() {
    return m_.cont_.clear();
  }
  size_type size() const {
    return m_.cont_.size();
  }
  size_type max_size() const {
    return m_.cont_.max_size();
  }
  bool empty() const {
    return m_.cont_.empty();
  }
  void reserve(size_type s) {
    return m_.cont_.reserve(s);
  }
  void shrink_to_fit() {
    m_.cont_.shrink_to_fit();
  }
  size_type capacity() const {
    return m_.cont_.capacity();
  }

  std::pair<iterator, bool> insert(const value_type& value) {
    iterator it = lower_bound(value);
    if (it == end() || value_comp()(value, *it)) {
      it = get_growth_policy().increase_capacity(m_.cont_, it);
      return std::make_pair(m_.cont_.insert(it, value), true);
    }
    return std::make_pair(it, false);
  }

  std::pair<iterator, bool> insert(value_type&& value) {
    iterator it = lower_bound(value);
    if (it == end() || value_comp()(value, *it)) {
      it = get_growth_policy().increase_capacity(m_.cont_, it);
      return std::make_pair(m_.cont_.insert(it, std::move(value)), true);
    }
    return std::make_pair(it, false);
  }

  iterator insert(const_iterator hint, const value_type& value) {
    return detail::insert_with_hint(
        *this, m_.cont_, hint, value, get_growth_policy());
  }

  iterator insert(const_iterator hint, value_type&& value) {
    return detail::insert_with_hint(
        *this, m_.cont_, hint, std::move(value), get_growth_policy());
  }

  template <class InputIterator>
  void insert(InputIterator first, InputIterator last) {
    detail::bulk_insert(*this, m_.cont_, first, last);
  }

  void insert(std::initializer_list<value_type> ilist) {
    insert(ilist.begin(), ilist.end());
  }

  // emplace isn't better than insert for sorted_vector_set, but aids
  // compatibility
  template <typename... Args>
  std::pair<iterator, bool> emplace(Args&&... args) {
    std::aligned_storage_t<sizeof(value_type), alignof(value_type)> b;
    value_type* p = static_cast<value_type*>(static_cast<void*>(&b));
    auto a = get_allocator();
    std::allocator_traits<allocator_type>::construct(
        a, p, std::forward<Args>(args)...);
    auto g = makeGuard(
        [&]() { std::allocator_traits<allocator_type>::destroy(a, p); });
    return insert(std::move(*p));
  }

  std::pair<iterator, bool> emplace(const value_type& value) {
    return insert(value);
  }

  std::pair<iterator, bool> emplace(value_type&& value) {
    return insert(std::move(value));
  }

  // emplace_hint isn't better than insert for sorted_vector_set, but aids
  // compatibility
  template <typename... Args>
  iterator emplace_hint(const_iterator hint, Args&&... args) {
    std::aligned_storage_t<sizeof(value_type), alignof(value_type)> b;
    value_type* p = static_cast<value_type*>(static_cast<void*>(&b));
    auto a = get_allocator();
    std::allocator_traits<allocator_type>::construct(
        a, p, std::forward<Args>(args)...);
    auto g = makeGuard(
        [&]() { std::allocator_traits<allocator_type>::destroy(a, p); });
    return insert(hint, std::move(*p));
  }

  iterator emplace_hint(const_iterator hint, const value_type& value) {
    return insert(hint, value);
  }

  iterator emplace_hint(const_iterator hint, value_type&& value) {
    return insert(hint, std::move(value));
  }

  size_type erase(const key_type& key) {
    iterator it = find(key);
    if (it == end()) {
      return 0;
    }
    m_.cont_.erase(it);
    return 1;
  }

  iterator erase(const_iterator it) {
    return m_.cont_.erase(it);
  }

  iterator erase(const_iterator first, const_iterator last) {
    return m_.cont_.erase(first, last);
  }

  iterator find(const key_type& key) {
    return find(*this, key);
  }

  const_iterator find(const key_type& key) const {
    return find(*this, key);
  }

  template <typename K>
  if_is_transparent<K, iterator> find(const K& key) {
    return find(*this, key);
  }

  template <typename K>
  if_is_transparent<K, const_iterator> find(const K& key) const {
    return find(*this, key);
  }

  size_type count(const key_type& key) const {
    return find(key) == end() ? 0 : 1;
  }

  template <typename K>
  if_is_transparent<K, size_type> count(const K& key) const {
    return find(key) == end() ? 0 : 1;
  }

  iterator lower_bound(const key_type& key) {
    return std::lower_bound(begin(), end(), key, key_comp());
  }

  const_iterator lower_bound(const key_type& key) const {
    return std::lower_bound(begin(), end(), key, key_comp());
  }

  template <typename K>
  if_is_transparent<K, iterator> lower_bound(const K& key) {
    return std::lower_bound(begin(), end(), key, key_comp());
  }

  template <typename K>
  if_is_transparent<K, const_iterator> lower_bound(const K& key) const {
    return std::lower_bound(begin(), end(), key, key_comp());
  }

  iterator upper_bound(const key_type& key) {
    return std::upper_bound(begin(), end(), key, key_comp());
  }

  const_iterator upper_bound(const key_type& key) const {
    return std::upper_bound(begin(), end(), key, key_comp());
  }

  template <typename K>
  if_is_transparent<K, iterator> upper_bound(const K& key) {
    return std::upper_bound(begin(), end(), key, key_comp());
  }

  template <typename K>
  if_is_transparent<K, const_iterator> upper_bound(const K& key) const {
    return std::upper_bound(begin(), end(), key, key_comp());
  }

  std::pair<iterator, iterator> equal_range(const key_type& key) {
    return std::equal_range(begin(), end(), key, key_comp());
  }

  std::pair<const_iterator, const_iterator> equal_range(
      const key_type& key) const {
    return std::equal_range(begin(), end(), key, key_comp());
  }

  template <typename K>
  if_is_transparent<K, std::pair<iterator, iterator>> equal_range(
      const K& key) {
    return std::equal_range(begin(), end(), key, key_comp());
  }

  template <typename K>
  if_is_transparent<K, std::pair<const_iterator, const_iterator>> equal_range(
      const K& key) const {
    return std::equal_range(begin(), end(), key, key_comp());
  }

  // Nothrow as long as swap() on the Compare type is nothrow.
  void swap(sorted_vector_set& o) {
    using std::swap; // Allow ADL for swap(); fall back to std::swap().
    Compare& a = m_;
    Compare& b = o.m_;
    swap(a, b);
    m_.cont_.swap(o.m_.cont_);
  }

  bool operator==(const sorted_vector_set& other) const {
    return other.m_.cont_ == m_.cont_;
  }
  bool operator!=(const sorted_vector_set& other) const {
    return !operator==(other);
  }

  bool operator<(const sorted_vector_set& other) const {
    return m_.cont_ < other.m_.cont_;
  }
  bool operator>(const sorted_vector_set& other) const {
    return other < *this;
  }
  bool operator<=(const sorted_vector_set& other) const {
    return !operator>(other);
  }
  bool operator>=(const sorted_vector_set& other) const {
    return !operator<(other);
  }

  const value_type* data() const noexcept {
    return m_.cont_.data();
  }

 private:
  /*
   * This structure derives from the comparison object in order to
   * make use of the empty base class optimization if our comparison
   * functor is an empty class (usual case).
   *
   * Wrapping up this member like this is better than deriving from
   * the Compare object ourselves (there are some perverse edge cases
   * involving virtual functions).
   *
   * More info:  http://www.cantrip.org/emptyopt.html
   */
  struct EBO : Compare {
    explicit EBO(const Compare& c, const Allocator& alloc) noexcept(
        std::is_nothrow_default_constructible<Container>::value)
        : Compare(c), cont_(alloc) {}
    EBO(const EBO& other, const Allocator& alloc)
    noexcept(std::is_nothrow_constructible<
             Container,
             const Container&,
             const Allocator&>::value)
        : Compare(static_cast<const Compare&>(other)),
          cont_(other.cont_, alloc) {}
    EBO(EBO&& other, const Allocator& alloc)
    noexcept(std::is_nothrow_constructible<
             Container,
             Container&&,
             const Allocator&>::value)
        : Compare(static_cast<Compare&&>(other)),
          cont_(std::move(other.cont_), alloc) {}
    EBO(const Compare& c, Container&& cont)
    noexcept(std::is_nothrow_move_constructible<Container>::value)
        : Compare(c), cont_(std::move(cont)) {}
    Container cont_;
  } m_;

  template <typename Self>
  using self_iterator_t = _t<
      std::conditional<std::is_const<Self>::value, const_iterator, iterator>>;

  template <typename Self, typename K>
  static self_iterator_t<Self> find(Self& self, K const& key) {
    auto end = self.end();
    auto it = self.lower_bound(key);
    if (it == end || !self.key_comp()(key, *it)) {
      return it;
    }
    return end;
  }
};

// Swap function that can be found using ADL.
template <class T, class C, class A, class G>
inline void swap(
    sorted_vector_set<T, C, A, G>& a,
    sorted_vector_set<T, C, A, G>& b) {
  return a.swap(b);
}

#if FOLLY_HAS_MEMORY_RESOURCE

namespace pmr {

template <
    class T,
    class Compare = std::less<T>,
    class GrowthPolicy = void,
    class Container =
        std::vector<T, folly::detail::std_pmr::polymorphic_allocator<T>>>
using sorted_vector_set = folly::sorted_vector_set<
    T,
    Compare,
    folly::detail::std_pmr::polymorphic_allocator<T>,
    GrowthPolicy,
    Container>;

} // namespace pmr

#endif

//////////////////////////////////////////////////////////////////////

/**
 * A sorted_vector_map is similar to a sorted_vector_set but stores
 * <key,value> pairs instead of single elements.
 *
 * @param class Key           Key type
 * @param class Value         Value type
 * @param class Compare       Function that can compare key types and impose
 *                            a strict weak ordering over them.
 * @param class Allocator     allocation policy
 * @param class GrowthPolicy  policy object to control growth
 *
 * @author Aditya Agarwal <aditya@fb.com>
 * @author Akhil Wable    <akhil@fb.com>
 * @author Jordan DeLong  <delong.j@fb.com>
 */
template <
    class Key,
    class Value,
    class Compare = std::less<Key>,
    class Allocator = std::allocator<std::pair<Key, Value>>,
    class GrowthPolicy = void,
    class Container = std::vector<std::pair<Key, Value>, Allocator>>
class sorted_vector_map : detail::growth_policy_wrapper<GrowthPolicy> {
  detail::growth_policy_wrapper<GrowthPolicy>& get_growth_policy() {
    return *this;
  }

  template <typename K, typename V, typename C = Compare>
  using if_is_transparent =
      _t<detail::sorted_vector_enable_if_is_transparent<void, C, K, V>>;

  struct EBO;

 public:
  typedef Key key_type;
  typedef Value mapped_type;
  typedef typename Container::value_type value_type;
  typedef Compare key_compare;
  typedef Allocator allocator_type;
  typedef Container container_type;

  struct value_compare : private Compare {
    bool operator()(const value_type& a, const value_type& b) const {
      return Compare::operator()(a.first, b.first);
    }

   protected:
    friend class sorted_vector_map;
    explicit value_compare(const Compare& c) : Compare(c) {}
  };

  typedef typename Container::pointer pointer;
  typedef typename Container::reference reference;
  typedef typename Container::const_reference const_reference;
  typedef typename Container::iterator iterator;
  typedef typename Container::const_iterator const_iterator;
  typedef typename Container::difference_type difference_type;
  typedef typename Container::size_type size_type;
  typedef typename Container::reverse_iterator reverse_iterator;
  typedef typename Container::const_reverse_iterator const_reverse_iterator;

  sorted_vector_map() noexcept(
      std::is_nothrow_constructible<EBO, value_compare, Allocator>::value)
      : m_(value_compare(Compare()), Allocator()) {}

  sorted_vector_map(const sorted_vector_map&) = default;

  sorted_vector_map(const sorted_vector_map& other, const Allocator& alloc)
      : m_(other.m_, alloc) {}

  sorted_vector_map(sorted_vector_map&&) = default;

  sorted_vector_map(sorted_vector_map&& other, const Allocator& alloc) noexcept(
      std::is_nothrow_constructible<EBO, EBO&&, const Allocator&>::value)
      : m_(std::move(other.m_), alloc) {}

  explicit sorted_vector_map(const Allocator& alloc)
      : m_(value_compare(Compare()), alloc) {}

  explicit sorted_vector_map(
      const Compare& comp,
      const Allocator& alloc = Allocator())
      : m_(value_compare(comp), alloc) {}

  template <class InputIterator>
  explicit sorted_vector_map(
      InputIterator first,
      InputIterator last,
      const Compare& comp = Compare(),
      const Allocator& alloc = Allocator())
      : m_(value_compare(comp), alloc) {
    insert(first, last);
  }

  template <class InputIterator>
  sorted_vector_map(
      InputIterator first,
      InputIterator last,
      const Allocator& alloc)
      : m_(value_compare(Compare()), alloc) {
    insert(first, last);
  }

  /* implicit */ sorted_vector_map(
      std::initializer_list<value_type> list,
      const Compare& comp = Compare(),
      const Allocator& alloc = Allocator())
      : m_(value_compare(comp), alloc) {
    insert(list.begin(), list.end());
  }

  sorted_vector_map(
      std::initializer_list<value_type> list,
      const Allocator& alloc)
      : m_(value_compare(Compare()), alloc) {
    insert(list.begin(), list.end());
  }

  // Construct a sorted_vector_map by stealing the storage of a prefilled
  // container. The container need not be sorted already. This supports
  // bulk construction of sorted_vector_map with zero allocations, not counting
  // those performed by the caller. (The iterator range constructor performs at
  // least one allocation).
  //
  // Note that `sorted_vector_map(const Container& container)` is not provided,
  // since the purpose of this constructor is to avoid an unnecessary copy.
  explicit sorted_vector_map(
      Container&& container,
      const Compare& comp = Compare())
      : sorted_vector_map(
            sorted_unique,
            detail::as_sorted_unique(std::move(container), value_compare(comp)),
            comp) {}

  // Construct a sorted_vector_map by stealing the storage of a prefilled
  // container. Its elements must be sorted and unique, as sorted_unique_t
  // hints. Supports bulk construction of sorted_vector_map with zero
  // allocations, not counting those performed by the caller. (The iterator
  // range constructor performs at least one allocation).
  //
  // Note that `sorted_vector_map(sorted_unique_t, const Container& container)`
  // is not provided, since the purpose of this constructor is to avoid an extra
  // copy.
  sorted_vector_map(
      sorted_unique_t,
      Container&& container,
      const Compare& comp = Compare()) noexcept(std::
                                                    is_nothrow_constructible<
                                                        EBO,
                                                        value_compare,
                                                        Container&&>::value)
      : m_(value_compare(comp), std::move(container)) {
    assert(std::is_sorted(m_.cont_.begin(), m_.cont_.end(), value_comp()));
    assert(detail::is_sorted_unique(m_.cont_, value_comp()));
  }

  Allocator get_allocator() const {
    return m_.cont_.get_allocator();
  }

  sorted_vector_map& operator=(const sorted_vector_map& other) = default;

  sorted_vector_map& operator=(sorted_vector_map&& other) = default;

  sorted_vector_map& operator=(std::initializer_list<value_type> ilist) {
    clear();
    insert(ilist.begin(), ilist.end());
    return *this;
  }

  key_compare key_comp() const {
    return m_;
  }
  value_compare value_comp() const {
    return m_;
  }

  iterator begin() {
    return m_.cont_.begin();
  }
  iterator end() {
    return m_.cont_.end();
  }
  const_iterator cbegin() const {
    return m_.cont_.cbegin();
  }
  const_iterator begin() const {
    return m_.cont_.begin();
  }
  const_iterator cend() const {
    return m_.cont_.cend();
  }
  const_iterator end() const {
    return m_.cont_.end();
  }
  reverse_iterator rbegin() {
    return m_.cont_.rbegin();
  }
  reverse_iterator rend() {
    return m_.cont_.rend();
  }
  const_reverse_iterator rbegin() const {
    return m_.cont_.rbegin();
  }
  const_reverse_iterator rend() const {
    return m_.cont_.rend();
  }

  void clear() {
    return m_.cont_.clear();
  }
  size_type size() const {
    return m_.cont_.size();
  }
  size_type max_size() const {
    return m_.cont_.max_size();
  }
  bool empty() const {
    return m_.cont_.empty();
  }
  void reserve(size_type s) {
    return m_.cont_.reserve(s);
  }
  void shrink_to_fit() {
    m_.cont_.shrink_to_fit();
  }
  size_type capacity() const {
    return m_.cont_.capacity();
  }

  std::pair<iterator, bool> insert(const value_type& value) {
    iterator it = lower_bound(value.first);
    if (it == end() || value_comp()(value, *it)) {
      it = get_growth_policy().increase_capacity(m_.cont_, it);
      return std::make_pair(m_.cont_.insert(it, value), true);
    }
    return std::make_pair(it, false);
  }

  std::pair<iterator, bool> insert(value_type&& value) {
    iterator it = lower_bound(value.first);
    if (it == end() || value_comp()(value, *it)) {
      it = get_growth_policy().increase_capacity(m_.cont_, it);
      return std::make_pair(m_.cont_.insert(it, std::move(value)), true);
    }
    return std::make_pair(it, false);
  }

  iterator insert(const_iterator hint, const value_type& value) {
    return detail::insert_with_hint(
        *this, m_.cont_, hint, value, get_growth_policy());
  }

  iterator insert(const_iterator hint, value_type&& value) {
    return detail::insert_with_hint(
        *this, m_.cont_, hint, std::move(value), get_growth_policy());
  }

  template <class InputIterator>
  void insert(InputIterator first, InputIterator last) {
    detail::bulk_insert(*this, m_.cont_, first, last);
  }

  void insert(std::initializer_list<value_type> ilist) {
    insert(ilist.begin(), ilist.end());
  }

  // emplace isn't better than insert for sorted_vector_map, but aids
  // compatibility
  template <typename... Args>
  std::pair<iterator, bool> emplace(Args&&... args) {
    std::aligned_storage_t<sizeof(value_type), alignof(value_type)> b;
    value_type* p = static_cast<value_type*>(static_cast<void*>(&b));
    auto a = get_allocator();
    std::allocator_traits<allocator_type>::construct(
        a, p, std::forward<Args>(args)...);
    auto g = makeGuard(
        [&]() { std::allocator_traits<allocator_type>::destroy(a, p); });
    return insert(std::move(*p));
  }

  std::pair<iterator, bool> emplace(const value_type& value) {
    return insert(value);
  }

  std::pair<iterator, bool> emplace(value_type&& value) {
    return insert(std::move(value));
  }

  // emplace_hint isn't better than insert for sorted_vector_set, but aids
  // compatibility
  template <typename... Args>
  iterator emplace_hint(const_iterator hint, Args&&... args) {
    std::aligned_storage_t<sizeof(value_type), alignof(value_type)> b;
    value_type* p = static_cast<value_type*>(static_cast<void*>(&b));
    auto a = get_allocator();
    std::allocator_traits<allocator_type>::construct(
        a, p, std::forward<Args>(args)...);
    auto g = makeGuard(
        [&]() { std::allocator_traits<allocator_type>::destroy(a, p); });
    return insert(hint, std::move(*p));
  }

  iterator emplace_hint(const_iterator hint, const value_type& value) {
    return insert(hint, value);
  }

  iterator emplace_hint(const_iterator hint, value_type&& value) {
    return insert(hint, std::move(value));
  }

  size_type erase(const key_type& key) {
    iterator it = find(key);
    if (it == end()) {
      return 0;
    }
    m_.cont_.erase(it);
    return 1;
  }

  iterator erase(const_iterator it) {
    return m_.cont_.erase(it);
  }

  iterator erase(const_iterator first, const_iterator last) {
    return m_.cont_.erase(first, last);
  }

  iterator find(const key_type& key) {
    return find(*this, key);
  }

  const_iterator find(const key_type& key) const {
    return find(*this, key);
  }

  template <typename K>
  if_is_transparent<K, iterator> find(const K& key) {
    return find(*this, key);
  }

  template <typename K>
  if_is_transparent<K, const_iterator> find(const K& key) const {
    return find(*this, key);
  }

  mapped_type& at(const key_type& key) {
    iterator it = find(key);
    if (it != end()) {
      return it->second;
    }
    throw_exception<std::out_of_range>("sorted_vector_map::at");
  }

  const mapped_type& at(const key_type& key) const {
    const_iterator it = find(key);
    if (it != end()) {
      return it->second;
    }
    throw_exception<std::out_of_range>("sorted_vector_map::at");
  }

  size_type count(const key_type& key) const {
    return find(key) == end() ? 0 : 1;
  }

  template <typename K>
  if_is_transparent<K, size_type> count(const K& key) const {
    return find(key) == end() ? 0 : 1;
  }

  iterator lower_bound(const key_type& key) {
    return lower_bound(*this, key);
  }

  const_iterator lower_bound(const key_type& key) const {
    return lower_bound(*this, key);
  }

  template <typename K>
  if_is_transparent<K, iterator> lower_bound(const K& key) {
    return lower_bound(*this, key);
  }

  template <typename K>
  if_is_transparent<K, const_iterator> lower_bound(const K& key) const {
    return lower_bound(*this, key);
  }

  iterator upper_bound(const key_type& key) {
    return upper_bound(*this, key);
  }

  const_iterator upper_bound(const key_type& key) const {
    return upper_bound(*this, key);
  }

  template <typename K>
  if_is_transparent<K, iterator> upper_bound(const K& key) {
    return upper_bound(*this, key);
  }

  template <typename K>
  if_is_transparent<K, const_iterator> upper_bound(const K& key) const {
    return upper_bound(*this, key);
  }

  std::pair<iterator, iterator> equal_range(const key_type& key) {
    return equal_range(*this, key);
  }

  std::pair<const_iterator, const_iterator> equal_range(
      const key_type& key) const {
    return equal_range(*this, key);
  }

  template <typename K>
  if_is_transparent<K, std::pair<iterator, iterator>> equal_range(
      const K& key) {
    return equal_range(*this, key);
  }

  template <typename K>
  if_is_transparent<K, std::pair<const_iterator, const_iterator>> equal_range(
      const K& key) const {
    return equal_range(*this, key);
  }

  // Nothrow as long as swap() on the Compare type is nothrow.
  void swap(sorted_vector_map& o) {
    using std::swap; // Allow ADL for swap(); fall back to std::swap().
    Compare& a = m_;
    Compare& b = o.m_;
    swap(a, b);
    m_.cont_.swap(o.m_.cont_);
  }

  mapped_type& operator[](const key_type& key) {
    iterator it = lower_bound(key);
    if (it == end() || key_comp()(key, it->first)) {
      return insert(it, value_type(key, mapped_type()))->second;
    }
    return it->second;
  }

  bool operator==(const sorted_vector_map& other) const {
    return m_.cont_ == other.m_.cont_;
  }
  bool operator!=(const sorted_vector_map& other) const {
    return !operator==(other);
  }

  bool operator<(const sorted_vector_map& other) const {
    return m_.cont_ < other.m_.cont_;
  }
  bool operator>(const sorted_vector_map& other) const {
    return other < *this;
  }
  bool operator<=(const sorted_vector_map& other) const {
    return !operator>(other);
  }
  bool operator>=(const sorted_vector_map& other) const {
    return !operator<(other);
  }

  const value_type* data() const noexcept {
    return m_.cont_.data();
  }

 private:
  // This is to get the empty base optimization; see the comment in
  // sorted_vector_set.
  struct EBO : value_compare {
    explicit EBO(const value_compare& c, const Allocator& alloc) noexcept(
        std::is_nothrow_default_constructible<Container>::value)
        : value_compare(c), cont_(alloc) {}
    EBO(const EBO& other, const Allocator& alloc)
    noexcept(std::is_nothrow_constructible<
             Container,
             const Container&,
             const Allocator&>::value)
        : value_compare(static_cast<const value_compare&>(other)),
          cont_(other.cont_, alloc) {}
    EBO(EBO&& other, const Allocator& alloc)
    noexcept(std::is_nothrow_constructible<
             Container,
             Container&&,
             const Allocator&>::value)
        : value_compare(static_cast<value_compare&&>(other)),
          cont_(std::move(other.cont_), alloc) {}
    EBO(const Compare& c, Container&& cont)
    noexcept(std::is_nothrow_move_constructible<Container>::value)
        : value_compare(c), cont_(std::move(cont)) {}
    Container cont_;
  } m_;

  template <typename Self>
  using self_iterator_t = _t<
      std::conditional<std::is_const<Self>::value, const_iterator, iterator>>;

  template <typename Self, typename K>
  static self_iterator_t<Self> find(Self& self, K const& key) {
    auto end = self.end();
    auto it = self.lower_bound(key);
    if (it == end || !self.key_comp()(key, it->first)) {
      return it;
    }
    return end;
  }

  template <typename Self, typename K>
  static self_iterator_t<Self> lower_bound(Self& self, K const& key) {
    auto f = [c = self.key_comp()](value_type const& a, K const& b) {
      return c(a.first, b);
    };
    return std::lower_bound(self.begin(), self.end(), key, f);
  }

  template <typename Self, typename K>
  static self_iterator_t<Self> upper_bound(Self& self, K const& key) {
    auto f = [c = self.key_comp()](K const& a, value_type const& b) {
      return c(a, b.first);
    };
    return std::upper_bound(self.begin(), self.end(), key, f);
  }

  template <typename Self, typename K>
  static std::pair<self_iterator_t<Self>, self_iterator_t<Self>> equal_range(
      Self& self,
      K const& key) {
    // Note: std::equal_range can't be passed a functor that takes
    // argument types different from the iterator value_type, so we
    // have to do this.
    return {lower_bound(self, key), upper_bound(self, key)};
  }
};

// Swap function that can be found using ADL.
template <class K, class V, class C, class A, class G>
inline void swap(
    sorted_vector_map<K, V, C, A, G>& a,
    sorted_vector_map<K, V, C, A, G>& b) {
  return a.swap(b);
}

#if FOLLY_HAS_MEMORY_RESOURCE

namespace pmr {

template <
    class Key,
    class Value,
    class Compare = std::less<Key>,
    class GrowthPolicy = void,
    class Container = std::vector<
        std::pair<Key, Value>,
        folly::detail::std_pmr::polymorphic_allocator<std::pair<Key, Value>>>>
using sorted_vector_map = folly::sorted_vector_map<
    Key,
    Value,
    Compare,
    folly::detail::std_pmr::polymorphic_allocator<std::pair<Key, Value>>,
    GrowthPolicy,
    Container>;

} // namespace pmr

#endif

//////////////////////////////////////////////////////////////////////

} // namespace folly
