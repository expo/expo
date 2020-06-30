// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2014 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2014 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2014 Mateusz Loskot, London, UK.
// Copyright (c) 2013-2014 Adam Wulkiewicz, Lodz, Poland.

// This file was modified by Oracle on 2014.
// Modifications copyright (c) 2014, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_POINT_TO_GEOMETRY_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_POINT_TO_GEOMETRY_HPP

#include <iterator>

#include <boost/core/ignore_unused.hpp>
#include <boost/range.hpp>
#include <boost/type_traits/is_same.hpp>

#include <boost/geometry/core/closure.hpp>
#include <boost/geometry/core/point_type.hpp>
#include <boost/geometry/core/exterior_ring.hpp>
#include <boost/geometry/core/interior_rings.hpp>
#include <boost/geometry/core/tag.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/util/math.hpp>

#include <boost/geometry/strategies/distance.hpp>
#include <boost/geometry/strategies/tags.hpp>

#include <boost/geometry/algorithms/assign.hpp>
#include <boost/geometry/algorithms/covered_by.hpp>
#include <boost/geometry/algorithms/within.hpp>

#include <boost/geometry/algorithms/detail/closest_feature/geometry_to_range.hpp>
#include <boost/geometry/algorithms/detail/closest_feature/point_to_range.hpp>
#include <boost/geometry/algorithms/detail/distance/is_comparable.hpp>
#include <boost/geometry/algorithms/detail/distance/iterator_selector.hpp>

