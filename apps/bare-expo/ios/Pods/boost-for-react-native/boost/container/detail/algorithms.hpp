//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2005-2013.
//
// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/container for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_CONTAINER_DETAIL_ALGORITHMS_HPP
#define BOOST_CONTAINER_DETAIL_ALGORITHMS_HPP

#if defined(_MSC_VER)
#  pragma once
#endif

#include <boost/container/detail/config_begin.hpp>
#include <boost/container/detail/workaround.hpp>
#include <boost/container/allocator_traits.hpp>
#include <boost/container/detail/iterators.hpp>

namespace boost {
namespace container {

template<class A, class T, class InpIt>
inline void construct_in_place(A &a, T* dest, InpIt source)
{     boost::container::allocator_traits<A>::construct(a, dest, *source);  }

template<class A, class T, class U, class D>
inline void construct_in_place(A &a, T *dest, value_init_construct_iterator<U, D>)
{
   boost::container::allocator_traits<A>::construct(a, dest);
}

template <class T, class Difference>
class default_init_construct_iterator;

template<class A, class T, class U, class D>
inline void construct_in_place(A &a, T *dest, default_init_construct_iterator<U, D>)
{
   boost::container::allocator_traits<A>::construct(a, dest, default_init);
}

template <class T, class EmplaceFunctor, class Difference>
class emplace_iterator;

template<class A, class T, class U, class EF, class D>
inline void construct_in_place(A &a, T *dest, emplace_iterator<U, EF, D> ei)
{
   ei.construct_in_place(a, dest);
}

}  //namespace container {
}  //namespace boost {

#include <boost/container/detail/config_end.hpp>

#endif   //#ifndef BOOST_CONTAINER_DETAIL_ALGORITHMS_HPP

