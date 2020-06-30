// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_NORMALIZE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_NORMALIZE_HPP

#include <cstddef>

#include <boost/numeric/conversion/cast.hpp>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/coordinate_system.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/tag.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/util/normalize_spheroidal_coordinates.hpp>
#include <boost/geometry/util/normalize_spheroidal_box_coordinates.hpp>

#include <boost/geometry/views/detail/indexed_point_view.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace normalization
{


struct do_nothing
{
    template <typename GeometryIn, typename GeometryOut>
    static inline void apply(GeometryIn const&, GeometryOut&)
    {
    }
};


template <std::size_t Dimension, std::size_t DimensionCount>
struct assign_loop
{
    template <typename CoordinateType, typename PointIn, typename PointOut>
    static inline void apply(CoordinateType const& longitude,
                             CoordinateType const& latitude,
                             PointIn const& point_in,
                             PointOut& point_out)
    {
        geometry::set<Dimension>(point_out, boost::numeric_cast
            <
                typename coordinate_type<PointOut>::type
            >(geometry::get<Dimension>(point_in)));

        assign_loop
            <
                Dimension + 1, DimensionCount
            >::apply(longitude, latitude, point_in, point_out);
    }
};

template <std::size_t DimensionCount>
struct assign_loop<DimensionCount, DimensionCount>
{
    template <typename CoordinateType, typename PointIn, typename PointOut>
    static inline void apply(CoordinateType const&,
                             CoordinateType const&,
                             PointIn const&,
                             PointOut&)
    {
    }
};

template <std::size_t DimensionCount>
struct assign_loop<0, DimensionCount>
{
    template <typename CoordinateType, typename PointIn, typename PointOut>
    static inline void apply(CoordinateType const& longitude,
                             CoordinateType const& latitude,
                             PointIn const& point_in,
                             PointOut& point_out)
    {
        geometry::set<0>(point_out, boost::numeric_cast
            <
                typename coordinate_type<PointOut>::type
            >(longitude));

        assign_loop
            <
                1, DimensionCount
            >::apply(longitude, latitude, point_in, point_out);
    }
};

template <std::size_t DimensionCount>
struct assign_loop<1, DimensionCount>
{
    template <typename CoordinateType, typename PointIn, typename PointOut>
    static inline void apply(CoordinateType const& longitude,
                             CoordinateType const& latitude,
                             PointIn const& point_in,
                             PointOut& point_out)
    {
        geometry::set<1>(point_out, boost::numeric_cast
            <
                typename coordinate_type<PointOut>::type
            >(latitude));

        assign_loop
            <
                2, DimensionCount
            >::apply(longitude, latitude, point_in, point_out);
    }
};


template <typename PointIn, typename PointOut>
struct normalize_point
{
    static inline void apply(PointIn const& point_in, PointOut& point_out)
    {
        typedef typename coordinate_type<PointIn>::type in_coordinate_type;

        in_coordinate_type longitude = geometry::get<0>(point_in);
        in_coordinate_type latitude = geometry::get<1>(point_in);

        math::normalize_spheroidal_coordinates
            <
                typename coordinate_system<PointIn>::type::units,
                in_coordinate_type
            >(longitude, latitude);

        assign_loop
            <
                0, dimension<PointIn>::value
            >::apply(longitude, latitude, point_in, point_out);
    }
};


template <typename BoxIn, typename BoxOut>
class normalize_box
{
    template <typename UnitsIn, typename UnitsOut, typename CoordinateInType>
    static inline void apply_to_coordinates(CoordinateInType& lon_min,
                                            CoordinateInType& lat_min,
                                            CoordinateInType& lon_max,
                                            CoordinateInType& lat_max,
                                            BoxIn const& box_in,
                                            BoxOut& box_out)
    {
        detail::indexed_point_view<BoxOut, min_corner> p_min_out(box_out);
        assign_loop
            <
                0, dimension<BoxIn>::value
            >::apply(lon_min,
                     lat_min,
                     detail::indexed_point_view
                         <
                             BoxIn const, min_corner
                         >(box_in),
                     p_min_out);

        detail::indexed_point_view<BoxOut, max_corner> p_max_out(box_out);
        assign_loop
            <
                0, dimension<BoxIn>::value
            >::apply(lon_max,
                     lat_max,
                     detail::indexed_point_view
                         <
                             BoxIn const, max_corner
                         >(box_in),
                     p_max_out);
    }

public:
    static inline void apply(BoxIn const& box_in, BoxOut& box_out)
    {
        typedef typename coordinate_type<BoxIn>::type in_coordinate_type;

        in_coordinate_type lon_min = geometry::get<min_corner, 0>(box_in);
        in_coordinate_type lat_min = geometry::get<min_corner, 1>(box_in);
        in_coordinate_type lon_max = geometry::get<max_corner, 0>(box_in);
        in_coordinate_type lat_max = geometry::get<max_corner, 1>(box_in);

        math::normalize_spheroidal_box_coordinates
            <
                typename coordinate_system<BoxIn>::type::units,
                in_coordinate_type
            >(lon_min, lat_min, lon_max, lat_max);

        apply_to_coordinates
            <
                typename coordinate_system<BoxIn>::type::units,
                typename coordinate_system<BoxOut>::type::units
            >(lon_min, lat_min, lon_max, lat_max, box_in, box_out);
    }
};


}} // namespace detail::normalization
#endif // DOXYGEN_NO_DETAIL

#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

template
<
    typename GeometryIn,
    typename GeometryOut,
    typename TagIn = typename tag<GeometryIn>::type,
    typename TagOut = typename tag<GeometryOut>::type,
    typename CSTagIn = typename cs_tag<GeometryIn>::type,
    typename CSTagOut = typename cs_tag<GeometryOut>::type
>
struct normalize : detail::normalization::do_nothing
{};


template <typename PointIn, typename PointOut>
struct normalize
    <
        PointIn, PointOut, point_tag, point_tag,
        spherical_equatorial_tag, spherical_equatorial_tag
    > : detail::normalization::normalize_point<PointIn, PointOut>
{};


template <typename PointIn, typename PointOut>
struct normalize
    <
        PointIn, PointOut, point_tag, point_tag, geographic_tag, geographic_tag
    > : detail::normalization::normalize_point<PointIn, PointOut>
{};


template <typename BoxIn, typename BoxOut>
struct normalize
    <
        BoxIn, BoxOut, box_tag, box_tag,
        spherical_equatorial_tag, spherical_equatorial_tag
    > : detail::normalization::normalize_box<BoxIn, BoxOut>
{};


template <typename BoxIn, typename BoxOut>
struct normalize
    <
        BoxIn, BoxOut, box_tag, box_tag, geographic_tag, geographic_tag
    > : detail::normalization::normalize_box<BoxIn, BoxOut>
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


#ifndef DOXYGEN_NO_DETAIL
namespace detail
{


template <typename GeometryIn, typename GeometryOut>
inline void normalize(GeometryIn const& geometry_in, GeometryOut& geometry_out)
{
    dispatch::normalize
        <
            GeometryIn, GeometryOut
        >::apply(geometry_in, geometry_out);
}

template <typename GeometryOut, typename GeometryIn>
inline GeometryOut return_normalized(GeometryIn const& geometry_in)
{
    GeometryOut geometry_out;
    detail::normalize(geometry_in, geometry_out);
    return geometry_out;
}


} // namespace detail
#endif // DOXYGEN_NO_DETAIL

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_NORMALIZE_HPP
