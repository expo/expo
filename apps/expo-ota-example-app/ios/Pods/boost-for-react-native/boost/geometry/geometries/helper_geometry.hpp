// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_GEOMETRIES_HELPER_GEOMETRY_HPP
#define BOOST_GEOMETRY_GEOMETRIES_HELPER_GEOMETRY_HPP

#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/core/point_type.hpp>
#include <boost/geometry/core/tag.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/geometries/box.hpp>
#include <boost/geometry/geometries/point.hpp>

#include <boost/geometry/algorithms/not_implemented.hpp>


namespace boost { namespace geometry
{

namespace detail { namespace helper_geometries
{

template <typename Geometry, typename CS_Tag = typename cs_tag<Geometry>::type>
struct default_units
{
    typedef typename coordinate_system<Geometry>::type::units type;
};

// The Cartesian coordinate system does not define the type units.
// For that reason the generic implementation for default_units cannot be used
// and specialization needs to be defined.
// Moreover, it makes sense to define the units for the Cartesian
// coordinate system to be radians, as this way a Cartesian point can
// potentially be used in algorithms taking non-Cartesian strategies
// and work as if it was as point in the non-Cartesian coordinate
// system with radian units.
template <typename Geometry>
struct default_units<Geometry, cartesian_tag>
{
    typedef radian type;
};


template <typename Units, typename CS_Tag>
struct cs_tag_to_coordinate_system
{
    typedef cs::cartesian type;
};

template <typename Units>
struct cs_tag_to_coordinate_system<Units, spherical_equatorial_tag>
{
    typedef cs::spherical_equatorial<Units> type;
};

template <typename Units>
struct cs_tag_to_coordinate_system<Units, spherical_tag>
{
    typedef cs::spherical<Units> type;
};

template <typename Units>
struct cs_tag_to_coordinate_system<Units, geographic_tag>
{
    typedef cs::geographic<Units> type;
};


template
<
    typename Point,
    typename NewCoordinateType,
    typename NewUnits,
    typename CS_Tag = typename cs_tag<Point>::type
>
struct helper_point
{
    typedef model::point
        <
            NewCoordinateType,
            dimension<Point>::value,
            typename cs_tag_to_coordinate_system<NewUnits, CS_Tag>::type
        > type;
};


}} // detail::helper_geometries


namespace detail_dispatch
{


template
<
    typename Geometry,
    typename NewCoordinateType,
    typename NewUnits,
    typename Tag = typename tag<Geometry>::type>
struct helper_geometry : not_implemented<Geometry>
{};


template <typename Point, typename NewCoordinateType, typename NewUnits>
struct helper_geometry<Point, NewCoordinateType, NewUnits, point_tag>
{
    typedef typename detail::helper_geometries::helper_point
        <
            Point, NewCoordinateType, NewUnits
        >::type type;
};


template <typename Box, typename NewCoordinateType, typename NewUnits>
struct helper_geometry<Box, NewCoordinateType, NewUnits, box_tag>
{
    typedef model::box
        <
            typename helper_geometry
                <
                    typename point_type<Box>::type, NewCoordinateType, NewUnits
                >::type
        > type;
};


} // detail_dispatch


// Meta-function that provides a new helper geometry of the same kind as
// the input geometry and the same coordinate system type,
// but with a possibly different coordinate type and coordinate system units
template
<
    typename Geometry,
    typename NewCoordinateType = typename coordinate_type<Geometry>::type,
    typename NewUnits = typename detail::helper_geometries::default_units
        <
            Geometry
        >::type
>
struct helper_geometry
{
    typedef typename detail_dispatch::helper_geometry
        <
            Geometry, NewCoordinateType, NewUnits
        >::type type;
};


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_GEOMETRIES_HELPER_GEOMETRY_HPP
