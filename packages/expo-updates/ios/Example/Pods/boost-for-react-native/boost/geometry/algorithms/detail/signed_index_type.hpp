// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2014, Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_SIGNED_INDEX_TYPE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_SIGNED_INDEX_TYPE_HPP


#include <cstddef>
#include <boost/type_traits/make_signed.hpp>


namespace boost { namespace geometry
{


typedef boost::make_signed<std::size_t>::type signed_index_type;
//typedef std::ptrdiff_t signed_index_type;


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_SIGNED_INDEX_TYPE_HPP
