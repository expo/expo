//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2015-2016.
// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/move for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_MOVE_ADAPTIVE_SORT_HPP
#define BOOST_MOVE_ADAPTIVE_SORT_HPP

#include <boost/move/detail/config_begin.hpp>
#include <boost/move/algo/detail/adaptive_sort_merge.hpp>

namespace boost {
namespace movelib {

//! <b>Effects</b>: Sorts the elements in the range [first, last) in ascending order according
//!   to comparison functor "comp". The sort is stable (order of equal elements
//!   is guaranteed to be preserved). Performance is improved if additional raw storage is
//!   provided.
//!
//! <b>Requires</b>:
//!   - RandIt must meet the requirements of ValueSwappable and RandomAccessIterator.
//!   - The type of dereferenced RandIt must meet the requirements of MoveAssignable and MoveConstructible.
//!
//! <b>Parameters</b>:
//!   - first, last: the range of elements to sort
//!   - comp: comparison function object which returns true if the first argument is is ordered before the second.
//!   - uninitialized, uninitialized_len: raw storage starting on "uninitialized", able to hold "uninitialized_len"
//!      elements of type iterator_traits<RandIt>::value_type. Maximum performance is achieved when uninitialized_len
//!      is ceil(std::distance(first, last)/2).
//!
//! <b>Throws</b>: If comp throws or the move constructor, move assignment or swap of the type
//!   of dereferenced RandIt throws.
//!
//! <b>Complexity</b>: Always K x O(Nxlog(N)) comparisons and move assignments/constructors/swaps.
//!   Comparisons are close to minimum even with no additional memory. Constant factor for data movement is minimized
//!   when uninitialized_len is ceil(std::distance(first, last)/2). Pretty good enough performance is achieved when
//!   ceil(sqrt(std::distance(first, last)))*2.
//!
//! <b>Caution</b>: Experimental implementation, not production-ready.
template<class RandIt, class Compare>
void adaptive_sort( RandIt first, RandIt last, Compare comp
               , typename iterator_traits<RandIt>::value_type* uninitialized = 0
               , std::size_t uninitialized_len = 0)
{
   typedef typename iterator_traits<RandIt>::size_type  size_type;
   typedef typename iterator_traits<RandIt>::value_type value_type;

   ::boost::movelib::detail_adaptive::adaptive_xbuf<value_type> xbuf(uninitialized, uninitialized_len);
   ::boost::movelib::detail_adaptive::adaptive_sort_impl(first, size_type(last - first), comp, xbuf);
}

}  //namespace movelib {
}  //namespace boost {

#include <boost/move/detail/config_end.hpp>

#endif   //#define BOOST_MOVE_ADAPTIVE_SORT_HPP
