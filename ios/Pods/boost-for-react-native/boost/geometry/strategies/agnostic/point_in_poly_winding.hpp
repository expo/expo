// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2013 Adam Wulkiewicz, Lodz, Poland.

// This file was modified by Oracle on 2013, 2014, 2016.
// Modifications copyright (c) 2013-2016 Oracle and/or its affiliates.
// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGY_AGNOSTIC_POINT_IN_POLY_WINDING_HPP
#define BOOST_GEOMETRY_STRATEGY_AGNOSTIC_POINT_IN_POLY_WINDING_HPP


#include <boost/core/ignore_unused.hpp>

#include <boost/geometry/util/math.hpp>
#include <boost/geometry/util/select_calculation_type.hpp>

#include <boost/geometry/strategies/side.hpp>
#include <boost/geometry/strategies/covered_by.hpp>
#include <boost/geometry/strategies/within.hpp>


namespace boost { namespace geometry
{

namespace strategy { namespace within
{

// 1 deg or pi/180 rad
template <typename Point,
          typename CalculationType = typename coordinate_type<Point>::type>
struct winding_small_angle
{
    typedef typename coordinate_system<Point>::type cs_t;
    typedef math::detail::constants_on_spheroid
        <
            CalculationType,
            typename cs_t::units
        > constants;

    static inline CalculationType apply()
    {
        return constants::half_period() / CalculationType(180);
    }
};


// Fix for https://svn.boost.org/trac/boost/ticket/9628
// For floating point coordinates, the <D> coordinate of a point is compared
// with the segment's points using some EPS. If the coordinates are "equal"
// the sides are calculated. Therefore we can treat a segment as a long areal
// geometry having some width. There is a small ~triangular area somewhere
// between the segment's effective area and a segment's line used in sides
// calculation where the segment is on the one side of the line but on the
// other side of a segment (due to the width).
// Below picture assuming D = 1, if D = 0 horiz<->vert, E<->N, RIGHT<->UP.
// For the s1 of a segment going NE the real side is RIGHT but the point may
// be detected as LEFT, like this:
//                     RIGHT
//                 ___----->
//                  ^      O Pt  __ __
//                 EPS     __ __
//                  v__ __ BUT DETECTED AS LEFT OF THIS LINE
//             _____7
//       _____/
// _____/
// In the code below actually D = 0, so segments are nearly-vertical
// Called when the point is on the same level as one of the segment's points
// but the point is not aligned with a vertical segment
template <typename CSTag>
struct winding_side_equal
{
    typedef typename strategy::side::services::default_strategy
        <
            CSTag
        >::type strategy_side_type;

    template <typename Point, typename PointOfSegment>
    static inline int apply(Point const& point,
                            PointOfSegment const& se,
                            int count)
    {
        typedef typename coordinate_type<PointOfSegment>::type scoord_t;
        typedef typename coordinate_system<PointOfSegment>::type::units units_t;

        if (math::equals(get<1>(point), get<1>(se)))
            return 0;

        // Create a horizontal segment intersecting the original segment's endpoint
        // equal to the point, with the derived direction (E/W).
        PointOfSegment ss1, ss2;
        set<1>(ss1, get<1>(se));
        set<0>(ss1, get<0>(se));
        set<1>(ss2, get<1>(se));
        scoord_t ss20 = get<0>(se);
        if (count > 0)
        {
            ss20 += winding_small_angle<PointOfSegment>::apply();
        }
        else
        {
            ss20 -= winding_small_angle<PointOfSegment>::apply();
        }
        math::normalize_longitude<units_t>(ss20);
        set<0>(ss2, ss20);

        // Check the side using this vertical segment
        return strategy_side_type::apply(ss1, ss2, point);
    }
};
// The optimization for cartesian
template <>
struct winding_side_equal<cartesian_tag>
{
    template <typename Point, typename PointOfSegment>
    static inline int apply(Point const& point,
                            PointOfSegment const& se,
                            int count)
    {
        // NOTE: for D=0 the signs would be reversed
        return math::equals(get<1>(point), get<1>(se)) ?
                0 :
                get<1>(point) < get<1>(se) ?
                    // assuming count is equal to 1 or -1
                    -count : // ( count > 0 ? -1 : 1) :
                    count;   // ( count > 0 ? 1 : -1) ;
    }
};


template <typename Point,
          typename CalculationType,
          typename CSTag = typename cs_tag<Point>::type>
struct winding_check_touch
{
    typedef CalculationType calc_t;
    typedef typename coordinate_system<Point>::type::units units_t;
    typedef math::detail::constants_on_spheroid<CalculationType, units_t> constants;

