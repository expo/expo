// Boost.Geometry

// Copyright (c) 2016, Oracle and/or its affiliates.
// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_SPHERICAL_INTERSECTION_HPP
#define BOOST_GEOMETRY_STRATEGIES_SPHERICAL_INTERSECTION_HPP

#include <algorithm>

#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/radian_access.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/algorithms/detail/assign_values.hpp>
#include <boost/geometry/algorithms/detail/assign_indexed_point.hpp>
#include <boost/geometry/algorithms/detail/equals/point_point.hpp>
#include <boost/geometry/algorithms/detail/recalculate.hpp>

#include <boost/geometry/arithmetic/arithmetic.hpp>
#include <boost/geometry/arithmetic/cross_product.hpp>
#include <boost/geometry/arithmetic/dot_product.hpp>
#include <boost/geometry/formulas/spherical.hpp>

#include <boost/geometry/geometries/concepts/point_concept.hpp>
#include <boost/geometry/geometries/concepts/segment_concept.hpp>

#include <boost/geometry/policies/robustness/segment_ratio.hpp>

#include <boost/geometry/strategies/side_info.hpp>
#include <boost/geometry/strategies/intersection.hpp>
#include <boost/geometry/strategies/intersection_result.hpp>

#include <boost/geometry/util/math.hpp>
#include <boost/geometry/util/select_calculation_type.hpp>


namespace boost { namespace geometry
{

namespace strategy { namespace intersection
{

// NOTE:
// The coordinates of crossing IP may be calculated with small precision in some cases.
// For double, near the equator noticed error ~1e-9 so far greater than
// machine epsilon which is ~1e-16. This error is ~0.04m.
// E.g. consider two cases, one near the origin and the second one rotated by 90 deg around Z or SN axis.
// After the conversion from spherical degrees to cartesian 3d the following coordinates
// are calculated:
// for sph (-1 -1,  1 1) deg cart3d ys are -0.017449748351250485 and  0.017449748351250485
// for sph (89 -1, 91 1) deg cart3d xs are  0.017449748351250571 and -0.017449748351250450
// During the conversion degrees must first be converted to radians and then radians
// are passed into trigonometric functions. The error may have several causes:
// 1. Radians cannot represent exactly the same angles as degrees.
// 2. Different longitudes are passed into sin() for x, corresponding to cos() for y,
//    and for different angle the error of the result may be different.
// 3. These non-corresponding cartesian coordinates are used in calculation,
//    e.g. multiplied several times in cross and dot products.
// If it was a problem this strategy could e.g. "normalize" longitudes before the conversion using the source units
// by rotating the globe around Z axis, so moving longitudes always the same way towards the origin,
// assuming this could help which is not clear.
// For now, intersection points near the endpoints are checked explicitly if needed (if the IP is near the endpoint)
// to generate precise result for them. Only the crossing (i) case may suffer from lower precision.

template <typename Policy, typename CalculationType = void>
struct relate_spherical_segments
{
    typedef typename Policy::return_type return_type;

    enum intersection_point_flag { ipi_inters = 0, ipi_at_a1, ipi_at_a2, ipi_at_b1, ipi_at_b2 };

    template <typename CoordinateType, typename SegmentRatio, typename Vector3d>
    struct segment_intersection_info
    {
        typedef typename select_most_precise
            <
                CoordinateType, double
            >::type promoted_type;

        promoted_type comparable_length_a() const
        {
            return robust_ra.denominator();
        }

        promoted_type comparable_length_b() const
        {
            return robust_rb.denominator();
        }

        template <typename Point, typename Segment1, typename Segment2>
        void assign_a(Point& point, Segment1 const& a, Segment2 const& b) const
        {
            assign(point, a, b);
        }
        template <typename Point, typename Segment1, typename Segment2>
        void assign_b(Point& point, Segment1 const& a, Segment2 const& b) const
        {
            assign(point, a, b);
        }

        template <typename Point, typename Segment1, typename Segment2>
        void assign(Point& point, Segment1 const& a, Segment2 const& b) const
        {
            if (ip_flag == ipi_inters)
            {
                // TODO: assign the rest of coordinates
                point = formula::cart3d_to_sph<Point>(intersection_point);
            }
            else if (ip_flag == ipi_at_a1)
            {
                detail::assign_point_from_index<0>(a, point);
            }
            else if (ip_flag == ipi_at_a2)
            {
                detail::assign_point_from_index<1>(a, point);
            }
            else if (ip_flag == ipi_at_b1)
            {
                detail::assign_point_from_index<0>(b, point);
            }
            else // ip_flag == ipi_at_b2
            {
                detail::assign_point_from_index<1>(b, point);
            }
        }

