// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2015 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2015 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2015.
// Modifications copyright (c) 2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_POINT_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_POINT_HPP

#include <cstddef>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/coordinate_system.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/views/detail/indexed_point_view.hpp>

#include <boost/geometry/algorithms/detail/convert_point_to_point.hpp>
#include <boost/geometry/algorithms/detail/normalize.hpp>

#include <boost/geometry/algorithms/detail/envelope/transform_units.hpp>

#include <boost/geometry/algorithms/dispatch/envelope.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace envelope
{


template <std::size_t Dimension, std::size_t DimensionCount>
struct envelope_one_point
{
    template <std::size_t Index, typename Point, typename Box>
    static inline void apply(Point const& point, Box& mbr)
    {
        detail::indexed_point_view<Box, Index> box_corner(mbr);
        detail::conversion::point_to_point
            <
                Point,
                detail::indexed_point_view<Box, Index>,
                Dimension,
                DimensionCount
            >::apply(point, box_corner);
    }

    template <typename Point, typename Box>
    static inline void apply(Point const& point, Box& mbr)
    {
        apply<min_corner>(point, mbr);
        apply<max_corner>(point, mbr);
    }
};


struct envelope_point_on_spheroid
{
    template<typename Point, typename Box>
    static inline void apply(Point const& point, Box& mbr)
    {
        Point normalized_point = detail::return_normalized<Point>(point);

        typename point_type<Box>::type box_point;

        // transform units of input point to units of a box point
        transform_units(normalized_point, box_point);

        geometry::set<min_corner, 0>(mbr, geometry::get<0>(box_point));
        geometry::set<min_corner, 1>(mbr, geometry::get<1>(box_point));

        geometry::set<max_corner, 0>(mbr, geometry::get<0>(box_point));
        geometry::set<max_corner, 1>(mbr, geometry::get<1>(box_point));

        envelope_one_point
            <
                2, dimension<Point>::value
            >::apply(normalized_point, mbr);
    }
};


}} // namespace detail::envelope
#endif // DOXYGEN_NO_DETAIL

#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename Point, typename CS_Tag>
struct envelope<Point, point_tag, CS_Tag>
    : detail::envelope::envelope_one_point<0, dimension<Point>::value>
{};


template <typename Point>
struct envelope<Point, point_tag, spherical_equatorial_tag>
    : detail::envelope::envelope_point_on_spheroid
{};


template <typename Point>
struct envelope<Point, point_tag, geographic_tag>
    : detail::envelope::envelope_point_on_spheroid
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_POINT_HPP
