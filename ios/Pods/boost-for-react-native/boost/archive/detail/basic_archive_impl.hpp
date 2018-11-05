#ifndef BOOST_ARCHIVE_DETAIL_BASIC_ARCHIVE_IMPL_HPP
#define BOOST_ARCHIVE_DETAIL_BASIC_ARCHIVE_IMPL_HPP

// MS compatible compilers support #pragma once
#if defined(_MSC_VER)
# pragma once
#endif

/////////1/////////2/////////3/////////4/////////5/////////6/////////7/////////8
// basic_archive_impl.hpp:

// (C) Copyright 2002 Robert Ramey - http://www.rrsd.com . 
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org for updates, documentation, and revision history.

// can't use this - much as I'd like to as borland doesn't support it
// #include <boost/scoped_ptr.hpp>

#include <set>

#include <boost/archive/detail/abi_prefix.hpp> // must be the last header

namespace boost {
namespace serialization {
    class extended_type_info;
} // namespace serialization

namespace archive {
namespace detail {

//////////////////////////////////////////////////////////////////////
class BOOST_ARCHIVE_DECL(BOOST_PP_EMPTY()) basic_archive_impl
{
};

} // namespace detail
} // namespace serialization
} // namespace boost

#include <boost/archive/detail/abi_suffix.hpp> // pops abi_suffix.hpp pragmas

#endif //BOOST_ARCHIVE_DETAIL_BASIC_ARCHIVE_IMPL_HPP