        Vector3d intersection_point;
        SegmentRatio robust_ra;
        SegmentRatio robust_rb;
        intersection_point_flag ip_flag;
    };

    // Relate segments a and b
    template <typename Segment1, typename Segment2, typename RobustPolicy>
    static inline return_type apply(Segment1 const& a, Segment2 const& b,
                                    RobustPolicy const& robust_policy)
    {
        typedef typename point_type<Segment1>::type point1_t;
        typedef typename point_type<Segment2>::type point2_t;
        point1_t a1, a2;
        point2_t b1, b2;

        // TODO: use indexed_point_view if possible?
        detail::assign_point_from_index<0>(a, a1);
        detail::assign_point_from_index<1>(a, a2);
        detail::assign_point_from_index<0>(b, b1);
        detail::assign_point_from_index<1>(b, b2);

        return apply(a, b, robust_policy, a1, a2, b1, b2);
    }

    // Relate segments a and b
    template <typename Segment1, typename Segment2, typename RobustPolicy, typename Point1, typename Point2>
    static inline return_type apply(Segment1 const& a, Segment2 const& b,
                                    RobustPolicy const&,
                                    Point1 const& a1, Point1 const& a2, Point2 const& b1, Point2 const& b2)
    {
        BOOST_CONCEPT_ASSERT( (concepts::ConstSegment<Segment1>) );
        BOOST_CONCEPT_ASSERT( (concepts::ConstSegment<Segment2>) );

        // TODO: check only 2 first coordinates here?
        using geometry::detail::equals::equals_point_point;
        bool a_is_point = equals_point_point(a1, a2);
        bool b_is_point = equals_point_point(b1, b2);

        if(a_is_point && b_is_point)
        {
            return equals_point_point(a1, b2)
                ? Policy::degenerate(a, true)
                : Policy::disjoint()
                ;
        }

        typedef typename select_calculation_type
            <Segment1, Segment2, CalculationType>::type calc_t;

        calc_t const c0 = 0;
        calc_t const c1 = 1;

        typedef model::point<calc_t, 3, cs::cartesian> vec3d_t;

        using namespace formula;
        vec3d_t const a1v = sph_to_cart3d<vec3d_t>(a1);
        vec3d_t const a2v = sph_to_cart3d<vec3d_t>(a2);
        vec3d_t const b1v = sph_to_cart3d<vec3d_t>(b1);
        vec3d_t const b2v = sph_to_cart3d<vec3d_t>(b2);
        
        vec3d_t norm1 = cross_product(a1v, a2v);
        vec3d_t norm2 = cross_product(b1v, b2v);

        side_info sides;
        // not normalized normals, the same as in SSF
        sides.set<0>(sph_side_value(norm2, a1v), sph_side_value(norm2, a2v));
        if (sides.same<0>())
        {
            // Both points are at same side of other segment, we can leave
            return Policy::disjoint();
        }
        // not normalized normals, the same as in SSF
        sides.set<1>(sph_side_value(norm1, b1v), sph_side_value(norm1, b2v));
        if (sides.same<1>())
        {
            // Both points are at same side of other segment, we can leave
            return Policy::disjoint();
        }

        // NOTE: at this point the segments may still be disjoint

        bool collinear = sides.collinear();

        calc_t const len1 = math::sqrt(dot_product(norm1, norm1));
        calc_t const len2 = math::sqrt(dot_product(norm2, norm2));

        // point or opposite sides of a sphere, assume point
        if (math::equals(len1, c0))
        {
            a_is_point = true;
            if (sides.get<0, 0>() == 0 || sides.get<0, 1>() == 0)
            {
                sides.set<0>(0, 0);
            }
        }
        else
        {
            // normalize
            divide_value(norm1, len1);
        }

        if (math::equals(len2, c0))
        {
            b_is_point = true;
            if (sides.get<1, 0>() == 0 || sides.get<1, 1>() == 0)
            {
                sides.set<1>(0, 0);
            }
        }
        else
        {
            // normalize
            divide_value(norm2, len2);
        }

        // check both degenerated once more
        if (a_is_point && b_is_point)
        {
            return equals_point_point(a1, b2)
                ? Policy::degenerate(a, true)
                : Policy::disjoint()
                ;
        }

        // NOTE: at this point one of the segments may be degenerated
        //       and the segments may still be disjoint

        calc_t dot_n1n2 = dot_product(norm1, norm2);

        // NOTE: this is technically not needed since theoretically above sides
        //       are calculated, but just in case check the normals.
        //       Have in mind that SSF side strategy doesn't check this.
        // collinear if normals are equal or opposite: cos(a) in {-1, 1}
        if (!collinear && math::equals(math::abs(dot_n1n2), c1))
        {
            collinear = true;
            sides.set<0>(0, 0);
            sides.set<1>(0, 0);
        }
        
        if (collinear)
        {
            if (a_is_point)
            {
                return collinear_one_degenerted<calc_t>(a, true, b1, b2, a1, a2, b1v, b2v, norm2, a1v);
            }
            else if (b_is_point)
            {
                // b2 used to be consistent with (degenerated) checks above (is it needed?)
                return collinear_one_degenerted<calc_t>(b, false, a1, a2, b1, b2, a1v, a2v, norm1, b1v);
            }
            else
            {
                calc_t dist_a1_a2, dist_a1_b1, dist_a1_b2;
                calc_t dist_b1_b2, dist_b1_a1, dist_b1_a2;
                // use shorter segment
                if (len1 <= len2)
                {
                    calculate_collinear_data(a1, a2, b1, b2, a1v, a2v, norm1, b1v, dist_a1_a2, dist_a1_b1);
                    calculate_collinear_data(a1, a2, b1, b2, a1v, a2v, norm1, b2v, dist_a1_a2, dist_a1_b2);
                    dist_b1_b2 = dist_a1_b2 - dist_a1_b1;
                    dist_b1_a1 = -dist_a1_b1;
                    dist_b1_a2 = dist_a1_a2 - dist_a1_b1;
                }
                else
                {
                    calculate_collinear_data(b1, b2, a1, a2, b1v, b2v, norm2, a1v, dist_b1_b2, dist_b1_a1);
                    calculate_collinear_data(b1, b2, a1, a2, b1v, b2v, norm2, a2v, dist_b1_b2, dist_b1_a2);
                    dist_a1_a2 = dist_b1_a2 - dist_b1_a1;
                    dist_a1_b1 = -dist_b1_a1;
                    dist_a1_b2 = dist_b1_b2 - dist_b1_a1;
                }

                segment_ratio<calc_t> ra_from(dist_b1_a1, dist_b1_b2);
                segment_ratio<calc_t> ra_to(dist_b1_a2, dist_b1_b2);
                segment_ratio<calc_t> rb_from(dist_a1_b1, dist_a1_a2);
                segment_ratio<calc_t> rb_to(dist_a1_b2, dist_a1_a2);
                
                // NOTE: this is probably not needed
                int const a1_wrt_b = position_value(c0, dist_a1_b1, dist_a1_b2);
                int const a2_wrt_b = position_value(dist_a1_a2, dist_a1_b1, dist_a1_b2);
                int const b1_wrt_a = position_value(c0, dist_b1_a1, dist_b1_a2);
                int const b2_wrt_a = position_value(dist_b1_b2, dist_b1_a1, dist_b1_a2);

                if (a1_wrt_b == 1)
                {
                    ra_from.assign(0, dist_b1_b2);
                    rb_from.assign(0, dist_a1_a2);
                }
                else if (a1_wrt_b == 3)
                {
                    ra_from.assign(dist_b1_b2, dist_b1_b2);
                    rb_to.assign(0, dist_a1_a2);
                }

                if (a2_wrt_b == 1)
                {
                    ra_to.assign(0, dist_b1_b2);
                    rb_from.assign(dist_a1_a2, dist_a1_a2);
                }
                else if (a2_wrt_b == 3)
                {
                    ra_to.assign(dist_b1_b2, dist_b1_b2);
                    rb_to.assign(dist_a1_a2, dist_a1_a2);
                }

                if ((a1_wrt_b < 1 && a2_wrt_b < 1) || (a1_wrt_b > 3 && a2_wrt_b > 3))
                {
                    return Policy::disjoint();
                }

                bool const opposite = dot_n1n2 < c0;

                return Policy::segments_collinear(a, b, opposite,
                    a1_wrt_b, a2_wrt_b, b1_wrt_a, b2_wrt_a,
                    ra_from, ra_to, rb_from, rb_to);
            }
        }
        else // crossing
        {
            if (a_is_point || b_is_point)
            {
                return Policy::disjoint();
            }

            vec3d_t i1;
            intersection_point_flag ip_flag;
            calc_t dist_a1_a2, dist_a1_i1, dist_b1_b2, dist_b1_i1;
            if (calculate_ip_data(a1, a2, b1, b2, a1v, a2v, b1v, b2v, norm1, norm2, sides,
                                  i1, dist_a1_a2, dist_a1_i1, dist_b1_b2, dist_b1_i1, ip_flag))
            {
                // intersects
                segment_intersection_info
                    <
                        calc_t,
                        segment_ratio<calc_t>,
                        vec3d_t
                    > sinfo;

                sinfo.robust_ra.assign(dist_a1_i1, dist_a1_a2);
                sinfo.robust_rb.assign(dist_b1_i1, dist_b1_b2);
                sinfo.intersection_point = i1;
                sinfo.ip_flag = ip_flag;

                return Policy::segments_crosses(sides, sinfo, a, b);
            }
            else
            {
                return Policy::disjoint();
            }
        }
    }

private:
    template <typename CalcT, typename Segment, typename Point1, typename Point2, typename Vec3d>
    static inline return_type collinear_one_degenerted(Segment const& segment, bool degenerated_a,
                                                       Point1 const& a1, Point1 const& a2,
                                                       Point2 const& b1, Point2 const& b2,
                                                       Vec3d const& v1, Vec3d const& v2, Vec3d const& norm,
                                                       Vec3d const& vother)
    {
        CalcT dist_1_2, dist_1_o;
        return ! calculate_collinear_data(a1, a2, b1, b2, v1, v2, norm, vother, dist_1_2, dist_1_o)
                ? Policy::disjoint()
                : Policy::one_degenerate(segment, segment_ratio<CalcT>(dist_1_o, dist_1_2), degenerated_a);
    }

