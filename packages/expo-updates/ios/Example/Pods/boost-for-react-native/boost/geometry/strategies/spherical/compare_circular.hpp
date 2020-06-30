// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_SPHERICAL_COMPARE_SPHERICAL_HPP
#define BOOST_GEOMETRY_STRATEGIES_SPHERICAL_COMPARE_SPHERICAL_HPP

#include <boost/math/constants/constants.hpp>

#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/tags.hpp>
#include <boost/geometry/strategies/compare.hpp>
#include <boost/geometry/util/math.hpp>


namespace boost { namespace geometry
{


namespace strategy { namespace compare
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail
{

template <typename Units>
struct shift
{
};

template <>
struct shift<degree>
{
    static inline double full() { return 360.0; }
    static inline double half() { return 180.0; }
};

template <>
struct shift<radian>
{
    static inline double full() { return 2.0 * boost::math::constants::pi<double>(); }
    static inline double half() { return boost::math::constants::pi<double>(); }
};

} // namespace detail
#endif

/*!
\brief Compare (in one direction) strategy for spherical coordinates
\ingroup strategies
\tparam Point point-type
\tparam Dimension dimension
*/
template <typename CoordinateType, typename Units, typename Compare>
struct circular_comparator
{
    static inline CoordinateType put_in_range(CoordinateType const& c,
            double min_border, double max_border)
    {
        CoordinateType value = c;
        while (value < min_border)
        {
            value += detail::shift<Units>::full();
        }
        while (value > max_border)
        {
            value -= detail::shift<Units>::full();
        }
        return value;
    }

    inline bool operator()(CoordinateType const& c1, CoordinateType const& c2)  const
    {
        Compare compare;

        // Check situation that one of them is e.g. std::numeric_limits.
        static const double full = detail::shift<Units>::full();
        double mx = 10.0 * full;
        if (c1 < -mx || c1 > mx || c2 < -mx || c2 > mx)
        {
            // do normal comparison, using circular is not useful
            return compare(c1, c2);
        }

        static const double half = full / 2.0;
        CoordinateType v1 = put_in_range(c1, -half, half);
        CoordinateType v2 = put_in_range(c2, -half, half);

        // Two coordinates on a circle are
        // at max <= half a circle away from each other.
        // So if it is more, shift origin.
        CoordinateType diff = geometry::math::abs(v1 - v2);
        if (diff > half)
        {
            v1 = put_in_range(v1, 0, full);
            v2 = put_in_range(v2, 0, full);
        }

        return compare(v1, v2);
    }
};

}} // namespace strategy::compare

#ifndef DOXYGEN_NO_STRATEGY_SPECIALIZATIONS

// Specialize for the longitude (dim 0)
template
<
    typename Point,
    template<typename> class CoordinateSystem,
    typename Units
>
struct strategy_compare<spherical_polar_tag, 1, Point, CoordinateSystem<Units>, 0>
{
    typedef typename coordinate_type<Point>::type coordinate_type;
    typedef strategy::compare::circular_comparator
        <
            coordinate_type,
            Units,
            std::less<coordinate_type>
        > type;
};

template
<
    typename Point,
    template<typename> class CoordinateSystem,
    typename Units
>
struct strategy_compare<spherical_polar_tag, -1, Point, CoordinateSystem<Units>, 0>
{
    typedef typename coordinate_type<Point>::type coordinate_type;
    typedef strategy::compare::circular_comparator
        <
            coordinate_type,
            Units,
            std::greater<coordinate_type>
        > type;
};

#endif // DOXYGEN_NO_STRATEGY_SPECIALIZATIONS

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_STRATEGIES_SPHERICAL_COMPARE_SPHERICAL_HPP
