// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2012-2014 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_LINE_LINE_INTERSECTION_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_LINE_LINE_INTERSECTION_HPP


#include <boost/geometry/arithmetic/determinant.hpp>
#include <boost/geometry/util/math.hpp>
#include <boost/geometry/strategies/buffer.hpp>
#include <boost/geometry/algorithms/detail/buffer/parallel_continue.hpp>

namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace buffer
{


// TODO: once change this to proper strategy
// It is different from current segment intersection because these are not segments but lines
// If we have the Line concept, we can create a strategy
// Assumes a convex corner
struct line_line_intersection
{

    template <typename Point>
    static inline strategy::buffer::join_selector apply(Point const& pi, Point const& pj,
        Point const& qi, Point const& qj, Point& ip)
    {
        // See http://mathworld.wolfram.com/Line-LineIntersection.html
        typedef typename coordinate_type<Point>::type coordinate_type;

        coordinate_type const denominator
            = determinant<coordinate_type>(get<0>(pi) - get<0>(pj),
                get<1>(pi) - get<1>(pj),
                get<0>(qi) - get<0>(qj),
                get<1>(qi) - get<1>(qj));

        // Even if the corner was checked before (so it is convex now), that
        // was done on the original geometry. This function runs on the buffered
        // geometries, where sides are generated and might be slightly off. In
        // Floating Point, that slightly might just exceed the limit and we have
        // to check it again.

        // For round joins, it will not be used at all.
        // For miter joints, there is a miter limit
        // If segments are parallel/collinear we must be distinguish two cases:
        // they continue each other, or they form a spike
        if (math::equals(denominator, coordinate_type()))
        {
            return parallel_continue(get<0>(qj) - get<0>(qi),
                                get<1>(qj) - get<1>(qi),
                                get<0>(pj) - get<0>(pi),
                                get<1>(pj) - get<1>(pi))
                ? strategy::buffer::join_continue
                : strategy::buffer::join_spike
                ;
        }

        coordinate_type d1 = determinant<coordinate_type>(get<0>(pi), get<1>(pi), get<0>(pj), get<1>(pj));
        coordinate_type d2 = determinant<coordinate_type>(get<0>(qi), get<1>(qi), get<0>(qj), get<1>(qj));

        double const multiplier = 1.0 / denominator;

        set<0>(ip, determinant<coordinate_type>(d1, get<0>(pi) - get<0>(pj), d2, get<0>(qi) - get<0>(qj)) * multiplier);
        set<1>(ip, determinant<coordinate_type>(d1, get<1>(pi) - get<1>(pj), d2, get<1>(qi) - get<1>(qj)) * multiplier);

        return strategy::buffer::join_convex;
    }
};


}} // namespace detail::buffer
#endif // DOXYGEN_NO_DETAIL


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_LINE_LINE_INTERSECTION_HPP
