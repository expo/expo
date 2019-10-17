/*
 * Distributed under the Boost Software License, Version 1.0.
 * (See accompanying file LICENSE_1_0.txt or copy at
 * http://www.boost.org/LICENSE_1_0.txt)
 *
 * Copyright (c) 2009 Helge Bahmann
 * Copyright (c) 2012 Tim Blechmann
 * Copyright (c) 2013 - 2014 Andrey Semashev
 */
/*!
 * \file   atomic/detail/casts.hpp
 *
 * This header defines \c union_cast and \c memcpy_cast used to convert between storage and value types
 */

#ifndef BOOST_ATOMIC_DETAIL_CASTS_HPP_INCLUDED_
#define BOOST_ATOMIC_DETAIL_CASTS_HPP_INCLUDED_

#include <cstring>
#include <boost/atomic/detail/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

namespace boost {
namespace atomics {
namespace detail {

template< typename To, typename From >
BOOST_FORCEINLINE To union_cast(From const& from) BOOST_NOEXCEPT
{
    union
    {
        To as_to;
        From as_from;
    }
    caster = {};
    caster.as_from = from;
    return caster.as_to;
}

template< typename To, typename From >
BOOST_FORCEINLINE To memcpy_cast(From const& from) BOOST_NOEXCEPT
{
    struct
    {
        To to;
    }
    value = {};
    std::memcpy
    (
        &reinterpret_cast< char& >(value.to),
        &reinterpret_cast< const char& >(from),
        (sizeof(From) < sizeof(To) ? sizeof(From) : sizeof(To))
    );
    return value.to;
}

} // namespace detail
} // namespace atomics
} // namespace boost

#endif // BOOST_ATOMIC_DETAIL_CASTS_HPP_INCLUDED_
