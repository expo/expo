// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2015 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2015 Mateusz Loskot, London, UK.
// Copyright (c) 2013-2015 Adam Wulkiewicz, Lodz, Poland

// This file was modified by Oracle on 2013-2016.
// Modifications copyright (c) 2013-2016, Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle
// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_POINT_BOX_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_POINT_BOX_HPP

#include <cstddef>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/algorithms/dispatch/disjoint.hpp>
#include <boost/geometry/strategies/cartesian/point_in_box.hpp>

namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace disjoint
{


/*!
    \brief Internal utility function to detect if point/box are disjoint
 */
template <typename Point, typename Box>
inline bool disjoint_point_box(Point const& point, Box const& box)
{
    // ! covered_by(point, box)
    return ! strategy::within::relate_point_box_loop
                <
                    strategy::within::covered_by_range,
                    Point, Box,
                    0, dimension<Point>::type::value
                >::apply(point, box);
}


}} // namespace detail::disjoint
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename Point, typename Box, std::size_t DimensionCount>
struct disjoint<Point, Box, DimensionCount, point_tag, box_tag, false>
{
    static inline bool apply(Point const& point, Box const& box)
    {
        // ! covered_by(point, box)
        return ! strategy::within::relate_point_box_loop
                    <
                        strategy::within::covered_by_range,
                        Point, Box,
                        0, DimensionCount
                    >::apply(point, box);
    }
};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_POINT_BOX_HPP
