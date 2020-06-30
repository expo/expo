// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2008-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_CORE_COORDINATE_DIMENSION_HPP
#define BOOST_GEOMETRY_CORE_COORDINATE_DIMENSION_HPP


#include <cstddef>

#include <boost/mpl/assert.hpp>
#include <boost/static_assert.hpp>

#include <boost/geometry/core/point_type.hpp>
#include <boost/geometry/util/bare_type.hpp>

namespace boost { namespace geometry
{

namespace traits
{

/*!
\brief Traits class indicating the number of dimensions of a point
\par Geometries:
    - point
\par Specializations should provide:
    - value (should be derived from boost::mpl::int_<D>
\ingroup traits
*/
template <typename Point, typename Enable = void>
struct dimension
{
   BOOST_MPL_ASSERT_MSG
        (
            false, NOT_IMPLEMENTED_FOR_THIS_POINT_TYPE, (types<Point>)
        );
};

} // namespace traits

#ifndef DOXYGEN_NO_DISPATCH
namespace core_dispatch
{

// Base class derive from its own specialization of point-tag
template <typename T, typename G>
struct dimension : dimension<point_tag, typename point_type<T, G>::type> {};

template <typename P>
struct dimension<point_tag, P>
    : traits::dimension<typename geometry::util::bare_type<P>::type>
{
    BOOST_MPL_ASSERT_MSG(
        (traits::dimension<typename geometry::util::bare_type<P>::type>::value > 0),
        INVALID_DIMENSION_VALUE,
        (traits::dimension<typename geometry::util::bare_type<P>::type>)
    );
};

} // namespace core_dispatch
#endif

/*!
\brief \brief_meta{value, number of coordinates (the number of axes of any geometry), \meta_point_type}
\tparam Geometry \tparam_geometry
\ingroup core

\qbk{[include reference/core/coordinate_dimension.qbk]}
*/
template <typename Geometry>
struct dimension
    : core_dispatch::dimension
        <
            typename tag<Geometry>::type,
            typename geometry::util::bare_type<Geometry>::type
        >
{};

/*!
\brief assert_dimension, enables compile-time checking if coordinate dimensions are as expected
\ingroup utility
*/
template <typename Geometry, int Dimensions>
inline void assert_dimension()
{
    BOOST_STATIC_ASSERT(( static_cast<int>(dimension<Geometry>::value) == Dimensions ));
}

/*!
\brief assert_dimension, enables compile-time checking if coordinate dimensions are as expected
\ingroup utility
*/
template <typename Geometry, int Dimensions>
inline void assert_dimension_less_equal()
{
    BOOST_STATIC_ASSERT(( static_cast<int>(dimension<Geometry>::type::value) <= Dimensions ));
}

template <typename Geometry, int Dimensions>
inline void assert_dimension_greater_equal()
{
    BOOST_STATIC_ASSERT(( static_cast<int>(dimension<Geometry>::type::value) >= Dimensions ));
}

/*!
\brief assert_dimension_equal, enables compile-time checking if coordinate dimensions of two geometries are equal
\ingroup utility
*/
template <typename G1, typename G2>
inline void assert_dimension_equal()
{
    BOOST_STATIC_ASSERT(( static_cast<size_t>(dimension<G1>::type::value) == static_cast<size_t>(dimension<G2>::type::value) ));
}

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_CORE_COORDINATE_DIMENSION_HPP