    template <typename PointOfSegment, typename State>
    static inline int apply(Point const& point,
                            PointOfSegment const& seg1,
                            PointOfSegment const& seg2,
                            State& state,
                            bool& eq1,
                            bool& eq2)
    {
        calc_t const pi = constants::half_period();
        calc_t const pi2 = pi / calc_t(2);

        calc_t const px = get<0>(point);
        calc_t const s1x = get<0>(seg1);
        calc_t const s2x = get<0>(seg2);
        calc_t const py = get<1>(point);
        calc_t const s1y = get<1>(seg1);
        calc_t const s2y = get<1>(seg2);

        // NOTE: lat in {-90, 90} and arbitrary lon
        //  it doesn't matter what lon it is if it's a pole
        //  so e.g. if one of the segment endpoints is a pole
        //  then only the other lon matters
        
        bool eq1_strict = math::equals(s1x, px);
        bool eq2_strict = math::equals(s2x, px);

        eq1 = eq1_strict // lon strictly equal to s1
           || math::equals(s1y, pi2) || math::equals(s1y, -pi2); // s1 is pole
        eq2 = eq2_strict // lon strictly equal to s2
           || math::equals(s2y, pi2) || math::equals(s2y, -pi2); // s2 is pole
        
        // segment overlapping pole
        calc_t s1x_anti = s1x + constants::half_period();
        math::normalize_longitude<units_t, calc_t>(s1x_anti);
        bool antipodal = math::equals(s2x, s1x_anti);
        if (antipodal)
        {
            eq1 = eq2 = eq1 || eq2;

            // segment overlapping pole and point is pole
            if (math::equals(py, pi2) || math::equals(py, -pi2))
            {
                eq1 = eq2 = true;
            }
        }
        
        // Both equal p -> segment vertical
        // The only thing which has to be done is check if point is ON segment
        if (eq1 && eq2)
        {
            // segment endpoints on the same sides of the globe
            if (! antipodal
                // p's lat between segment endpoints' lats
                ? (s1y <= py && s2y >= py) || (s2y <= py && s1y >= py)
                // going through north or south pole?
                : (pi - s1y - s2y <= pi
                    ? (eq1_strict && s1y <= py) || (eq2_strict && s2y <= py) // north
                        || math::equals(py, pi2) // point on north pole
                    : (eq1_strict && s1y >= py) || (eq2_strict && s2y >= py)) // south
                        || math::equals(py, -pi2) // point on south pole
                )
            {
                state.m_touches = true;
            }
            return true;
        }
        return false;
    }
};
// The optimization for cartesian
template <typename Point, typename CalculationType>
struct winding_check_touch<Point, CalculationType, cartesian_tag>
{
    typedef CalculationType calc_t;

    template <typename PointOfSegment, typename State>
    static inline bool apply(Point const& point,
                             PointOfSegment const& seg1,
                             PointOfSegment const& seg2,
                             State& state,
                             bool& eq1,
                             bool& eq2)
    {
        calc_t const px = get<0>(point);
        calc_t const s1x = get<0>(seg1);
        calc_t const s2x = get<0>(seg2);

        eq1 = math::equals(s1x, px);
        eq2 = math::equals(s2x, px);

        // Both equal p -> segment vertical
        // The only thing which has to be done is check if point is ON segment
        if (eq1 && eq2)
        {
            calc_t const py = get<1>(point);
            calc_t const s1y = get<1>(seg1);
            calc_t const s2y = get<1>(seg2);
            if ((s1y <= py && s2y >= py) || (s2y <= py && s1y >= py))
            {
                state.m_touches = true;
            }
            return true;
        }
        return false;
    }
};


// Called if point is not aligned with a vertical segment
template <typename Point,
          typename CalculationType,
          typename CSTag = typename cs_tag<Point>::type>
struct winding_calculate_count
{
    typedef CalculationType calc_t;
    typedef typename coordinate_system<Point>::type::units units_t;