#include <boost/geometry/algorithms/dispatch/distance.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace distance
{


template <typename P1, typename P2, typename Strategy>
struct point_to_point
{
    static inline
    typename strategy::distance::services::return_type<Strategy, P1, P2>::type
    apply(P1 const& p1, P2 const& p2, Strategy const& strategy)
    {
        boost::ignore_unused(strategy);
        return strategy.apply(p1, p2);
    }
};


template
<
    typename Point,
    typename Range,
    closure_selector Closure,
    typename Strategy
>
class point_to_range
{
private:
    typedef typename strategy::distance::services::comparable_type
        <
            Strategy
        >::type comparable_strategy;

    typedef detail::closest_feature::point_to_point_range
        <
            Point, Range, Closure, comparable_strategy
        > point_to_point_range;

public:
    typedef typename strategy::distance::services::return_type
        <
            Strategy,
            Point,
            typename boost::range_value<Range>::type
        >::type return_type;

    static inline return_type apply(Point const& point, Range const& range,
                                    Strategy const& strategy)
    {
        return_type const zero = return_type(0);

        if (boost::size(range) == 0)
        {
            return zero;
        }

        namespace sds = strategy::distance::services;

        typename sds::return_type
            <
                comparable_strategy,
                Point,
                typename point_type<Range>::type
            >::type cd_min;

        std::pair
            <
                typename boost::range_iterator<Range const>::type,
                typename boost::range_iterator<Range const>::type
            > it_pair
            = point_to_point_range::apply(point,
                                          boost::begin(range),
                                          boost::end(range),
                                          sds::get_comparable
                                              <
                                                  Strategy
                                              >::apply(strategy),
                                          cd_min);

        return
            is_comparable<Strategy>::value
            ?
            cd_min
            :
            strategy.apply(point, *it_pair.first, *it_pair.second);
    }
};


template
<
    typename Point,
    typename Ring,
    closure_selector Closure,
    typename Strategy
>
struct point_to_ring
{
    typedef typename strategy::distance::services::return_type
        <
            Strategy, Point, typename point_type<Ring>::type
        >::type return_type;

    static inline return_type apply(Point const& point,
                                    Ring const& ring,
                                    Strategy const& strategy)
    {
        if (geometry::within(point, ring))
        {
            return return_type(0);
        }

        return point_to_range
            <
                Point, Ring, closure<Ring>::value, Strategy
            >::apply(point, ring, strategy);
    }
};


template
<
    typename Point,
    typename Polygon,
    closure_selector Closure,
    typename Strategy
>
class point_to_polygon
{
public:
    typedef typename strategy::distance::services::return_type
        <
            Strategy, Point, typename point_type<Polygon>::type
        >::type return_type;

private:
    typedef point_to_range
        <
            Point, typename ring_type<Polygon>::type, Closure, Strategy
        > per_ring;

    struct distance_to_interior_rings
    {
        template <typename InteriorRingIterator>
        static inline return_type apply(Point const& point,
                                        InteriorRingIterator first,
                                        InteriorRingIterator last,
                                        Strategy const& strategy)
        {
            for (InteriorRingIterator it = first; it != last; ++it)
            {
                if (geometry::within(point, *it))
                {
                    // the point is inside a polygon hole, so its distance
                    // to the polygon its distance to the polygon's
                    // hole boundary
                    return per_ring::apply(point, *it, strategy);
                }
            }
            return 0;
        }

        template <typename InteriorRings>
        static inline return_type apply(Point const& point,
                                        InteriorRings const& interior_rings,
                                        Strategy const& strategy)
        {
            return apply(point,
                         boost::begin(interior_rings),
                         boost::end(interior_rings),
                         strategy);
        }
    };


public:
    static inline return_type apply(Point const& point,
                                    Polygon const& polygon,
                                    Strategy const& strategy)
    {
        if (!geometry::covered_by(point, exterior_ring(polygon)))
        {
            // the point is outside the exterior ring, so its distance
            // to the polygon is its distance to the polygon's exterior ring
            return per_ring::apply(point, exterior_ring(polygon), strategy);
        }

        // Check interior rings
        return distance_to_interior_rings::apply(point,
                                                 interior_rings(polygon),
                                                 strategy);
    }
};


template
<
    typename Point,
    typename MultiGeometry,
    typename Strategy,
    bool CheckCoveredBy = boost::is_same
        <
            typename tag<MultiGeometry>::type, multi_polygon_tag
        >::value
>
class point_to_multigeometry
{
private:
    typedef detail::closest_feature::geometry_to_range geometry_to_range;

public:
    typedef typename strategy::distance::services::return_type
        <
            Strategy,
            Point,
            typename point_type<MultiGeometry>::type
        >::type return_type;

    static inline return_type apply(Point const& point,
                                    MultiGeometry const& multigeometry,
                                    Strategy const& strategy)
    {
        typedef iterator_selector<MultiGeometry const> selector_type;

        namespace sds = strategy::distance::services;

        typename sds::return_type
            <
                typename sds::comparable_type<Strategy>::type,
                Point,
                typename point_type<MultiGeometry>::type
            >::type cd;

        typename selector_type::iterator_type it_min
            = geometry_to_range::apply(point,
                                       selector_type::begin(multigeometry),
                                       selector_type::end(multigeometry),
                                       sds::get_comparable
                                           <
                                               Strategy
                                           >::apply(strategy),
                                       cd);

        return
            is_comparable<Strategy>::value
            ?
            cd
            :
            dispatch::distance
                <
                    Point,
                    typename std::iterator_traits
                        <
                            typename selector_type::iterator_type
                        >::value_type,
                    Strategy
                >::apply(point, *it_min, strategy);
    }
};


// this is called only for multipolygons, hence the change in the
// template parameter name MultiGeometry to MultiPolygon
template <typename Point, typename MultiPolygon, typename Strategy>
struct point_to_multigeometry<Point, MultiPolygon, Strategy, true>
{
    typedef typename strategy::distance::services::return_type
        <
            Strategy,
            Point,
            typename point_type<MultiPolygon>::type
        >::type return_type;

    static inline return_type apply(Point const& point,
                                    MultiPolygon const& multipolygon,
                                    Strategy const& strategy)
    {
        if (geometry::covered_by(point, multipolygon))
        {
            return 0;
        }

        return point_to_multigeometry
            <
                Point, MultiPolygon, Strategy, false
            >::apply(point, multipolygon, strategy);
    }
};


}} // namespace detail::distance
#endif // DOXYGEN_NO_DETAIL




#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


// Point-point
template <typename P1, typename P2, typename Strategy>
struct distance
    <
        P1, P2, Strategy, point_tag, point_tag,
        strategy_tag_distance_point_point, false
    > : detail::distance::point_to_point<P1, P2, Strategy>
{};


