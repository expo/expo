// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2014, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_SEGMENT_TO_BOX_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_SEGMENT_TO_BOX_HPP

#include <cstddef>

#include <functional>
#include <vector>

#include <boost/core/ignore_unused.hpp>
#include <boost/mpl/if.hpp>
#include <boost/numeric/conversion/cast.hpp>
#include <boost/type_traits/is_same.hpp>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/assert.hpp>
#include <boost/geometry/core/closure.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/point_type.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/util/calculation_type.hpp>
#include <boost/geometry/util/condition.hpp>
#include <boost/geometry/util/math.hpp>

#include <boost/geometry/strategies/distance.hpp>
#include <boost/geometry/strategies/tags.hpp>

#include <boost/geometry/policies/compare.hpp>

#include <boost/geometry/algorithms/equals.hpp>
#include <boost/geometry/algorithms/intersects.hpp>
#include <boost/geometry/algorithms/not_implemented.hpp>

#include <boost/geometry/algorithms/detail/assign_box_corners.hpp>
#include <boost/geometry/algorithms/detail/assign_indexed_point.hpp>
#include <boost/geometry/algorithms/detail/distance/default_strategies.hpp>
#include <boost/geometry/algorithms/detail/distance/is_comparable.hpp>

#include <boost/geometry/algorithms/dispatch/distance.hpp>



namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace distance
{


template
<
    typename Segment,
    typename Box,
    typename Strategy,
    bool UsePointBoxStrategy = false
>
class segment_to_box_2D_generic
{
private:
    typedef typename point_type<Segment>::type segment_point;
    typedef typename point_type<Box>::type box_point;

    typedef typename strategy::distance::services::comparable_type
        <
            Strategy
        >::type comparable_strategy;

    typedef detail::closest_feature::point_to_point_range
        <
            segment_point,
            std::vector<box_point>,
            open,
            comparable_strategy
        > point_to_point_range;

    typedef typename strategy::distance::services::return_type
        <
            comparable_strategy, segment_point, box_point
        >::type comparable_return_type;
    
public:
    typedef typename strategy::distance::services::return_type
        <
            Strategy, segment_point, box_point
        >::type return_type;

    static inline return_type apply(Segment const& segment,
                                    Box const& box,
                                    Strategy const& strategy,
                                    bool check_intersection = true)
    {
        if (check_intersection && geometry::intersects(segment, box))
        {
            return 0;
        }

        comparable_strategy cstrategy =
            strategy::distance::services::get_comparable
                <
                    Strategy
                >::apply(strategy);

        // get segment points
        segment_point p[2];
        detail::assign_point_from_index<0>(segment, p[0]);
        detail::assign_point_from_index<1>(segment, p[1]);

        // get box points
        std::vector<box_point> box_points(4);
        detail::assign_box_corners_oriented<true>(box, box_points);
 
        comparable_return_type cd[6];
        for (unsigned int i = 0; i < 4; ++i)
        {
            cd[i] = cstrategy.apply(box_points[i], p[0], p[1]);
        }

        std::pair
            <
                typename std::vector<box_point>::const_iterator,
                typename std::vector<box_point>::const_iterator
            > bit_min[2];

        bit_min[0] = point_to_point_range::apply(p[0],
                                                 box_points.begin(),
                                                 box_points.end(),
                                                 cstrategy,
                                                 cd[4]);
        bit_min[1] = point_to_point_range::apply(p[1],
                                                 box_points.begin(),
                                                 box_points.end(),
                                                 cstrategy,
                                                 cd[5]);

        unsigned int imin = 0;
        for (unsigned int i = 1; i < 6; ++i)
        {
            if (cd[i] < cd[imin])
            {
                imin = i;
            }
        }

        if (BOOST_GEOMETRY_CONDITION(is_comparable<Strategy>::value))
        {
            return cd[imin];
        }

        if (imin < 4)
        {
            return strategy.apply(box_points[imin], p[0], p[1]);
        }
        else
        {
            unsigned int bimin = imin - 4;
            return strategy.apply(p[bimin],
                                  *bit_min[bimin].first,
                                  *bit_min[bimin].second);
        }
    }
};


template
<
    typename Segment,
    typename Box,
    typename Strategy
>
class segment_to_box_2D_generic<Segment, Box, Strategy, true>
{
private:
    typedef typename point_type<Segment>::type segment_point;
    typedef typename point_type<Box>::type box_point;

    typedef typename strategy::distance::services::comparable_type
        <
            Strategy
        >::type comparable_strategy;

    typedef typename strategy::distance::services::return_type
        <
            comparable_strategy, segment_point, box_point
        >::type comparable_return_type;

    typedef typename detail::distance::default_strategy
        <
            segment_point, Box
        >::type point_box_strategy;

    typedef typename strategy::distance::services::comparable_type
        <
            point_box_strategy
        >::type point_box_comparable_strategy;

public:
    typedef typename strategy::distance::services::return_type
        <
            Strategy, segment_point, box_point
        >::type return_type;

    static inline return_type apply(Segment const& segment,
                                    Box const& box,
                                    Strategy const& strategy,
                                    bool check_intersection = true)
    {
        if (check_intersection && geometry::intersects(segment, box))
        {
            return 0;
        }

        comparable_strategy cstrategy =
            strategy::distance::services::get_comparable
                <
                    Strategy
                >::apply(strategy);
        boost::ignore_unused(cstrategy);

        // get segment points
        segment_point p[2];
        detail::assign_point_from_index<0>(segment, p[0]);
        detail::assign_point_from_index<1>(segment, p[1]);

        // get box points
        std::vector<box_point> box_points(4);
        detail::assign_box_corners_oriented<true>(box, box_points);
 
        comparable_return_type cd[6];
        for (unsigned int i = 0; i < 4; ++i)
        {
            cd[i] = cstrategy.apply(box_points[i], p[0], p[1]);
        }

        point_box_comparable_strategy pb_cstrategy;
        boost::ignore_unused(pb_cstrategy);
        cd[4] = pb_cstrategy.apply(p[0], box);
        cd[5] = pb_cstrategy.apply(p[1], box);

        unsigned int imin = 0;
        for (unsigned int i = 1; i < 6; ++i)
        {
            if (cd[i] < cd[imin])
            {
                imin = i;
            }
        }

        if (is_comparable<Strategy>::value)
        {
            return cd[imin];
        }

        if (imin < 4)
        {
            strategy.apply(box_points[imin], p[0], p[1]);
        }
        else
        {
            return point_box_strategy().apply(p[imin - 4], box);
        }
    }
};




template
<
    typename ReturnType,
    typename SegmentPoint,
    typename BoxPoint,
    typename PPStrategy,
    typename PSStrategy
>
class segment_to_box_2D
{
private:
    template <typename Result>
    struct cast_to_result
    {
        template <typename T>
        static inline Result apply(T const& t)
        {
            return boost::numeric_cast<Result>(t);
        }
    };


    template <typename T, bool IsLess /* true */>
    struct compare_less_equal
    {
        typedef compare_less_equal<T, !IsLess> other;

        template <typename T1, typename T2>
        inline bool operator()(T1 const& t1, T2 const& t2) const
        {
            return std::less_equal<T>()(cast_to_result<T>::apply(t1),
                                        cast_to_result<T>::apply(t2));
        }
    };

    template <typename T>
    struct compare_less_equal<T, false>
    {
        typedef compare_less_equal<T, true> other;

        template <typename T1, typename T2>
        inline bool operator()(T1 const& t1, T2 const& t2) const
        {
            return std::greater_equal<T>()(cast_to_result<T>::apply(t1),
                                           cast_to_result<T>::apply(t2));
        }
    };


    template <typename LessEqual>
    struct other_compare
    {
        typedef typename LessEqual::other type;
    };


    // it is assumed here that p0 lies to the right of the box (so the
    // entire segment lies to the right of the box)
    template <typename LessEqual>
    struct right_of_box
    {
        static inline ReturnType apply(SegmentPoint const& p0,
                                       SegmentPoint const& p1,
                                       BoxPoint const& bottom_right,
                                       BoxPoint const& top_right,
                                       PPStrategy const& pp_strategy,
                                       PSStrategy const& ps_strategy)
        {
            boost::ignore_unused(pp_strategy, ps_strategy);

            // the implementation below is written for non-negative slope
            // segments
            //
            // for negative slope segments swap the roles of bottom_right
            // and top_right and use greater_equal instead of less_equal.

            typedef cast_to_result<ReturnType> cast;

            LessEqual less_equal;

            if (less_equal(geometry::get<1>(top_right), geometry::get<1>(p0)))
            {
                // closest box point is the top-right corner
                return cast::apply(pp_strategy.apply(p0, top_right));
            }
            else if (less_equal(geometry::get<1>(bottom_right),
                                geometry::get<1>(p0)))
            {
                // distance is realized between p0 and right-most
                // segment of box
                ReturnType diff = cast::apply(geometry::get<0>(p0))
                    - cast::apply(geometry::get<0>(bottom_right));
                return strategy::distance::services::result_from_distance
                    <
                        PSStrategy, BoxPoint, SegmentPoint
                    >::apply(ps_strategy, math::abs(diff));
            }
            else
            {
                // distance is realized between the bottom-right
                // corner of the box and the segment
                return cast::apply(ps_strategy.apply(bottom_right, p0, p1));
            }
        }
    };


    // it is assumed here that p0 lies above the box (so the
    // entire segment lies above the box)
    template <typename LessEqual>
    struct above_of_box
    {
        static inline ReturnType apply(SegmentPoint const& p0,
                                       SegmentPoint const& p1,
                                       BoxPoint const& top_left,
                                       PSStrategy const& ps_strategy)
        {
            boost::ignore_unused(ps_strategy);

            // the segment lies above the box

            typedef cast_to_result<ReturnType> cast;

            LessEqual less_equal;

            // p0 is above the upper segment of the box
            // (and inside its band)
            if (less_equal(geometry::get<0>(top_left), geometry::get<0>(p0)))
            {
                ReturnType diff = cast::apply(geometry::get<1>(p0))
                    - cast::apply(geometry::get<1>(top_left));
                return strategy::distance::services::result_from_distance
                    <
                        PSStrategy, SegmentPoint, BoxPoint
                    >::apply(ps_strategy, math::abs(diff));
            }

            // p0 is to the left of the box, but p1 is above the box
            // in this case the distance is realized between the
            // top-left corner of the box and the segment
            return cast::apply(ps_strategy.apply(top_left, p0, p1));
        }
    };


    template <typename LessEqual>
    struct check_right_left_of_box
    {
        static inline bool apply(SegmentPoint const& p0,
                                 SegmentPoint const& p1,
                                 BoxPoint const& top_left,
                                 BoxPoint const& top_right,
                                 BoxPoint const& bottom_left,
                                 BoxPoint const& bottom_right,
                                 PPStrategy const& pp_strategy,
                                 PSStrategy const& ps_strategy,
                                 ReturnType& result)
        {
            // p0 lies to the right of the box
            if (geometry::get<0>(p0) >= geometry::get<0>(top_right))
            {
                result = right_of_box
                    <
                        LessEqual
                    >::apply(p0, p1, bottom_right, top_right,
                             pp_strategy, ps_strategy);
                return true;
            }

            // p1 lies to the left of the box
            if (geometry::get<0>(p1) <= geometry::get<0>(bottom_left))
            {
                result = right_of_box
                    <
                        typename other_compare<LessEqual>::type
                    >::apply(p1, p0, top_left, bottom_left,
                             pp_strategy, ps_strategy);
                return true;
            }

            return false;
        }
    };


    template <typename LessEqual>
    struct check_above_below_of_box
    {
        static inline bool apply(SegmentPoint const& p0,
                                 SegmentPoint const& p1,
                                 BoxPoint const& top_left,
                                 BoxPoint const& top_right,
                                 BoxPoint const& bottom_left,
                                 BoxPoint const& bottom_right,
                                 PSStrategy const& ps_strategy,
                                 ReturnType& result)
        {
            // the segment lies below the box
            if (geometry::get<1>(p1) < geometry::get<1>(bottom_left))
            {
                result = above_of_box
                    <
                        typename other_compare<LessEqual>::type
                    >::apply(p1, p0, bottom_right, ps_strategy);
                return true;
            }

            // the segment lies above the box
            if (geometry::get<1>(p0) > geometry::get<1>(top_right))
            {
                result = above_of_box
                    <
                        LessEqual
                    >::apply(p0, p1, top_left, ps_strategy);
                return true;
            }
            return false;
        }
    };

    struct check_generic_position
    {
        static inline bool apply(SegmentPoint const& p0,
                                 SegmentPoint const& p1,
                                 BoxPoint const& bottom_left0,
                                 BoxPoint const& top_right0,
                                 BoxPoint const& bottom_left1,
                                 BoxPoint const& top_right1,
                                 BoxPoint const& corner1,
                                 BoxPoint const& corner2,
                                 PSStrategy const& ps_strategy,
                                 ReturnType& result)
        {
            typedef cast_to_result<ReturnType> cast;

            ReturnType diff0 = cast::apply(geometry::get<0>(p1))
                - cast::apply(geometry::get<0>(p0));
            ReturnType t_min0 = cast::apply(geometry::get<0>(bottom_left0))
                - cast::apply(geometry::get<0>(p0));
            ReturnType t_max0 = cast::apply(geometry::get<0>(top_right0))
                - cast::apply(geometry::get<0>(p0));

            ReturnType diff1 = cast::apply(geometry::get<1>(p1))
                - cast::apply(geometry::get<1>(p0));
            ReturnType t_min1 = cast::apply(geometry::get<1>(bottom_left1))
                - cast::apply(geometry::get<1>(p0));
            ReturnType t_max1 = cast::apply(geometry::get<1>(top_right1))
                - cast::apply(geometry::get<1>(p0));

            if (diff1 < 0)
            {
                diff1 = -diff1;
                t_min1 = -t_min1;
                t_max1 = -t_max1;
            }

            //  t_min0 > t_max1
            if (t_min0 * diff1 > t_max1 * diff0)
            {
                result = cast::apply(ps_strategy.apply(corner1, p0, p1));
                return true;
            }

            //  t_max0 < t_min1
            if (t_max0 * diff1 < t_min1 * diff0)
            {
                result = cast::apply(ps_strategy.apply(corner2, p0, p1));
                return true;
            }
            return false;
        }
    };

    static inline ReturnType
    non_negative_slope_segment(SegmentPoint const& p0,
                               SegmentPoint const& p1,
                               BoxPoint const& top_left,
                               BoxPoint const& top_right,
                               BoxPoint const& bottom_left,
                               BoxPoint const& bottom_right,
                               PPStrategy const& pp_strategy,
                               PSStrategy const& ps_strategy)
    {
        typedef compare_less_equal<ReturnType, true> less_equal;

        // assert that the segment has non-negative slope
        BOOST_GEOMETRY_ASSERT( ( math::equals(geometry::get<0>(p0), geometry::get<0>(p1))
                              && geometry::get<1>(p0) < geometry::get<1>(p1))
                            ||
                               ( geometry::get<0>(p0) < geometry::get<0>(p1)
                              && geometry::get<1>(p0) <= geometry::get<1>(p1) )
                            || geometry::has_nan_coordinate(p0)
                            || geometry::has_nan_coordinate(p1));

        ReturnType result(0);

        if (check_right_left_of_box
                <
                    less_equal
                >::apply(p0, p1,
                         top_left, top_right, bottom_left, bottom_right,
                         pp_strategy, ps_strategy, result))
        {
            return result;
        }

        if (check_above_below_of_box
                <
                    less_equal
                >::apply(p0, p1,
                         top_left, top_right, bottom_left, bottom_right,
                         ps_strategy, result))
        {
            return result;
        }

        if (check_generic_position::apply(p0, p1,
                                          bottom_left, top_right,
                                          bottom_left, top_right,
                                          top_left, bottom_right,
                                          ps_strategy, result))
        {
            return result;
        }

        // in all other cases the box and segment intersect, so return 0
        return result;
    }


    static inline ReturnType
    negative_slope_segment(SegmentPoint const& p0,
                           SegmentPoint const& p1,
                           BoxPoint const& top_left,
                           BoxPoint const& top_right,
                           BoxPoint const& bottom_left,
                           BoxPoint const& bottom_right,
                           PPStrategy const& pp_strategy,
                           PSStrategy const& ps_strategy)
    {
        typedef compare_less_equal<ReturnType, false> greater_equal;

        // assert that the segment has negative slope
        BOOST_GEOMETRY_ASSERT( ( geometry::get<0>(p0) < geometry::get<0>(p1)
                              && geometry::get<1>(p0) > geometry::get<1>(p1) )
                            || geometry::has_nan_coordinate(p0)
                            || geometry::has_nan_coordinate(p1) );

        ReturnType result(0);

        if (check_right_left_of_box
                <
                    greater_equal
                >::apply(p0, p1,
                         bottom_left, bottom_right, top_left, top_right,
                         pp_strategy, ps_strategy, result))
        {
            return result;
        }

        if (check_above_below_of_box
                <
                    greater_equal
                >::apply(p1, p0,
                         top_right, top_left, bottom_right, bottom_left,
                         ps_strategy, result))
        {
            return result;
        }

        if (check_generic_position::apply(p0, p1,
                                          bottom_left, top_right,
                                          top_right, bottom_left,
                                          bottom_left, top_right,
                                          ps_strategy, result))
        {
            return result;
        }

        // in all other cases the box and segment intersect, so return 0
        return result;
    }

public:
    static inline ReturnType apply(SegmentPoint const& p0,
                                   SegmentPoint const& p1,
                                   BoxPoint const& top_left,
                                   BoxPoint const& top_right,
                                   BoxPoint const& bottom_left,
                                   BoxPoint const& bottom_right,
                                   PPStrategy const& pp_strategy,
                                   PSStrategy const& ps_strategy)
    {
        BOOST_GEOMETRY_ASSERT( geometry::less<SegmentPoint>()(p0, p1)
                            || geometry::has_nan_coordinate(p0)
                            || geometry::has_nan_coordinate(p1) );

        if (geometry::get<0>(p0) < geometry::get<0>(p1)
            && geometry::get<1>(p0) > geometry::get<1>(p1))
        {
            return negative_slope_segment(p0, p1,
                                          top_left, top_right,
                                          bottom_left, bottom_right,
                                          pp_strategy, ps_strategy);
        }

        return non_negative_slope_segment(p0, p1,
                                          top_left, top_right,
                                          bottom_left, bottom_right,
                                          pp_strategy, ps_strategy);
    }
};


//=========================================================================


template
<
    typename Segment,
    typename Box,
    typename std::size_t Dimension,
    typename PPStrategy,
    typename PSStrategy
>
class segment_to_box
    : not_implemented<Segment, Box>
{};


template
<
    typename Segment,
    typename Box,
    typename PPStrategy,
    typename PSStrategy
>
class segment_to_box<Segment, Box, 2, PPStrategy, PSStrategy>
{
private:
    typedef typename point_type<Segment>::type segment_point;
    typedef typename point_type<Box>::type box_point;

    typedef typename strategy::distance::services::comparable_type
        <
            PPStrategy
        >::type pp_comparable_strategy;

    typedef typename strategy::distance::services::comparable_type
        <
            PSStrategy
        >::type ps_comparable_strategy;

    typedef typename strategy::distance::services::return_type
        <
            ps_comparable_strategy, segment_point, box_point
        >::type comparable_return_type;
public:
    typedef typename strategy::distance::services::return_type
        <
            PSStrategy, segment_point, box_point
        >::type return_type;

    static inline return_type apply(Segment const& segment,
                                    Box const& box,
                                    PPStrategy const& pp_strategy,
                                    PSStrategy const& ps_strategy)
    {
        segment_point p[2];
        detail::assign_point_from_index<0>(segment, p[0]);
        detail::assign_point_from_index<1>(segment, p[1]);

        if (geometry::equals(p[0], p[1]))
        {
            typedef typename boost::mpl::if_
                <
                    boost::is_same
                        <
                            ps_comparable_strategy,
                            PSStrategy
                        >,
                    typename strategy::distance::services::comparable_type
                        <
                            typename detail::distance::default_strategy
                                <
                                    segment_point, Box
                                >::type
                        >::type,
                    typename detail::distance::default_strategy
                        <
                            segment_point, Box
                        >::type
                >::type point_box_strategy_type;

            return dispatch::distance
                <
                    segment_point,
                    Box,
                    point_box_strategy_type
                >::apply(p[0], box, point_box_strategy_type());
        }

        box_point top_left, top_right, bottom_left, bottom_right;
        detail::assign_box_corners(box, bottom_left, bottom_right,
                                   top_left, top_right);

        if (geometry::less<segment_point>()(p[0], p[1]))
        {
            return segment_to_box_2D
                <
                    return_type,
                    segment_point,
                    box_point,
                    PPStrategy,
                    PSStrategy
                >::apply(p[0], p[1],
                         top_left, top_right, bottom_left, bottom_right,
                         pp_strategy,
                         ps_strategy);
        }
        else
        {
            return segment_to_box_2D
                <
                    return_type,
                    segment_point,
                    box_point,
                    PPStrategy,
                    PSStrategy
                >::apply(p[1], p[0],
                         top_left, top_right, bottom_left, bottom_right,
                         pp_strategy,
                         ps_strategy);
        }
    }
};


}} // namespace detail::distance
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename Segment, typename Box, typename Strategy>
struct distance
    <
        Segment, Box, Strategy, segment_tag, box_tag,
        strategy_tag_distance_point_segment, false
    >
{
    typedef typename strategy::distance::services::return_type
        <
            Strategy,
            typename point_type<Segment>::type,
            typename point_type<Box>::type
        >::type return_type;


    static inline return_type apply(Segment const& segment,
                                    Box const& box,
                                    Strategy const& strategy)
    {
        assert_dimension_equal<Segment, Box>();

        typedef typename boost::mpl::if_
            <
                boost::is_same
                    <
                        typename strategy::distance::services::comparable_type
                            <
                                Strategy
                            >::type,
                        Strategy
                    >,
                typename strategy::distance::services::comparable_type
                    <
                        typename detail::distance::default_strategy
                            <
                                typename point_type<Segment>::type,
                                typename point_type<Box>::type
                            >::type
                    >::type,
                typename detail::distance::default_strategy
                    <
                        typename point_type<Segment>::type,
                        typename point_type<Box>::type
                    >::type
            >::type pp_strategy_type;


        return detail::distance::segment_to_box
            <
                Segment,
                Box,
                dimension<Segment>::value,
                pp_strategy_type,
                Strategy
            >::apply(segment, box, pp_strategy_type(), strategy);
    }
};



} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_SEGMENT_TO_BOX_HPP