    static inline bool greater(calc_t const& l, calc_t const& r)
    {
        calc_t diff = l - r;
        math::normalize_longitude<units_t, calc_t>(diff);
        return diff > calc_t(0);
    }

    static inline int apply(calc_t const& p,
                            calc_t const& s1, calc_t const& s2,
                            bool eq1, bool eq2)
    {
        // Probably could be optimized by avoiding normalization for some comparisons
        // e.g. s1 > p could be calculated from p > s1

        // If both segment endpoints were poles below checks wouldn't be enough
        // but this means that either both are the same or that they are N/S poles
        // and therefore the segment is not valid.
        // If needed (eq1 && eq2 ? 0) could be returned

        return
              eq1 ? (greater(s2, p) ?  1 : -1)      // Point on level s1, E/W depending on s2
            : eq2 ? (greater(s1, p) ? -1 :  1)      // idem
            : greater(p, s1) && greater(s2, p) ?  2 // Point between s1 -> s2 --> E
            : greater(p, s2) && greater(s1, p) ? -2 // Point between s2 -> s1 --> W
            : 0;
    }
};
// The optimization for cartesian
template <typename Point, typename CalculationType>
struct winding_calculate_count<Point, CalculationType, cartesian_tag>
{
    typedef CalculationType calc_t;
    
    static inline int apply(calc_t const& p,
                            calc_t const& s1, calc_t const& s2,
                            bool eq1, bool eq2)
    {
        return
              eq1 ? (s2 > p ?  1 : -1)  // Point on level s1, E/W depending on s2
            : eq2 ? (s1 > p ? -1 :  1)  // idem
            : s1 < p && s2 > p ?  2     // Point between s1 -> s2 --> E
            : s2 < p && s1 > p ? -2     // Point between s2 -> s1 --> W
            : 0;
    }
};


/*!
\brief Within detection using winding rule
\ingroup strategies
\tparam Point \tparam_point
\tparam PointOfSegment \tparam_segment_point
\tparam CalculationType \tparam_calculation
\author Barend Gehrels
\note The implementation is inspired by terralib http://www.terralib.org (LGPL)
\note but totally revised afterwards, especially for cases on segments
\note Only dependant on "side", -> agnostic, suitable for spherical/latlong

\qbk{
[heading See also]
[link geometry.reference.algorithms.within.within_3_with_strategy within (with strategy)]
}
 */
template
<
    typename Point,
    typename PointOfSegment = Point,
    typename CalculationType = void
>
class winding
{
    typedef typename select_calculation_type
        <
            Point,
            PointOfSegment,
            CalculationType
        >::type calculation_type;


    typedef typename strategy::side::services::default_strategy
        <
            typename cs_tag<Point>::type
        >::type strategy_side_type;


    /*! subclass to keep state */
    class counter
    {
        int m_count;
        bool m_touches;

        inline int code() const
        {
            return m_touches ? 0 : m_count == 0 ? -1 : 1;
        }

    public :
        friend class winding;

        template <typename P, typename CT, typename CST>
        friend struct winding_check_touch;

        inline counter()
            : m_count(0)
            , m_touches(false)
        {}

    };


    static inline int check_segment(Point const& point,
                PointOfSegment const& seg1, PointOfSegment const& seg2,
                counter& state, bool& eq1, bool& eq2)
    {
        if (winding_check_touch<Point, calculation_type>
                ::apply(point, seg1, seg2, state, eq1, eq2))
        {
            return 0;
        }

        calculation_type const p = get<0>(point);
        calculation_type const s1 = get<0>(seg1);
        calculation_type const s2 = get<0>(seg2);
        return winding_calculate_count<Point, calculation_type>
                    ::apply(p, s1, s2, eq1, eq2);
    }


public :

    // Typedefs and static methods to fulfill the concept
    typedef Point point_type;
    typedef PointOfSegment segment_point_type;
    typedef counter state_type;

