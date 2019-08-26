// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.Dimension. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_POINT_ON_BORDER_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_POINT_ON_BORDER_HPP


#include <cstddef>

#include <boost/range.hpp>

#include <boost/geometry/core/tags.hpp>
#include <boost/geometry/core/point_type.hpp>
#include <boost/geometry/core/ring_type.hpp>

#include <boost/geometry/geometries/concepts/check.hpp>

#include <boost/geometry/algorithms/assign.hpp>
#include <boost/geometry/algorithms/detail/convert_point_to_point.hpp>
#include <boost/geometry/algorithms/detail/equals/point_point.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace point_on_border
{


template<typename Point>
struct get_point
{
    static inline bool apply(Point& destination, Point const& source, bool)
    {
        destination = source;
        return true;
    }
};

template<typename Point, std::size_t Dimension, std::size_t DimensionCount>
struct midpoint_helper
{
    template <typename InputPoint>
    static inline bool apply(Point& p, InputPoint const& p1, InputPoint const& p2)
    {
        typename coordinate_type<Point>::type const two = 2;
        set<Dimension>(p,
                    (get<Dimension>(p1) + get<Dimension>(p2)) / two);
        return midpoint_helper<Point, Dimension + 1, DimensionCount>::apply(p, p1, p2);
    }
};


template <typename Point, std::size_t DimensionCount>
struct midpoint_helper<Point, DimensionCount, DimensionCount>
{
    template <typename InputPoint>
    static inline bool apply(Point& , InputPoint const& , InputPoint const& )
    {
        return true;
    }
};


template<typename Point, typename Range>
struct point_on_range
{
    static inline bool apply(Point& point, Range const& range, bool midpoint)
    {
        const std::size_t n = boost::size(range);
        if (midpoint && n > 1)
        {
            typedef typename boost::range_iterator
                <
                    Range const
                >::type iterator;

            iterator it = boost::begin(range);
            iterator prev = it++;
            while (it != boost::end(range)
                && detail::equals::equals_point_point(*it, *prev))
            {
                prev = it++;
            }
            if (it != boost::end(range))
            {
                return midpoint_helper
                    <
                        Point,
                        0, dimension<Point>::value
                    >::apply(point, *prev, *it);
            }
        }

        if (n > 0)
        {
            geometry::detail::conversion::convert_point_to_point(*boost::begin(range), point);
            return true;
        }
        return false;
    }
};


template<typename Point, typename Polygon>
struct point_on_polygon
{
    static inline bool apply(Point& point, Polygon const& polygon, bool midpoint)
    {
        return point_on_range
            <
                Point,
                typename ring_type<Polygon>::type
            >::apply(point, exterior_ring(polygon), midpoint);
    }
};


template<typename Point, typename Box>
struct point_on_box
{
    static inline bool apply(Point& point, Box const& box, bool midpoint)
    {
        if (midpoint)
        {
            Point p1, p2;
            detail::assign::assign_box_2d_corner<min_corner, min_corner>(box, p1);
            detail::assign::assign_box_2d_corner<max_corner, min_corner>(box, p2);
            midpoint_helper
                <
                    Point,
                    0, dimension<Point>::value
                >::apply(point, p1, p2);
        }
        else
        {
            detail::assign::assign_box_2d_corner<min_corner, min_corner>(box, point);
        }

        return true;
    }
};


template
<
    typename Point,
    typename MultiGeometry,
    typename Policy
>
struct point_on_multi
{
    static inline bool apply(Point& point, MultiGeometry const& multi, bool midpoint)
    {
        // Take a point on the first multi-geometry
        // (i.e. the first that is not empty)
        for (typename boost::range_iterator
                <
                    MultiGeometry const
                >::type it = boost::begin(multi);
            it != boost::end(multi);
            ++it)
        {
            if (Policy::apply(point, *it, midpoint))
            {
                return true;
            }
        }
        return false;
    }
};


}} // namespace detail::point_on_border
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template
<
    typename GeometryTag,
    typename Point,
    typename Geometry

>
struct point_on_border
{};


template<typename Point>
struct point_on_border<point_tag, Point, Point>
    : detail::point_on_border::get_point<Point>
{};


template<typename Point, typename Linestring>
struct point_on_border<linestring_tag, Point, Linestring>
    : detail::point_on_border::point_on_range<Point, Linestring>
{};


template<typename Point, typename Ring>
struct point_on_border<ring_tag, Point, Ring>
    : detail::point_on_border::point_on_range<Point, Ring>
{};


template<typename Point, typename Polygon>
struct point_on_border<polygon_tag, Point, Polygon>
    : detail::point_on_border::point_on_polygon<Point, Polygon>
{};


template<typename Point, typename Box>
struct point_on_border<box_tag, Point, Box>
    : detail::point_on_border::point_on_box<Point, Box>
{};


template<typename Point, typename Multi>
struct point_on_border<multi_polygon_tag, Point, Multi>
    : detail::point_on_border::point_on_multi
        <
            Point,
            Multi,
            detail::point_on_border::point_on_polygon
                <
                    Point,
                    typename boost::range_value<Multi>::type
                >
        >
{};


template<typename Point, typename Multi>
struct point_on_border<multi_linestring_tag, Point, Multi>
    : detail::point_on_border::point_on_multi
        <
            Point,
            Multi,
            detail::point_on_border::point_on_range
                <
                    Point,
                    typename boost::range_value<Multi>::type
                >
        >
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


/*!
\brief Take point on a border
\ingroup overlay
\tparam Geometry geometry type. This also defines the type of the output point
\param point to assign
\param geometry geometry to take point from
\param midpoint boolean flag, true if the point should not be a vertex, but some point
    in between of two vertices
\return TRUE if successful, else false.
    It is only false if polygon/line have no points
\note for a polygon, it is always a point on the exterior ring
\note for take_midpoint, it is not taken from two consecutive duplicate vertices,
    (unless there are no other).
 */
template <typename Point, typename Geometry>
inline bool point_on_border(Point& point,
            Geometry const& geometry,
            bool midpoint = false)
{
    concepts::check<Point>();
    concepts::check<Geometry const>();

    return dispatch::point_on_border
            <
                typename tag<Geometry>::type,
                Point,
                Geometry
            >::apply(point, geometry, midpoint);
}


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_POINT_ON_BORDER_HPP
