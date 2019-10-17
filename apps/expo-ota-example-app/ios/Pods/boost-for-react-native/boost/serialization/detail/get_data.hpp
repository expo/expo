// (C) Copyright 2005 Matthias Troyer 
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org for updates, documentation, and revision history.

#ifndef BOOST_SERIALIZATION_DETAIL_GET_DATA_HPP
#define BOOST_SERIALIZATION_DETAIL_GET_DATA_HPP

// MS compatible compilers support #pragma once
#if defined(_MSC_VER)
# pragma once
#endif

#if defined(__SGI_STL_PORT) || defined(_STLPORT_VERSION)
#define STD _STLP_STD
#else
#define STD std
#endif

#include <vector>
#include <valarray>

namespace boost {
namespace serialization { 
namespace detail {

template <class T, class Allocator>
T* get_data(STD::vector<T,Allocator>& v)
{
  return v.empty() ? 0 : &(v[0]);
}

template <class T, class Allocator>
T* get_data(STD::vector<T,Allocator> const & v)
{
  return get_data(const_cast<STD::vector<T,Allocator>&>(v));
}

template <class T>
T* get_data(STD::valarray<T>& v)
{
  return v.size()==0 ? 0 : &(v[0]);
}

template <class T>
const T* get_data(STD::valarray<T> const& v)
{
  return get_data(const_cast<STD::valarray<T>&>(v));
}

} // detail
} // serialization
} // boost

#undef STD

#endif // BOOST_SERIALIZATION_DETAIL_GET_DATA_HPP
