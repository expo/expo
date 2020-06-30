// Boost.Geometry Index
//
// boxes union/intersection area/volume
//
// Copyright (c) 2011-2016 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_DETAIL_ALGORITHMS_INTERSECTION_CONTENT_HPP
#define BOOST_GEOMETRY_INDEX_DETAIL_ALGORITHMS_INTERSECTION_CONTENT_HPP

#include <boost/geometry/algorithms/intersection.hpp>
#include <boost/geometry/strategies/intersection_strategies.hpp>
#include <boost/geometry/index/detail/algorithms/content.hpp>

namespace boost { namespace geometry { namespace index { namespace detail {

/**
 * \brief Compute the area of the intersection of b1 and b2
 */
template <typename Box>
inline typename default_content_result<Box>::type intersection_content(Box const& box1, Box const& box2)
{
    if ( geometry::intersects(box1, box2) )
    {
        Box box_intersection;
        if ( geometry::intersection(box1, box2, box_intersection) )
            return detail::content(box_intersection);
    }
    return 0;
}

}}}} // namespace boost::geometry::index::detail

#endif // BOOST_GEOMETRY_INDEX_DETAIL_ALGORITHMS_INTERSECTION_CONTENT_HPP
