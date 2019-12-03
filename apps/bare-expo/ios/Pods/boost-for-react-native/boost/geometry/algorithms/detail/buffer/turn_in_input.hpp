// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2012-2014 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_TURN_IN_INPUT_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_TURN_IN_INPUT_HPP

#include <boost/geometry/core/tags.hpp>
#include <boost/geometry/algorithms/covered_by.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace buffer
{

// Checks if an turn/intersection point is inside (or covered by) the input geometry

template <typename Tag>
struct turn_in_input
{
};

template <>
struct turn_in_input<polygon_tag>
{
    template <typename Point, typename Geometry>
    static inline int apply(Point const& point, Geometry const& geometry)
    {
        return geometry::covered_by(point, geometry) ? 1 : -1;
    }
};

template <>
struct turn_in_input<linestring_tag>
{
    template <typename Point, typename Geometry>
    static inline int apply(Point const& , Geometry const& )
    {
        return 0;
    }
};

template <>
struct turn_in_input<point_tag>
{
    template <typename Point, typename Geometry>
    static inline int apply(Point const& , Geometry const& )
    {
        return 0;
    }
};

template <>
struct turn_in_input<multi_polygon_tag>
{
    template <typename Point, typename Geometry>
    static inline int apply(Point const& point, Geometry const& geometry)
    {
        return geometry::covered_by(point, geometry) ? 1 : -1;
    }
};

template <>
struct turn_in_input<multi_linestring_tag>
{
    template <typename Point, typename Geometry>
    static inline int apply(Point const& , Geometry const& )
    {
        return 0;
    }
};

template <>
struct turn_in_input<multi_point_tag>
{
    template <typename Point, typename Geometry>
    static inline int apply(Point const& , Geometry const& )
    {
        return 0;
    }
};


}} // namespace detail::buffer
#endif // DOXYGEN_NO_DETAIL



}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_TURN_IN_INPUT_HPP
