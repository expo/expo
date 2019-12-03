// Copyright 2005 Daniel Wallin.
// Copyright 2005 Joel de Guzman.
//
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
// Modeled after range_ex, Copyright 2004 Eric Niebler
///////////////////////////////////////////////////////////////////////////////
//
// is_std_hash_set.hpp
//
/////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_PHOENIX_IS_STD_HASH_SET_EN_16_12_2004
#define BOOST_PHOENIX_IS_STD_HASH_SET_EN_16_12_2004

#include <boost/mpl/bool.hpp>
#include "./std_hash_set_fwd.hpp"

namespace boost
{
    template<class T>
    struct is_std_hash_set
        : boost::mpl::false_
    {};

    template<class T>
    struct is_std_hash_multiset
        : boost::mpl::false_
    {};

#if defined(BOOST_HAS_HASH)

    template<
        class Kty
      , class Hash
      , class Cmp
      , class Alloc
    >
    struct is_std_hash_set< ::BOOST_STD_EXTENSION_NAMESPACE::hash_set<Kty,Hash,Cmp,Alloc> >
        : boost::mpl::true_
    {};

    template<
        class Kty
      , class Hash
      , class Cmp
      , class Alloc
    >
    struct is_std_hash_multiset< ::BOOST_STD_EXTENSION_NAMESPACE::hash_multiset<Kty,Hash,Cmp,Alloc> >
        : boost::mpl::true_
    {};

#elif defined(BOOST_DINKUMWARE_STDLIB)

    template<
        class Kty
      , class Tr
      , class Alloc
    >
    struct is_std_hash_set< ::BOOST_STD_EXTENSION_NAMESPACE::hash_set<Kty,Tr,Alloc> >
        : boost::mpl::true_
    {};

    template<
        class Kty
      , class Tr
      , class Alloc
    >
    struct is_std_hash_multiset< ::BOOST_STD_EXTENSION_NAMESPACE::hash_multiset<Kty,Tr,Alloc> >
        : boost::mpl::true_
    {};

#endif

}

#endif