    template <typename Point1, typename Point2, typename Vec3d, typename CalcT>
    static inline bool calculate_collinear_data(Point1 const& a1, Point1 const& a2,
                                                Point2 const& b1, Point2 const& b2,
                                                Vec3d const& a1v, // in
                                                Vec3d const& a2v, // in
                                                Vec3d const& norm1, // in
                                                Vec3d const& b1v_or_b2v, // in
                                                CalcT& dist_a1_a2, CalcT& dist_a1_i1) // out
    {
        // calculate dist_a1_a2 and dist_a1_i1
        calculate_dists(a1v, a2v, norm1, b1v_or_b2v, dist_a1_a2, dist_a1_i1);

        // if i1 is close to a1 and b1 or b2 is equal to a1
        if (is_endpoint_equal(dist_a1_i1, a1, b1, b2))
        {
            dist_a1_i1 = 0;
            return true;
        }
        // or i1 is close to a2 and b1 or b2 is equal to a2
        else if (is_endpoint_equal(dist_a1_a2 - dist_a1_i1, a2, b1, b2))
        {
            dist_a1_i1 = dist_a1_a2;
            return true;
        }

        // or i1 is on b
        return segment_ratio<CalcT>(dist_a1_i1, dist_a1_a2).on_segment();
    }

    template <typename Point1, typename Point2, typename Vec3d, typename CalcT>
    static inline bool calculate_ip_data(Point1 const& a1, Point1 const& a2, // in
                                         Point2 const& b1, Point2 const& b2, // in
                                         Vec3d const& a1v, Vec3d const& a2v, // in
                                         Vec3d const& b1v, Vec3d const& b2v, // in
                                         Vec3d const& norm1, Vec3d const& norm2, // in
                                         side_info const& sides, // in
                                         Vec3d & i1, // in-out
                                         CalcT& dist_a1_a2, CalcT& dist_a1_i1, // out
                                         CalcT& dist_b1_b2, CalcT& dist_b1_i1, // out
                                         intersection_point_flag& ip_flag)     // out
    {
        // great circles intersections
        i1 = cross_product(norm1, norm2);
        // NOTE: the length should be greater than 0 at this point
        //       if the normals were not normalized and their dot product
        //       not checked before this function is called the length
        //       should be checked here (math::equals(len, c0))
        CalcT const len = math::sqrt(dot_product(i1, i1));
        divide_value(i1, len); // normalize i1

        calculate_dists(a1v, a2v, norm1, i1, dist_a1_a2, dist_a1_i1);
        
        // choose the opposite side of the globe if the distance is shorter
        {
            CalcT const d = abs_distance(dist_a1_a2, dist_a1_i1);
            if (d > CalcT(0))
            {
                CalcT const dist_a1_i2 = dist_of_i2(dist_a1_i1);
                CalcT const d2 = abs_distance(dist_a1_a2, dist_a1_i2);
                if (d2 < d)
                {
                    dist_a1_i1 = dist_a1_i2;
                    multiply_value(i1, CalcT(-1)); // the opposite intersection
                }
            }
        }

        bool is_on_a = false, is_near_a1 = false, is_near_a2 = false;
        if (! is_potentially_crossing(dist_a1_a2, dist_a1_i1, is_on_a, is_near_a1, is_near_a2))
        {
            return false;
        }

        calculate_dists(b1v, b2v, norm2, i1, dist_b1_b2, dist_b1_i1);

        bool is_on_b = false, is_near_b1 = false, is_near_b2 = false;
        if (! is_potentially_crossing(dist_b1_b2, dist_b1_i1, is_on_b, is_near_b1, is_near_b2))
        {
            return false;
        }

        // reassign the IP if some endpoints overlap
        using geometry::detail::equals::equals_point_point;
        if (is_near_a1)
        {
            if (is_near_b1 && equals_point_point(a1, b1))
            {
                dist_a1_i1 = 0;
                dist_b1_i1 = 0;
                //i1 = a1v;
                ip_flag = ipi_at_a1;
                return true;
            }
            
            if (is_near_b2 && equals_point_point(a1, b2))
            {
                dist_a1_i1 = 0;
                dist_b1_i1 = dist_b1_b2;
                //i1 = a1v;
                ip_flag = ipi_at_a1;
                return true;
            }
        }

        if (is_near_a2)
        {
            if (is_near_b1 && equals_point_point(a2, b1))
            {
                dist_a1_i1 = dist_a1_a2;
                dist_b1_i1 = 0;
                //i1 = a2v;
                ip_flag = ipi_at_a2;
                return true;
            }

            if (is_near_b2 && equals_point_point(a2, b2))
            {
                dist_a1_i1 = dist_a1_a2;
                dist_b1_i1 = dist_b1_b2;
                //i1 = a2v;
                ip_flag = ipi_at_a2;
                return true;
            }
        }

        // at this point we know that the endpoints doesn't overlap
        // reassign IP and distance if the IP is on a segment and one of
        //   the endpoints of the other segment lies on the former segment
        if (is_on_a)
        {
            if (is_near_b1 && sides.template get<1, 0>() == 0) // b1 wrt a
            {
                dist_b1_i1 = 0;
                //i1 = b1v;
                ip_flag = ipi_at_b1;
                return true;
            }

            if (is_near_b2 && sides.template get<1, 1>() == 0) // b2 wrt a
            {
                dist_b1_i1 = dist_b1_b2;
                //i1 = b2v;
                ip_flag = ipi_at_b2;
                return true;
            }
        }

        if (is_on_b)
        {
            if (is_near_a1 && sides.template get<0, 0>() == 0) // a1 wrt b
            {
                dist_a1_i1 = 0;
                //i1 = a1v;
                ip_flag = ipi_at_a1;
                return true;
            }

            if (is_near_a2 && sides.template get<0, 1>() == 0) // a2 wrt b
            {
                dist_a1_i1 = dist_a1_a2;
                //i1 = a2v;
                ip_flag = ipi_at_a2;
                return true;
            }
        }

        ip_flag = ipi_inters;

        return is_on_a && is_on_b;
    }

