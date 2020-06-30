// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_POLICIES_COMPARE_HPP
#define BOOST_GEOMETRY_POLICIES_COMPARE_HPP


#include <cstddef>

#include <boost/geometry/strategies/compare.hpp>
#include <boost/geometry/util/math.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace compare
{


template
<
    int Direction,
    typename Point,
    typename Strategy,
    std::size_t Dimension,
    std::size_t DimensionCount
>
struct compare_loop
{
    typedef typename strategy::compare::detail::select_strategy
        <
            Strategy, Direction, Point, Dimension
        >::type compare_type;

    typedef typename geometry::coordinate_type<Point>::type coordinate_type;

    static inline bool apply(Point const& left, Point const& right)
    {
        coordinate_type const& cleft = geometry::get<Dimension>(left);
        coordinate_type const& cright = geometry::get<Dimension>(right);

        if (geometry::math::equals(cleft, cright))
        {
            return compare_loop
                <
                    Direction, Point, Strategy,
                    Dimension + 1, DimensionCount
                >::apply(left, right);
        }
        else
        {
            compare_type compare;
            return compare(cleft, cright);
        }
    }
};

template
<
    int Direction,
    typename Point,
    typename Strategy,
    std::size_t DimensionCount
>
struct compare_loop<Direction, Point, Strategy, DimensionCount, DimensionCount>
{
    static inline bool apply(Point const&, Point const&)
    {
        // On coming here, points are equal. Return true if
        // direction = 0 (equal), false if -1/1 (greater/less)
        return Direction == 0;
    }
};


template <int Direction, typename Point, typename Strategy>
struct compare_in_all_dimensions
{
    inline bool operator()(Point const& left, Point const& right) const
    {
        return detail::compare::compare_loop
            <
                Direction, Point, Strategy,
                0, geometry::dimension<Point>::type::value
            >::apply(left, right);
    }
};


template <typename Point, typename Strategy, std::size_t Dimension>
class compare_in_one_dimension
{
    Strategy compare;

public :
    inline bool operator()(Point const& left, Point const& right) const
    {
        typedef typename geometry::coordinate_type<Point>::type coordinate_type;

        coordinate_type const& cleft = get<Dimension>(left);
        coordinate_type const& cright = get<Dimension>(right);
        return compare(cleft, cright);
    }
};

}} // namespace detail::compare

#endif

#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

template
<
    int Direction,
    typename Point,
    typename Strategy,
    int Dimension
>
struct compare_geometries
    : detail::compare::compare_in_one_dimension
        <
            Point,
            typename strategy::compare::detail::select_strategy
                <
                    Strategy, Direction, Point, Dimension
                >::type,
            Dimension
        >
{};


// Specialization with -1: compare in all dimensions
template <int Direction, typename Point, typename Strategy>
struct compare_geometries<Direction, Point, Strategy, -1>
    : detail::compare::compare_in_all_dimensions<Direction, Point, Strategy>
{};



} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


/*!
\brief Less functor, to sort points in ascending order.
\ingroup compare
\details This functor compares points and orders them on x,
    then on y, then on z coordinate.
\tparam Geometry the geometry
\tparam Dimension the dimension to sort on, defaults to -1,
    indicating ALL dimensions. That's to say, first on x,
    on equal x-es then on y, etc.
    If a dimension is specified, only that dimension is considered
\tparam Strategy underlying coordinate comparing functor,
    defaults to the default comparison strategies
    related to the point coordinate system. If specified, the specified
    strategy is used. This can e.g. be std::less<double>.
*/
template
<
    typename Point,
    int Dimension = -1,
    typename Strategy = strategy::compare::default_strategy
>
struct less
    : dispatch::compare_geometries
        <
            1, // indicates ascending
            Point,
            Strategy,
            Dimension
        >
{
    typedef Point first_argument_type;
    typedef Point second_argument_type;
    typedef bool result_type;
};


/*!
\brief Greater functor
\ingroup compare
\details Can be used to sort points in reverse order
\see Less functor
*/
template
<
    typename Point,
    int Dimension = -1,
    typename Strategy = strategy::compare::default_strategy
>
struct greater
    : dispatch::compare_geometries
        <
            -1,  // indicates descending
            Point,
            Strategy,
            Dimension
        >
{};


/*!
\brief Equal To functor, to compare if points are equal
\ingroup compare
\tparam Geometry the geometry
\tparam Dimension the dimension to compare on, defaults to -1,
    indicating ALL dimensions.
    If a dimension is specified, only that dimension is considered
\tparam Strategy underlying coordinate comparing functor
*/
template
<
    typename Point,
    int Dimension = -1,
    typename Strategy = strategy::compare::default_strategy
>
struct equal_to
    : dispatch::compare_geometries
        <
            0,
            Point,
            Strategy,
            Dimension
        >
{};


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_POLICIES_COMPARE_HPP
