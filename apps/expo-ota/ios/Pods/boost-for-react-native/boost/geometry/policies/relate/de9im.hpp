// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_GEOMETRY_POLICIES_RELATE_DE9IM_HPP
#define BOOST_GEOMETRY_GEOMETRY_POLICIES_RELATE_DE9IM_HPP


#include <boost/geometry/strategies/intersection_result.hpp>
#include <boost/geometry/util/math.hpp>
#include <boost/geometry/util/select_coordinate_type.hpp>


namespace boost { namespace geometry
{

namespace policies { namespace relate
{


template <typename S1, typename S2>
struct segments_de9im
{
    typedef de9im_segment return_type;
    typedef S1 segment_type1;
    typedef S2 segment_type2;
    typedef typename select_coordinate_type<S1, S2>::type coordinate_type;

    static inline return_type rays_intersect(bool on_segment,
                    double ra, double rb,
                    coordinate_type const& dx1, coordinate_type const& dy1,
                    coordinate_type const& dx2, coordinate_type const& dy2,
                    coordinate_type const& wx, coordinate_type const& wy,
                    S1 const& s1, S2 const& s2)
    {
        if(on_segment)
        {
            // 0 <= ra <= 1 and 0 <= rb <= 1
            // Now check if one of them is 0 or 1, these are "touch" cases
            bool a = math::equals(ra, 0.0) || math::equals(ra, 1.0);
            bool b = math::equals(rb, 0.0) || math::equals(rb, 1.0);
            if (a && b)
            {
                // Touch boundary/boundary: i-i == -1, i-b == -1, b-b == 0
                // Opposite: if both are equal they touch in opposite direction
                return de9im_segment(ra,rb,
                        -1, -1, 1,
                        -1,  0, 0,
                         1,  0, 2, false, math::equals(ra,rb));
            }
            else if (a || b)
            {
                // Touch boundary/interior: i-i == -1, i-b == -1 or 0, b-b == -1
                int A = a ? 0 : -1;
                int B = b ? 0 : -1;
                return de9im_segment(ra,rb,
                        -1,  B, 1,
                         A, -1, 0,
                         1,  0, 2);
            }

            // Intersects: i-i == 0, i-b == -1, i-e == 1
            return de9im_segment(ra,rb,
                     0, -1, 1,
                    -1, -1, 0,
                     1,  0, 2);
        }

        // Not on segment, disjoint
        return de9im_segment(ra,rb,
                -1, -1, 1,
                -1, -1, 0,
                 1,  0, 2);
    }

    static inline return_type collinear_touch(coordinate_type const& x,
                coordinate_type const& y, bool opposite, char)
    {
        return de9im_segment(0,0,
                -1, -1, 1,
                -1,  0, 0,
                 1,  0, 2,
                true, opposite);
    }

    template <typename S>
    static inline return_type collinear_interior_boundary_intersect(S const& s,
                bool a_within_b, bool opposite)
    {
        return a_within_b
            ? de9im_segment(0,0,
                 1, -1, -1,
                 0,  0, -1,
                 1,  0, 2,
                true, opposite)
            : de9im_segment(0,0,
                 1,  0, 1,
                -1,  0, 0,
                -1, -1, 2,
                true, opposite);
    }



    static inline return_type collinear_a_in_b(S1 const& s, bool opposite)
    {
        return de9im_segment(0,0,
                1, -1, -1,
                0, -1, -1,
                1,  0,  2,
                true, opposite);
    }
    static inline return_type collinear_b_in_a(S2 const& s, bool opposite)
    {
        return de9im_segment(0,0,
                 1,  0,  1,
                -1, -1,  0,
                -1, -1,  2,
                true, opposite);
    }

    static inline return_type collinear_overlaps(
                    coordinate_type const& x1, coordinate_type const& y1,
                    coordinate_type const& x2, coordinate_type const& y2, bool opposite)
    {
        return de9im_segment(0,0,
                1,  0, 1,
                0, -1, 0,
                1,  0, 2,
                true, opposite);
    }

    static inline return_type segment_equal(S1 const& s, bool opposite)
    {
        return de9im_segment(0,0,
                 1, -1, -1,
                -1,  0, -1,
                -1, -1,  2,
                 true, opposite);
    }

    static inline return_type degenerate(S1 const& segment, bool a_degenerate)
    {
            return a_degenerate
                ? de9im_segment(0,0,
                     0, -1, -1,
                    -1, -1, -1,
                     1,  0,  2,
                     false, false, false, true)
                : de9im_segment(0,0,
                     0, -1,  1,
                    -1, -1,  0,
                    -1, -1,  2,
                     false, false, false, true);
    }

};


}} // namespace policies::relate

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_GEOMETRY_POLICIES_RELATE_DE9IM_HPP