    template <typename Vec3d, typename CalcT>
    static inline void calculate_dists(Vec3d const& a1v, // in
                                       Vec3d const& a2v, // in
                                       Vec3d const& norm1, // in
                                       Vec3d const& i1, // in
                                       CalcT& dist_a1_a2, CalcT& dist_a1_i1) // out
    {
        CalcT const c0 = 0;
        CalcT const c1 = 1;
        CalcT const c2 = 2;
        CalcT const c4 = 4;
            
        CalcT cos_a1_a2 = dot_product(a1v, a2v);
        dist_a1_a2 = -cos_a1_a2 + c1; // [1, -1] -> [0, 2] representing [0, pi]

        CalcT cos_a1_i1 = dot_product(a1v, i1);
        dist_a1_i1 = -cos_a1_i1 + c1; // [0, 2] representing [0, pi]
        if (dot_product(norm1, cross_product(a1v, i1)) < c0) // left or right of a1 on a
        {
            dist_a1_i1 = -dist_a1_i1; // [0, 2] -> [0, -2] representing [0, -pi]
        }
        if (dist_a1_i1 <= -c2) // <= -pi
        {
            dist_a1_i1 += c4; // += 2pi
        }
    }

    // the dist of the ip on the other side of the sphere
    template <typename CalcT>
    static inline CalcT dist_of_i2(CalcT const& dist_a1_i1)
    {
        CalcT const c2 = 2;
        CalcT const c4 = 4;

        CalcT dist_a1_i2 = dist_a1_i1 - c2; // dist_a1_i2 = dist_a1_i1 - pi;
        if (dist_a1_i2 <= -c2)          // <= -pi
        {
            dist_a1_i2 += c4;           // += 2pi;
        }
        return dist_a1_i2;
    }

