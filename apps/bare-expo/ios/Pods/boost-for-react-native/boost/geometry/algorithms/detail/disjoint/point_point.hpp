// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2015 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2015 Mateusz Loskot, London, UK.
// Copyright (c) 2013-2015 Adam Wulkiewicz, Lodz, Poland

// This file was modified by Oracle on 2013, 2014, 2015.
// Modifications copyright (c) 2013-2015, Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle
// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_POINT_POINT_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_POINT_POINT_HPP

#include <cstddef>

#include <boost/type_traits/is_same.hpp>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/radian_access.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/coordinate_system.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/util/math.hpp>
#include <boost/geometry/util/select_most_precise.hpp>

#include <boost/geometry/strategies/strategy_transform.hpp>

#include <boost/geometry/geometries/helper_geometry.hpp>

#include <boost/geometry/algorithms/transform.hpp>

#include <boost/geometry/algorithms/detail/normalize.hpp>

#include <boost/geometry/algorithms/dispatch/disjoint.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace disjoint
{


template <std::size_t Dimension, std::size_t DimensionCount>
struct point_point_generic
{
    template <typename Point1, typename Point2>
    static inline bool apply(Point1 const& p1, Point2 const& p2)
    {
        if (! geometry::math::equals(get<Dimension>(p1), get<Dimension>(p2)))
        {
            return true;
        }
        return
            point_point_generic<Dimension + 1, DimensionCount>::apply(p1, p2);
    }
};

template <std::size_t DimensionCount>
struct point_point_generic<DimensionCount, DimensionCount>
{
    template <typename Point1, typename Point2>
    static inline bool apply(Point1 const&, Point2 const&)
    {
        return false;
    }
};


class point_point_on_spheroid
{
private:
    template <typename Point1, typename Point2, bool SameUnits>
    struct are_same_points
    {
        static inline bool apply(Point1 const& point1, Point2 const& point2)
        {
            typedef typename helper_geometry<Point1>::type helper_point_type1;
            typedef typename helper_geometry<Point2>::type helper_point_type2;

            helper_point_type1 point1_normalized
                = return_normalized<helper_point_type1>(point1);
            helper_point_type2 point2_normalized
                = return_normalized<helper_point_type2>(point2);

            return point_point_generic
                <
                    0, dimension<Point1>::value
                >::apply(point1_normalized, point2_normalized);
        }
    };

    template <typename Point1, typename Point2>
    struct are_same_points<Point1, Point2, false> // points have different units
    {
        static inline bool apply(Point1 const& point1, Point2 const& point2)
        {
            typedef typename geometry::select_most_precise
                <
                    typename fp_coordinate_type<Point1>::type,
                    typename fp_coordinate_type<Point2>::type
                >::type calculation_type;

            typename helper_geometry
                <
                    Point1, calculation_type, radian
                >::type helper_point1, helper_point2;

            Point1 point1_normalized = return_normalized<Point1>(point1);
            Point2 point2_normalized = return_normalized<Point2>(point2);

            geometry::transform(point1_normalized, helper_point1);
            geometry::transform(point2_normalized, helper_point2);

            return point_point_generic
                <
                    0, dimension<Point1>::value
                >::apply(helper_point1, helper_point2);
        }
    };

public:
    template <typename Point1, typename Point2>
    static inline bool apply(Point1 const& point1, Point2 const& point2)
    {
        return are_same_points
            <
                Point1,
                Point2,
                boost::is_same
                    <
                        typename coordinate_system<Point1>::type::units,
                        typename coordinate_system<Point2>::type::units
                    >::value
            >::apply(point1, point2);
    }
};


template
<
    typename Point1, typename Point2,
    std::size_t Dimension, std::size_t DimensionCount,
    typename CSTag1 = typename cs_tag<Point1>::type,
    typename CSTag2 = CSTag1
>
struct point_point
    : point_point<Point1, Point2, Dimension, DimensionCount, cartesian_tag>
{};

template
<
    typename Point1, typename Point2,
    std::size_t Dimension, std::size_t DimensionCount
>
struct point_point
    <
        Point1, Point2, Dimension, DimensionCount, spherical_equatorial_tag
    > : point_point_on_spheroid
{};

template
<
    typename Point1, typename Point2,
    std::size_t Dimension, std::size_t DimensionCount
>
struct point_point
    <
        Point1, Point2, Dimension, DimensionCount, geographic_tag
    > : point_point_on_spheroid
{};

template
<
    typename Point1, typename Point2,
    std::size_t Dimension, std::size_t DimensionCount
>
struct point_point<Point1, Point2, Dimension, DimensionCount, cartesian_tag>
    : point_point_generic<Dimension, DimensionCount>
{};


/*!
    \brief Internal utility function to detect of points are disjoint
    \note To avoid circular references
 */
template <typename Point1, typename Point2>
inline bool disjoint_point_point(Point1 const& point1, Point2 const& point2)
{
    return point_point
        <
            Point1, Point2,
            0, dimension<Point1>::type::value
        >::apply(point1, point2);
}


}} // namespace detail::disjoint
#endif // DOXYGEN_NO_DETAIL




#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename Point1, typename Point2, std::size_t DimensionCount>
struct disjoint<Point1, Point2, DimensionCount, point_tag, point_tag, false>
    : detail::disjoint::point_point<Point1, Point2, 0, DimensionCount>
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_POINT_POINT_HPP
