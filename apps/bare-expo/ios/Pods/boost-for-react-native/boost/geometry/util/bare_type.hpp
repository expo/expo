// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2012 Bruno Lalande, Paris, France.
// Copyright (c) 2012 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2014.
// Modifications copyright (c) 2014 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_UTIL_BARE_TYPE_HPP
#define BOOST_GEOMETRY_UTIL_BARE_TYPE_HPP


#include <boost/type_traits/remove_const.hpp>
#include <boost/type_traits/remove_pointer.hpp>
#include <boost/type_traits/remove_reference.hpp>


namespace boost { namespace geometry
{

namespace util
{

template <typename T>
struct bare_type
{
    typedef typename boost::remove_const
        <
            typename boost::remove_pointer
                <
                    typename boost::remove_reference
                        <
                            T
                        >::type
                >::type
        >::type type;
};


} // namespace util

}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_UTIL_BARE_TYPE_HPP
