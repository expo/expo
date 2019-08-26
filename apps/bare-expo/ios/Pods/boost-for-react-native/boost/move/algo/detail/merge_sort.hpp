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

//! \file

#ifndef BOOST_MOVE_DETAIL_MERGE_SORT_HPP
#define BOOST_MOVE_DETAIL_MERGE_SORT_HPP

#ifndef BOOST_CONFIG_HPP
#  include <boost/config.hpp>
#endif
#
#if defined(BOOST_HAS_PRAGMA_ONCE)
#  pragma once
#endif

#include <boost/move/detail/config_begin.hpp>
#include <boost/move/detail/workaround.hpp>

#include <boost/move/utility_core.hpp>
#include <boost/move/algo/move.hpp>
#include <boost/move/algo/detail/merge.hpp>
#include <boost/move/detail/iterator_traits.hpp>
#include <boost/move/adl_move_swap.hpp>
#include <boost/move/detail/destruct_n.hpp>
#include <boost/move/algo/detail/insertion_sort.hpp>
#include <cassert>

namespace boost {
namespace movelib {

// @cond

static const unsigned MergeSortInsertionSortThreshold = 16;

template <class RandIt, class Compare>
void inplace_stable_sort(RandIt first, RandIt last, Compare comp)
{
   typedef typename iterator_traits<RandIt>::size_type  size_type;
   if (size_type(last - first) <= size_type(MergeSortInsertionSortThreshold)) {
      insertion_sort(first, last, comp);
      return;
   }
   RandIt middle = first + (last - first) / 2;
   inplace_stable_sort(first, middle, comp);
   inplace_stable_sort(middle, last, comp);
   merge_bufferless_ONlogN_recursive
      (first, middle, last, size_type(middle - first), size_type(last - middle), comp);
}

// @endcond

template<class RandIt, class RandIt2, class Compare>
void merge_sort_copy( RandIt first, RandIt last
                   , RandIt2 dest, Compare comp)
{
   typedef typename iterator_traits<RandIt>::size_type  size_type;

   size_type const count = size_type(last - first);
   if(count <= MergeSortInsertionSortThreshold){
      insertion_sort_copy(first, last, dest, comp);
   }
   else{
      size_type const half = count/2;
      merge_sort_copy(first + half, last        , dest+half   , comp);
      merge_sort_copy(first       , first + half, first + half, comp);
      merge_with_right_placed
         ( first + half, first + half + half
         , dest, dest+half, dest + count
         , comp);
   }
}

template<class RandIt, class Compare>
void merge_sort_uninitialized_copy( RandIt first, RandIt last
                                 , typename iterator_traits<RandIt>::value_type* uninitialized
                                 , Compare comp)
{
   typedef typename iterator_traits<RandIt>::size_type  size_type;
   typedef typename iterator_traits<RandIt>::value_type value_type;

   size_type const count = size_type(last - first);
   if(count <= MergeSortInsertionSortThreshold){
      insertion_sort_uninitialized_copy(first, last, uninitialized, comp);
   }
   else{
      size_type const half = count/2;
      merge_sort_uninitialized_copy(first + half, last, uninitialized + half, comp);
      destruct_n<value_type> d(uninitialized+half);
      d.incr(count-half);
      merge_sort_copy(first, first + half, first + half, comp);
      uninitialized_merge_with_right_placed
         ( first + half, first + half + half
         , uninitialized, uninitialized+half, uninitialized+count
         , comp);
      d.release();
   }
}

template<class RandIt, class Compare>
void merge_sort( RandIt first, RandIt last, Compare comp
               , typename iterator_traits<RandIt>::value_type* uninitialized)
{
   typedef typename iterator_traits<RandIt>::size_type  size_type;
   typedef typename iterator_traits<RandIt>::value_type value_type;

   size_type const count = size_type(last - first);
   if(count <= MergeSortInsertionSortThreshold){
      insertion_sort(first, last, comp);
   }
   else{
      size_type const half = count/2;
      size_type const rest = count -  half;
      RandIt const half_it = first + half;
      RandIt const rest_it = first + rest;

      merge_sort_uninitialized_copy(half_it, last, uninitialized, comp);
      destruct_n<value_type> d(uninitialized);
      d.incr(rest);
      merge_sort_copy(first, half_it, rest_it, comp);
      merge_with_right_placed
         ( uninitialized, uninitialized + rest
         , first, rest_it, last, antistable<Compare>(comp));
   }
}

}} //namespace boost {  namespace movelib{

#include <boost/move/detail/config_end.hpp>

#endif //#ifndef BOOST_MOVE_DETAIL_MERGE_SORT_HPP
