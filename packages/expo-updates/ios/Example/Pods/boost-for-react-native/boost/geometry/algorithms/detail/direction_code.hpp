// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2015.
// Modifications copyright (c) 2015 Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_DIRECITON_CODE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_DIRECITON_CODE_HPP


#include <boost/geometry/core/access.hpp>
#include <boost/geometry/util/math.hpp>

namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail
{

template <std::size_t Index, typename Point1, typename Point2>
inline int sign_of_difference(Point1 const& point1, Point2 const& point2)
{
    return
        math::equals(geometry::get<Index>(point1), geometry::get<Index>(point2))
        ?
        0
        :
        (geometry::get<Index>(point1) > geometry::get<Index>(point2) ? 1 : -1);
}


// Gives sense of direction for point p, collinear w.r.t. segment (a,b)
// Returns -1 if p goes backward w.r.t (a,b), so goes from b in direction of a
// Returns 1 if p goes forward, so extends (a,b)
// Returns 0 if p is equal with b, or if (a,b) is degenerate
// Note that it does not do any collinearity test, that should be done before
template <typename Point1, typename Point2>
inline int direction_code(Point1 const& segment_a, Point1 const& segment_b,
                          const Point2& p)
{
    // Suppose segment = (4 3,4 4) and p =(4 2)
    // Then sign_a1 = 1 and sign_p1 = 1 -> goes backward -> return -1

    int const sign_a0 = sign_of_difference<0>(segment_b, segment_a);
    int const sign_a1 = sign_of_difference<1>(segment_b, segment_a);

    if (sign_a0 == 0 && sign_a1 == 0)
    {
        return 0;
    }

    int const sign_p0 = sign_of_difference<0>(segment_b, p);
    int const sign_p1 = sign_of_difference<1>(segment_b, p);

    if (sign_p0 == 0 && sign_p1 == 0)
    {
        return 0;
    }

    return sign_a0 == sign_p0 && sign_a1 == sign_p1 ? -1 : 1;
}


} // namespace detail
#endif //DOXYGEN_NO_DETAIL



}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_DIRECITON_CODE_HPP
