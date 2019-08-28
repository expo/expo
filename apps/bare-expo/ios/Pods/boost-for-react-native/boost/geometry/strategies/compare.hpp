// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)


#ifndef BOOST_GEOMETRY_STRATEGIES_COMPARE_HPP
#define BOOST_GEOMETRY_STRATEGIES_COMPARE_HPP

#include <cstddef>
#include <functional>

#include <boost/mpl/if.hpp>

#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/coordinate_type.hpp>

#include <boost/geometry/strategies/tags.hpp>


namespace boost { namespace geometry
{


/*!
    \brief Traits class binding a comparing strategy to a coordinate system
    \ingroup util
    \tparam Tag tag of coordinate system of point-type
    \tparam Direction direction to compare on: 1 for less (-> ascending order)
        and -1 for greater (-> descending order)
    \tparam Point point-type
    \tparam CoordinateSystem coordinate sytem of point
    \tparam Dimension: the dimension to compare on
*/
template
<
    typename Tag,
    int Direction,
    typename Point,
    typename CoordinateSystem,
    std::size_t Dimension
>
struct strategy_compare
{
    typedef strategy::not_implemented type;
};


#ifndef DOXYGEN_NO_STRATEGY_SPECIALIZATIONS

// For compare we add defaults specializations,
// because they defaultly redirect to std::less / greater / equal_to
template
<
    typename Tag,
    typename Point,
    typename CoordinateSystem,
    std::size_t Dimension
>
struct strategy_compare<Tag, 1, Point, CoordinateSystem, Dimension>
{
    typedef std::less<typename coordinate_type<Point>::type> type;
};


template
<
    typename Tag,
    typename Point,
    typename CoordinateSystem,
    std::size_t Dimension
>
struct strategy_compare<Tag, -1, Point, CoordinateSystem, Dimension>
{
    typedef std::greater<typename coordinate_type<Point>::type> type;
};


template
<
    typename Tag,
    typename Point,
    typename CoordinateSystem,
    std::size_t Dimension
>
struct strategy_compare<Tag, 0, Point, CoordinateSystem, Dimension>
{
    typedef std::equal_to<typename coordinate_type<Point>::type> type;
};


#endif


namespace strategy { namespace compare
{


/*!
    \brief Default strategy, indicates the default strategy for comparisons
    \details The default strategy for comparisons defer in most cases
        to std::less (for ascending) and std::greater (for descending).
        However, if a spherical coordinate system is used, and comparison
        is done on longitude, it will take another strategy handling circular
*/
struct default_strategy {};


#ifndef DOXYGEN_NO_DETAIL
namespace detail
{

template <typename Type>
struct is_default : boost::false_type
{};


template <>
struct is_default<default_strategy> : boost::true_type
{};


/*!
    \brief Meta-function to select strategy
    \details If "default_strategy" is specified, it will take the
        traits-registered class for the specified coordinate system.
        If another strategy is explicitly specified, it takes that one.
*/
template
<
    typename Strategy,
    int Direction,
    typename Point,
    std::size_t Dimension
>
struct select_strategy
{
    typedef typename
        boost::mpl::if_
        <
            is_default<Strategy>,
            typename strategy_compare
            <
                typename cs_tag<Point>::type,
                Direction,
                Point,
                typename coordinate_system<Point>::type,
                Dimension
            >::type,
            Strategy
        >::type type;
};

} // namespace detail
#endif // DOXYGEN_NO_DETAIL


}} // namespace strategy::compare


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGIES_COMPARE_HPP
