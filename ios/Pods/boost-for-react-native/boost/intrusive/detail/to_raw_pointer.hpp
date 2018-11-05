/////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga  2014-2014
//
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/intrusive for documentation.
//
/////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_INTRUSIVE_DETAIL_TO_RAW_POINTER_HPP
#define BOOST_INTRUSIVE_DETAIL_TO_RAW_POINTER_HPP

#ifndef BOOST_CONFIG_HPP
#  include <boost/config.hpp>
#endif

#if defined(BOOST_HAS_PRAGMA_ONCE)
#  pragma once
#endif

#include <boost/intrusive/detail/config_begin.hpp>
#include <boost/intrusive/detail/workaround.hpp>
#include <boost/intrusive/detail/pointer_element.hpp>

namespace boost {
namespace intrusive {
namespace detail {

template <class T>
BOOST_INTRUSIVE_FORCEINLINE T* to_raw_pointer(T* p)
{  return p; }

template <class Pointer>
BOOST_INTRUSIVE_FORCEINLINE typename boost::intrusive::pointer_element<Pointer>::type*
to_raw_pointer(const Pointer &p)
{  return boost::intrusive::detail::to_raw_pointer(p.operator->());  }

} //namespace detail
} //namespace intrusive
} //namespace boost

#include <boost/intrusive/detail/config_end.hpp>

#endif //BOOST_INTRUSIVE_DETAIL_UTILITIES_HPP