// Point-line version 2, where point-segment strategy is specified
template <typename Point, typename Linestring, typename Strategy>
struct distance
    <
        Point, Linestring, Strategy, point_tag, linestring_tag,
        strategy_tag_distance_point_segment, false
    > : detail::distance::point_to_range<Point, Linestring, closed, Strategy>
{};


// Point-ring , where point-segment strategy is specified
template <typename Point, typename Ring, typename Strategy>
struct distance
    <
        Point, Ring, Strategy, point_tag, ring_tag,
        strategy_tag_distance_point_segment, false
    > : detail::distance::point_to_ring
        <
            Point, Ring, closure<Ring>::value, Strategy
        >
{};


// Point-polygon , where point-segment strategy is specified
template <typename Point, typename Polygon, typename Strategy>
struct distance
    <
        Point, Polygon, Strategy, point_tag, polygon_tag, 
        strategy_tag_distance_point_segment, false
    > : detail::distance::point_to_polygon
        <
            Point, Polygon, closure<Polygon>::value, Strategy
        >
{};


// Point-segment version 2, with point-segment strategy
template <typename Point, typename Segment, typename Strategy>
struct distance
    <
        Point, Segment, Strategy, point_tag, segment_tag,
        strategy_tag_distance_point_segment, false
    >
{
    static inline typename strategy::distance::services::return_type
        <
            Strategy, Point, typename point_type<Segment>::type
        >::type apply(Point const& point,
                      Segment const& segment,
                      Strategy const& strategy)
    {
        typename point_type<Segment>::type p[2];
        geometry::detail::assign_point_from_index<0>(segment, p[0]);
        geometry::detail::assign_point_from_index<1>(segment, p[1]);

        boost::ignore_unused(strategy);
        return strategy.apply(point, p[0], p[1]);
    }
};


template <typename Point, typename Box, typename Strategy>
struct distance
    <
         Point, Box, Strategy, point_tag, box_tag,
         strategy_tag_distance_point_box, false
    >
{
    static inline typename strategy::distance::services::return_type
        <
            Strategy, Point, typename point_type<Box>::type
        >::type
    apply(Point const& point, Box const& box, Strategy const& strategy)
    {
        boost::ignore_unused(strategy);
        return strategy.apply(point, box);
    }
};


template<typename Point, typename MultiPoint, typename Strategy>
struct distance
    <
        Point, MultiPoint, Strategy, point_tag, multi_point_tag,
        strategy_tag_distance_point_point, false
    > : detail::distance::point_to_multigeometry
        <
            Point, MultiPoint, Strategy
        >
{};


template<typename Point, typename MultiLinestring, typename Strategy>
struct distance
    <
        Point, MultiLinestring, Strategy, point_tag, multi_linestring_tag,
        strategy_tag_distance_point_segment, false
    > : detail::distance::point_to_multigeometry
        <
            Point, MultiLinestring, Strategy
        >
{};


template<typename Point, typename MultiPolygon, typename Strategy>
struct distance
    <
        Point, MultiPolygon, Strategy, point_tag, multi_polygon_tag,
        strategy_tag_distance_point_segment, false
    > : detail::distance::point_to_multigeometry
        <
            Point, MultiPolygon, Strategy
        >
{};


template <typename Point, typename Linear, typename Strategy>
struct distance
    <
         Point, Linear, Strategy, point_tag, linear_tag,
         strategy_tag_distance_point_segment, false
    > : distance
        <
            Point, Linear, Strategy,
            point_tag, typename tag<Linear>::type,
            strategy_tag_distance_point_segment, false
        >
{};


template <typename Point, typename Areal, typename Strategy>
struct distance
    <
         Point, Areal, Strategy, point_tag, areal_tag,
         strategy_tag_distance_point_segment, false
    > : distance
        <
            Point, Areal, Strategy,
            point_tag, typename tag<Areal>::type,
            strategy_tag_distance_point_segment, false
        >
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_POINT_TO_GEOMETRY_HPP
