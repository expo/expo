// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2014, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_LINEAR_TO_LINEAR_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_LINEAR_TO_LINEAR_HPP

#include <boost/geometry/core/point_type.hpp>

#include <boost/geometry/strategies/distance.hpp>

#include <boost/geometry/iterators/point_iterator.hpp>
#include <boost/geometry/iterators/segment_iterator.hpp>

#include <boost/geometry/algorithms/num_points.hpp>
#include <boost/geometry/algorithms/num_segments.hpp>

#include <boost/geometry/algorithms/dispatch/distance.hpp>

#include <boost/geometry/algorithms/detail/distance/range_to_geometry_rtree.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace distance
{


template <typename Linear1, typename Linear2, typename Strategy>
struct linear_to_linear
{
    typedef typename strategy::distance::services::return_type
        <
            Strategy,
            typename point_type<Linear1>::type,
            typename point_type<Linear2>::type
        >::type return_type;

    static inline return_type apply(Linear1 const& linear1,
                                    Linear2 const& linear2,
                                    Strategy const& strategy,
                                    bool = false)
    {
        if (geometry::num_points(linear1) == 1)
        {
            return dispatch::distance
                <
                    typename point_type<Linear1>::type,
                    Linear2,
                    Strategy
                >::apply(*points_begin(linear1), linear2, strategy);
        }

        if (geometry::num_points(linear2) == 1)
        {
            return dispatch::distance
                <
                    typename point_type<Linear2>::type,
                    Linear1,
                    Strategy
                >::apply(*points_begin(linear2), linear1, strategy);
        }

        if (geometry::num_segments(linear2) < geometry::num_segments(linear1))
        {
            return point_or_segment_range_to_geometry_rtree
                <
                    geometry::segment_iterator<Linear2 const>,
                    Linear1,
                    Strategy
                >::apply(geometry::segments_begin(linear2),
                         geometry::segments_end(linear2),
                         linear1,
                         strategy);

        }

        return point_or_segment_range_to_geometry_rtree
            <
                geometry::segment_iterator<Linear1 const>,
                Linear2,
                Strategy
            >::apply(geometry::segments_begin(linear1),
                     geometry::segments_end(linear1),
                     linear2,
                     strategy);
    }
};


}} // namespace detail::distance
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

template <typename Linear1, typename Linear2, typename Strategy>
struct distance
    <
        Linear1, Linear2, Strategy,
        linear_tag, linear_tag, 
        strategy_tag_distance_point_segment, false
    > : detail::distance::linear_to_linear
        <
            Linear1, Linear2, Strategy
        >
{};

} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_LINEAR_TO_LINEAR_HPP