    static inline bool apply(Point const& point,
                PointOfSegment const& s1, PointOfSegment const& s2,
                counter& state)
    {
        typedef typename cs_tag<Point>::type cs_t;

        bool eq1 = false;
        bool eq2 = false;
        boost::ignore_unused(eq2);

        int count = check_segment(point, s1, s2, state, eq1, eq2);
        if (count != 0)
        {
            int side = 0;
            if (count == 1 || count == -1)
            {
                side = winding_side_equal<cs_t>::apply(point, eq1 ? s1 : s2, count);
            }
            else // count == 2 || count == -2
            {
                // 1 left, -1 right
                side = strategy_side_type::apply(s1, s2, point);
            }
            
            if (side == 0)
            {
                // Point is lying on segment
                state.m_touches = true;
                state.m_count = 0;
                return false;
            }

            // Side is NEG for right, POS for left.
            // The count is -2 for down, 2 for up (or -1/1)
            // Side positive thus means UP and LEFTSIDE or DOWN and RIGHTSIDE
            // See accompagnying figure (TODO)
            if (side * count > 0)
            {
                state.m_count += count;
            }
        }
        return ! state.m_touches;
    }

    static inline int result(counter const& state)
    {
        return state.code();
    }
};


#ifndef DOXYGEN_NO_STRATEGY_SPECIALIZATIONS

namespace services
{

// Register using "areal_tag" for ring, polygon, multi-polygon
template <typename AnyTag, typename Point, typename Geometry>
struct default_strategy<point_tag, AnyTag, point_tag, areal_tag, cartesian_tag, cartesian_tag, Point, Geometry>
{
    typedef winding<Point, typename geometry::point_type<Geometry>::type> type;
};

template <typename AnyTag, typename Point, typename Geometry>
struct default_strategy<point_tag, AnyTag, point_tag, areal_tag, spherical_tag, spherical_tag, Point, Geometry>
{
    typedef winding<Point, typename geometry::point_type<Geometry>::type> type;
};

// TODO: use linear_tag and pointlike_tag the same way how areal_tag is used

template <typename Point, typename Geometry, typename AnyTag>
struct default_strategy<point_tag, AnyTag, point_tag, AnyTag, cartesian_tag, cartesian_tag, Point, Geometry>
{
    typedef winding<Point, typename geometry::point_type<Geometry>::type> type;
};

template <typename Point, typename Geometry, typename AnyTag>
struct default_strategy<point_tag, AnyTag, point_tag, AnyTag, spherical_tag, spherical_tag, Point, Geometry>
{
    typedef winding<Point, typename geometry::point_type<Geometry>::type> type;
};

} // namespace services

#endif


}} // namespace strategy::within



#ifndef DOXYGEN_NO_STRATEGY_SPECIALIZATIONS
namespace strategy { namespace covered_by { namespace services
{

// Register using "areal_tag" for ring, polygon, multi-polygon
template <typename AnyTag, typename Point, typename Geometry>
struct default_strategy<point_tag, AnyTag, point_tag, areal_tag, cartesian_tag, cartesian_tag, Point, Geometry>
{
    typedef strategy::within::winding<Point, typename geometry::point_type<Geometry>::type> type;
};

template <typename AnyTag, typename Point, typename Geometry>
struct default_strategy<point_tag, AnyTag, point_tag, areal_tag, spherical_tag, spherical_tag, Point, Geometry>
{
    typedef strategy::within::winding<Point, typename geometry::point_type<Geometry>::type> type;
};

// TODO: use linear_tag and pointlike_tag the same way how areal_tag is used

template <typename Point, typename Geometry, typename AnyTag>
struct default_strategy<point_tag, AnyTag, point_tag, AnyTag, cartesian_tag, cartesian_tag, Point, Geometry>
{
    typedef strategy::within::winding<Point, typename geometry::point_type<Geometry>::type> type;
};

template <typename Point, typename Geometry, typename AnyTag>
struct default_strategy<point_tag, AnyTag, point_tag, AnyTag, spherical_tag, spherical_tag, Point, Geometry>
{
    typedef strategy::within::winding<Point, typename geometry::point_type<Geometry>::type> type;
};

}}} // namespace strategy::covered_by::services
#endif


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGY_AGNOSTIC_POINT_IN_POLY_WINDING_HPP
