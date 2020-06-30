// Boost.Signals library

// Copyright Douglas Gregor 2001-2004. Use, modification and
// distribution is subject to the Boost Software License, Version
// 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// For more information, see http://www.boost.org

#ifndef BOOST_SIGNALS_NAMED_SLOT_MAP_HPP
#define BOOST_SIGNALS_NAMED_SLOT_MAP_HPP

#include <boost/signals/detail/config.hpp>
#include <boost/signals/detail/signals_common.hpp>
#include <boost/signals/connection.hpp>
#include <boost/shared_ptr.hpp>
#include <boost/function/function2.hpp>
#include <boost/iterator/iterator_facade.hpp>
#include <map>
#include <memory>
#include <utility>

namespace boost { namespace BOOST_SIGNALS_NAMESPACE {

enum connect_position { at_back, at_front };

namespace detail {

class stored_group
{
 public:
  enum storage_kind { sk_empty, sk_front, sk_back, sk_group };

  stored_group(storage_kind p_kind = sk_empty) : kind(p_kind), group() { }

  template<typename T>
  stored_group(const T& p_group) : kind(sk_group), group(new T(p_group)) { }

  bool is_front() const { return kind == sk_front; }
  bool is_back() const { return kind == sk_back; }
  bool empty() const { return kind == sk_empty; }

  void* get() const { return group.get(); }

 private:
  storage_kind kind;
  shared_ptr<void> group;
};

typedef function2<bool, stored_group, stored_group> compare_type;

// This function object bridges from a pair of any objects that hold
// values of type Key to the underlying function object that compares
// values of type Key.
template<typename Compare, typename Key>
class group_bridge_compare {
public:
  typedef bool result_type;
  typedef const stored_group& first_argument_type;
  typedef const stored_group& second_argument_type;

  group_bridge_compare(const Compare& c) : comp(c)
  { }

  bool operator()(const stored_group& k1, const stored_group& k2) const
  {
    if (k1.is_front()) return !k2.is_front();
    if (k1.is_back()) return false;
    if (k2.is_front()) return false;
    if (k2.is_back()) return true;

    // Neither is empty, so compare their values to order them
    return comp(*static_cast<Key*>(k1.get()), *static_cast<Key*>(k2.get()));
  }

private:
  Compare comp;
};

class BOOST_SIGNALS_DECL named_slot_map_iterator :
  public iterator_facade<named_slot_map_iterator,
                         connection_slot_pair,
                         forward_traversal_tag>
{
  typedef std::list<connection_slot_pair> group_list;
  typedef group_list::iterator slot_pair_iterator;
  typedef std::map<stored_group, group_list, compare_type> slot_container_type;
  typedef slot_container_type::iterator group_iterator;
  typedef slot_container_type::const_iterator const_group_iterator;

  typedef iterator_facade<named_slot_map_iterator,
                          connection_slot_pair,
                          forward_traversal_tag> inherited;
public:
  named_slot_map_iterator() : slot_assigned(false)
  { }
  named_slot_map_iterator(const named_slot_map_iterator& other)
    : group(other.group), last_group(other.last_group),
    slot_assigned(other.slot_assigned)
  {
    if (slot_assigned) slot_ = other.slot_;
  }
  named_slot_map_iterator& operator=(const named_slot_map_iterator& other)
  {
    slot_assigned = other.slot_assigned;
    group = other.group;
    last_group = other.last_group;
    if (slot_assigned) slot_ = other.slot_;
    return *this;
  }
  connection_slot_pair& dereference() const
  {
    return *slot_;
  }
  void increment()
  {
    ++slot_;
    if (slot_ == group->second.end()) {
      ++group;
      init_next_group();
    }
  }
  bool equal(const named_slot_map_iterator& other) const {
    return (group == other.group
        && (group == last_group
        || slot_ == other.slot_));
  }

#if BOOST_WORKAROUND(_MSC_VER, <= 1900)
  void decrement();
  void advance(difference_type);
#endif

private:
  named_slot_map_iterator(group_iterator giter, group_iterator last) :
    group(giter), last_group(last), slot_assigned(false)
  { init_next_group(); }
  named_slot_map_iterator(group_iterator giter, group_iterator last,
                          slot_pair_iterator slot) :
    group(giter), last_group(last), slot_(slot), slot_assigned(true)
  { }

  void init_next_group()
  {
    while (group != last_group && group->second.empty()) ++group;
    if (group != last_group) {
      slot_ = group->second.begin();
      slot_assigned = true;
    }
  }

  group_iterator group;
  group_iterator last_group;
  slot_pair_iterator slot_;
  bool slot_assigned;

  friend class named_slot_map;
};

class BOOST_SIGNALS_DECL named_slot_map
{
public:
  typedef named_slot_map_iterator iterator;

  named_slot_map(const compare_type& compare);

  void clear();
  iterator begin();
  iterator end();
  iterator insert(const stored_group& name, const connection& con,
                  const any& slot, connect_position at);
  void disconnect(const stored_group& name);
  void erase(iterator pos);
  void remove_disconnected_slots();

private:
  typedef std::list<connection_slot_pair> group_list;
  typedef std::map<stored_group, group_list, compare_type> slot_container_type;
  typedef slot_container_type::iterator group_iterator;
  typedef slot_container_type::const_iterator const_group_iterator;

  bool empty(const_group_iterator group) const
  {
    return (group->second.empty() && group != groups.begin() && group != back);
  }
  slot_container_type groups;
  group_iterator back;
};

} } }

#endif // BOOST_SIGNALS_NAMED_SLOT_MAP_HPP
