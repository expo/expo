// Boost.TypeErasure library
//
// Copyright 2011 Steven Watanabe
//
// Distributed under the Boost Software License Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
// $Id$

#ifndef BOOST_TYPE_ERASURE_DETAIL_IS_PLACEHOLDER_HPP_INCLUDED
#define BOOST_TYPE_ERASURE_DETAIL_IS_PLACEHOLDER_HPP_INCLUDED

#include <boost/mpl/bool.hpp>
#include <boost/type_traits/is_base_and_derived.hpp>
#include <boost/type_erasure/placeholder.hpp>

namespace boost {

namespace type_erasure {

/** A metafunction that indicates whether a type is a @ref placeholder. */
template<class T>
struct is_placeholder : ::boost::is_base_and_derived<placeholder, T> {};

}
}

#endif
