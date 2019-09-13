// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2014, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_MULTIPOINT_TO_GEOMETRY_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_MULTIPOINT_TO_GEOMETRY_HPP

#include <boost/range.hpp>

#include <boost/geometry/core/point_type.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/strategies/distance.hpp>
#include <boost/geometry/strategies/tags.hpp>

#include <boost/geometry/algorithms/covered_by.hpp>

#include <boost/geometry/algorithms/dispatch/distance.hpp>

#include <boost/geometry/algorithms/detail/check_iterator_range.hpp>
#include <boost/geometry/algorithms/detail/distance/range_to_geometry_rtree.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace distance
{


template <typename MultiPoint1, typename MultiPoint2, typename Strategy>
struct multipoint_to_multipoint
{
    typedef typename strategy::distance::services::return_type
        <
            Strategy,
            typename point_type<MultiPoint1>::type,
            typename point_type<MultiPoint2>::type
        >::type return_type;   

    static inline return_type apply(MultiPoint1 const& multipoint1,
                                    MultiPoint2 const& multipoint2,
                                    Strategy const& strategy)
    {
        if (boost::size(multipoint2) < boost::size(multipoint1))

        {
            return point_or_segment_range_to_geometry_rtree
                <
                    typename boost::range_iterator<MultiPoint2 const>::type,
                    MultiPoint1,
                    Strategy
                >::apply(boost::begin(multipoint2),
                         boost::end(multipoint2),
                         multipoint1,
                         strategy);
        }

        return point_or_segment_range_to_geometry_rtree
            <
                typename boost::range_iterator<MultiPoint1 const>::type,
                MultiPoint2,
                Strategy
            >::apply(boost::begin(multipoint1),
                     boost::end(multipoint1),
                     multipoint2,
                     strategy);
    }
};


template <typename MultiPoint, typename Linear, typename Strategy>
struct multipoint_to_linear
{
    typedef typename strategy::distance::services::return_type
        <
            Strategy,
            typename point_type<MultiPoint>::type,
            typename point_type<Linear>::type
        >::type return_type;

    static inline return_type apply(MultiPoint const& multipoint,
                                    Linear const& linear,
                                    Strategy const& strategy)
    {
        return detail::distance::point_or_segment_range_to_geometry_rtree
            <
                typename boost::range_iterator<MultiPoint const>::type,
                Linear,
                Strategy
            >::apply(boost::begin(multipoint),
                     boost::end(multipoint),
                     linear,
                     strategy);
    }

    static inline return_type apply(Linear const& linear,
                                    MultiPoint const& multipoint,
                                    Strategy const& strategy)
    {
        return apply(multipoint, linear, strategy);
    }
};


template <typename MultiPoint, typename Areal, typename Strategy>
class multipoint_to_areal
{
private:
    struct not_covered_by_areal
    {
        not_covered_by_areal(Areal const& areal)
            : m_areal(areal)
        {}

        template <typename Point>
        inline bool apply(Point const& point) const
        {
            return !geometry::covered_by(point, m_areal);
        }

        Areal const& m_areal;
    };

public:
    typedef typename strategy::distance::services::return_type
        <
            Strategy,
            typename point_type<MultiPoint>::type,
            typename point_type<Areal>::type
        >::type return_type;

    static inline return_type apply(MultiPoint const& multipoint,
                                    Areal const& areal,
                                    Strategy const& strategy)
    {
        not_covered_by_areal predicate(areal);

        if (check_iterator_range
                <
                    not_covered_by_areal, false
                >::apply(boost::begin(multipoint),
                         boost::end(multipoint),
                         predicate))
        {
            return detail::distance::point_or_segment_range_to_geometry_rtree
                <
                    typename boost::range_iterator<MultiPoint const>::type,
                    Areal,
                    Strategy
                >::apply(boost::begin(multipoint),
                         boost::end(multipoint),
                         areal,
                         strategy);
        }
        return 0;
    }

    static inline return_type apply(Areal const& areal,
                                    MultiPoint const& multipoint,
                                    Strategy const& strategy)
    {
        return apply(multipoint, areal, strategy);
    }
};


}} // namespace detail::distance
#endif // DOXYGEN_NO_DETAIL



#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename MultiPoint1, typename MultiPoint2, typename Strategy>
struct distance
    <
        MultiPoint1, MultiPoint2, Strategy,
        multi_point_tag, multi_point_tag,
        strategy_tag_distance_point_point, false
    > : detail::distance::multipoint_to_multipoint
        <
            MultiPoint1, MultiPoint2, Strategy
        >
{};

template <typename MultiPoint, typename Linear, typename Strategy>
struct distance
    <
         MultiPoint, Linear, Strategy, multi_point_tag, linear_tag,
         strategy_tag_distance_point_segment, false
    > : detail::distance::multipoint_to_linear<MultiPoint, Linear, Strategy>
{};


template <typename Linear, typename MultiPoint, typename Strategy>
struct distance
    <
         Linear, MultiPoint, Strategy, linear_tag, multi_point_tag,
         strategy_tag_distance_point_segment, false
    > : detail::distance::multipoint_to_linear<MultiPoint, Linear, Strategy>
{};


template <typename MultiPoint, typename Areal, typename Strategy>
struct distance
    <
         MultiPoint, Areal, Strategy, multi_point_tag, areal_tag,
         strategy_tag_distance_point_segment, false
    > : detail::distance::multipoint_to_areal<MultiPoint, Areal, Strategy>
{};


template <typename Areal, typename MultiPoint, typename Strategy>
struct distance
    <
         Areal, MultiPoint, Strategy, areal_tag, multi_point_tag,
         strategy_tag_distance_point_segment, false
    > : detail::distance::multipoint_to_areal<MultiPoint, Areal, Strategy>
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISTANCE_MULTIPOINT_TO_GEOMETRY_HPP