    template <typename CalcT>
    static inline CalcT abs_distance(CalcT const& dist_a1_a2, CalcT const& dist_a1_i1)
    {
        if (dist_a1_i1 < CalcT(0))
            return -dist_a1_i1;
        else if (dist_a1_i1 > dist_a1_a2)
            return dist_a1_i1 - dist_a1_a2;
        else
            return CalcT(0);
    }

    template <typename CalcT>
    static inline bool is_potentially_crossing(CalcT const& dist_a1_a2, CalcT const& dist_a1_i1, // in
                                               bool& is_on_a, bool& is_near_a1, bool& is_near_a2) // out
    {
        is_on_a = segment_ratio<CalcT>(dist_a1_i1, dist_a1_a2).on_segment();
        is_near_a1 = is_near(dist_a1_i1);
        is_near_a2 = is_near(dist_a1_a2 - dist_a1_i1);
        return is_on_a || is_near_a1 || is_near_a2;
    }

    template <typename CalcT, typename P1, typename P2>
    static inline bool is_endpoint_equal(CalcT const& dist,
                                         P1 const& ai, P2 const& b1, P2 const& b2)
    {
        using geometry::detail::equals::equals_point_point;
        return is_near(dist) && (equals_point_point(ai, b1) || equals_point_point(ai, b2));
    }

