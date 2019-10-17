#ifndef  BOOST_SERIALIZATION_DETAIL_IS_DEFAULT_CONSTRUCTIBLE_HPP
#define BOOST_SERIALIZATION_DETAIL_IS_DEFAULT_CONSTRUCTIBLE_HPP

// MS compatible compilers support #pragma once
#if defined(_MSC_VER)
# pragma once
#endif

/////////1/////////2/////////3/////////4/////////5/////////6/////////7/////////8
// is_default_constructible.hpp: serialization for loading stl collections
//
// (C) Copyright 2002 Robert Ramey - http://www.rrsd.com . 
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org for updates, documentation, and revision history.

#include <boost/config.hpp>

#if defined(_LIBCPP_VERSION) && (_LIBCPP_VERSION >= 1101) \
|| ! defined(BOOST_NO_CXX11_HDR_TYPE_TRAITS)
    #include <type_traits>
    namespace boost{
    namespace serialization {
    namespace detail {

    template<typename T>
    struct is_default_constructible : std::is_default_constructible<T> {};

    } // detail
    } // serializaition
    } // boost
#else
    #include <boost/type_traits/has_trivial_constructor.hpp>
    namespace boost{
    namespace serialization {
    namespace detail {

    template<typename T>
    struct is_default_constructible : boost::has_trivial_constructor<T> {};

    } // detail
    } // serializaition
    } // boost
#endif

#endif //  BOOST_SERIALIZATION_DETAIL_IS_DEFAULT_CONSTRUCTIBLE_HPP
