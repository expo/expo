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
// std_hash_set_fwd.hpp
//
/////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_PHOENIX_STD_HASH_SET_FWD_EN_16_12_2004
#define BOOST_PHOENIX_STD_HASH_SET_FWD_EN_16_12_2004

#include <boost/phoenix/config.hpp>

#if defined(BOOST_HAS_HASH)

namespace BOOST_STD_EXTENSION_NAMESPACE
{
    template<
        class Kty
      , class Hash
      , class Cmp
      , class Alloc
    >
    class hash_set;

    template<
        class Kty
      , class Hash
      , class Cmp
      , class Alloc
    >
    class hash_multiset;
}

#elif defined(BOOST_DINKUMWARE_STDLIB)

namespace BOOST_STD_EXTENSION_NAMESPACE
{
    template<
        class Kty
      , class Tr
      , class Alloc
    >
    class hash_set;

    template<
        class Kty
      , class Tr
      , class Alloc
    >
    class hash_multiset;
}

#endif

#endif