    template <typename CalcT>
    static inline bool is_near(CalcT const& dist)
    {
        CalcT const small_number = CalcT(boost::is_same<CalcT, float>::value ? 0.0001 : 0.00000001);
        return math::abs(dist) <= small_number;
    }

    template <typename ProjCoord1, typename ProjCoord2>
    static inline int position_value(ProjCoord1 const& ca1,
                                     ProjCoord2 const& cb1,
                                     ProjCoord2 const& cb2)
    {
        // S1x  0   1    2     3   4
        // S2       |---------->
        return math::equals(ca1, cb1) ? 1
             : math::equals(ca1, cb2) ? 3
             : cb1 < cb2 ?
                ( ca1 < cb1 ? 0
                : ca1 > cb2 ? 4
                : 2 )
              : ( ca1 > cb1 ? 0
                : ca1 < cb2 ? 4
                : 2 );
    }
};


#ifndef DOXYGEN_NO_STRATEGY_SPECIALIZATIONS
namespace services
{

/*template <typename Policy, typename CalculationType>
struct default_strategy<spherical_polar_tag, Policy, CalculationType>
{
    typedef relate_spherical_segments<Policy, CalculationType> type;
};*/

template <typename Policy, typename CalculationType>
struct default_strategy<spherical_equatorial_tag, Policy, CalculationType>
{
    typedef relate_spherical_segments<Policy, CalculationType> type;
};

template <typename Policy, typename CalculationType>
struct default_strategy<geographic_tag, Policy, CalculationType>
{
    typedef relate_spherical_segments<Policy, CalculationType> type;
};

} // namespace services
#endif // DOXYGEN_NO_STRATEGY_SPECIALIZATIONS


}} // namespace strategy::intersection

}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGIES_SPHERICAL_INTERSECTION_HPP
