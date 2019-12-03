// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_MULTIPOINT_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_MULTIPOINT_HPP

#include <cstddef>
#include <algorithm>
#include <utility>
#include <vector>

#include <boost/algorithm/minmax_element.hpp>
#include <boost/range.hpp>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/assert.hpp>
#include <boost/geometry/core/coordinate_system.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/util/math.hpp>
#include <boost/geometry/util/range.hpp>

#include <boost/geometry/geometries/helper_geometry.hpp>

#include <boost/geometry/algorithms/detail/normalize.hpp>

#include <boost/geometry/algorithms/detail/envelope/box.hpp>
#include <boost/geometry/algorithms/detail/envelope/initialize.hpp>
#include <boost/geometry/algorithms/detail/envelope/range.hpp>
#include <boost/geometry/algorithms/detail/expand/point.hpp>

#include <boost/geometry/algorithms/dispatch/envelope.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace envelope
{


class envelope_multipoint_on_spheroid
{
private:
    template <std::size_t Dim>
    struct coordinate_less
    {
        template <typename Point>
        inline bool operator()(Point const& point1, Point const& point2) const
        {
            return math::smaller(geometry::get<Dim>(point1),
                                 geometry::get<Dim>(point2));
        }
    };

    template <typename Constants, typename MultiPoint, typename OutputIterator>
    static inline void analyze_point_coordinates(MultiPoint const& multipoint,
                                                 bool& has_south_pole,
                                                 bool& has_north_pole,
                                                 OutputIterator oit)
    {
        typedef typename boost::range_value<MultiPoint>::type point_type;
        typedef typename boost::range_iterator
            <
                MultiPoint const
            >::type iterator_type;

        // analyze point coordinates:
        // (1) normalize point coordinates
        // (2) check if any point is the north or the south pole
        // (3) put all non-pole points in a container
        //
        // notice that at this point in the algorithm, we have at
        // least two points on the spheroid
        has_south_pole = false;
        has_north_pole = false;

        for (iterator_type it = boost::begin(multipoint);
             it != boost::end(multipoint);
             ++it)
        {
            point_type point = detail::return_normalized<point_type>(*it);

            if (math::equals(geometry::get<1>(point),
                             Constants::min_latitude()))
            {
                has_south_pole = true;
            }
            else if (math::equals(geometry::get<1>(point),
                                  Constants::max_latitude()))
            {
                has_north_pole = true;
            }
            else
            {
                *oit++ = point;
            }
        }
    }

    template <typename SortedRange, typename Value>
    static inline Value maximum_gap(SortedRange const& sorted_range,
                                    Value& max_gap_left,
                                    Value& max_gap_right)
    {
        typedef typename boost::range_iterator
            <
                SortedRange const
            >::type iterator_type;

        iterator_type it1 = boost::begin(sorted_range), it2 = it1;
        ++it2;
        max_gap_left = geometry::get<0>(*it1);
        max_gap_right = geometry::get<0>(*it2);

        Value max_gap = max_gap_right - max_gap_left;
        for (++it1, ++it2; it2 != boost::end(sorted_range); ++it1, ++it2)
        {
            Value gap = geometry::get<0>(*it2) - geometry::get<0>(*it1);
            if (math::larger(gap, max_gap))
            {
                max_gap_left = geometry::get<0>(*it1);
                max_gap_right = geometry::get<0>(*it2);
                max_gap = gap;
            }
        }

        return max_gap;
    }

    template
    <
        typename Constants,
        typename PointRange,
        typename LongitudeLess,
        typename CoordinateType
    >
    static inline void get_min_max_longitudes(PointRange& range,
                                              LongitudeLess const& lon_less,
                                              CoordinateType& lon_min,
                                              CoordinateType& lon_max)
    {
        typedef typename boost::range_iterator
            <
                PointRange const
            >::type iterator_type;

        // compute min and max longitude values
        std::pair<iterator_type, iterator_type> min_max_longitudes
            = boost::minmax_element(boost::begin(range),
                                    boost::end(range),
                                    lon_less);

        lon_min = geometry::get<0>(*min_max_longitudes.first);
        lon_max = geometry::get<0>(*min_max_longitudes.second);

        // if the longitude span is "large" compute the true maximum gap
        if (math::larger(lon_max - lon_min, Constants::half_period()))
        {
            std::sort(boost::begin(range), boost::end(range), lon_less);

            CoordinateType max_gap_left = 0, max_gap_right = 0;
            CoordinateType max_gap
                = maximum_gap(range, max_gap_left, max_gap_right);

            CoordinateType complement_gap
                = Constants::period() + lon_min - lon_max;

            if (math::larger(max_gap, complement_gap))
            {
                lon_min = max_gap_right;
                lon_max = max_gap_left + Constants::period();
            }
        }
    }

    template
    <
        typename Constants,
        typename Iterator,
        typename LatitudeLess,
        typename CoordinateType
    >
    static inline void get_min_max_latitudes(Iterator const first,
                                             Iterator const last,
                                             LatitudeLess const& lat_less,
                                             bool has_south_pole,
                                             bool has_north_pole,
                                             CoordinateType& lat_min,
                                             CoordinateType& lat_max)
    {
        if (has_south_pole && has_north_pole)
        {
            lat_min = Constants::min_latitude();
            lat_max = Constants::max_latitude();
        }
        else if (has_south_pole)
        {
            lat_min = Constants::min_latitude();
            lat_max
                = geometry::get<1>(*std::max_element(first, last, lat_less));
        }
        else if (has_north_pole)
        {
            lat_min
                = geometry::get<1>(*std::min_element(first, last, lat_less));
            lat_max = Constants::max_latitude();
        }
        else
        {
            std::pair<Iterator, Iterator> min_max_latitudes
                = boost::minmax_element(first, last, lat_less);

            lat_min = geometry::get<1>(*min_max_latitudes.first);
            lat_max = geometry::get<1>(*min_max_latitudes.second);
        }
    }

public:
    template <typename MultiPoint, typename Box>
    static inline void apply(MultiPoint const& multipoint, Box& mbr)
    {
        typedef typename point_type<MultiPoint>::type point_type;
        typedef typename coordinate_type<MultiPoint>::type coordinate_type;
        typedef typename boost::range_iterator
            <
                MultiPoint const
            >::type iterator_type;

        typedef math::detail::constants_on_spheroid
            <
                coordinate_type,
                typename coordinate_system<MultiPoint>::type::units
            > constants;

        if (boost::empty(multipoint))
        {
            initialize<Box, 0, dimension<Box>::value>::apply(mbr);
            return;
        }

        initialize<Box, 0, 2>::apply(mbr);

        if (boost::size(multipoint) == 1)
        {
            return dispatch::envelope
                <
                    typename boost::range_value<MultiPoint>::type
                >::apply(range::front(multipoint), mbr);
        }

        // analyze the points and put the non-pole ones in the
        // points vector
        std::vector<point_type> points;
        bool has_north_pole = false, has_south_pole = false;

        analyze_point_coordinates<constants>(multipoint,
                                             has_south_pole, has_north_pole,
                                             std::back_inserter(points));

        coordinate_type lon_min, lat_min, lon_max, lat_max;
        if (points.size() == 1)
        {
            // we have one non-pole point and at least one pole point
            lon_min = geometry::get<0>(range::front(points));
            lon_max = geometry::get<0>(range::front(points));
            lat_min = has_south_pole
                ? constants::min_latitude()
                : constants::max_latitude();
            lat_max = has_north_pole
                ? constants::max_latitude()
                : constants::min_latitude();
        }
        else if (points.empty())
        {
            // all points are pole points
            BOOST_GEOMETRY_ASSERT(has_south_pole || has_north_pole);
            lon_min = coordinate_type(0);
            lon_max = coordinate_type(0);
            lat_min = has_south_pole
                ? constants::min_latitude()
                : constants::max_latitude();
            lat_max = (has_north_pole)
                ? constants::max_latitude()
                : constants::min_latitude();
        }
        else
        {
            get_min_max_longitudes<constants>(points,
                                              coordinate_less<0>(),
                                              lon_min,
                                              lon_max);

            get_min_max_latitudes<constants>(points.begin(),
                                             points.end(),
                                             coordinate_less<1>(),
                                             has_south_pole,
                                             has_north_pole,
                                             lat_min,
                                             lat_max);
        }

        typedef typename helper_geometry
            <
                Box,
                coordinate_type,
                typename coordinate_system<MultiPoint>::type::units
            >::type helper_box_type;

        helper_box_type helper_mbr;

        geometry::set<min_corner, 0>(helper_mbr, lon_min);
        geometry::set<min_corner, 1>(helper_mbr, lat_min);
        geometry::set<max_corner, 0>(helper_mbr, lon_max);
        geometry::set<max_corner, 1>(helper_mbr, lat_max);

        // now transform to output MBR (per index)
        envelope_indexed_box_on_spheroid<min_corner, 2>::apply(helper_mbr, mbr);
        envelope_indexed_box_on_spheroid<max_corner, 2>::apply(helper_mbr, mbr);

        // compute envelope for higher coordinates
        iterator_type it = boost::begin(multipoint);
        envelope_one_point<2, dimension<Box>::value>::apply(*it, mbr);

        for (++it; it != boost::end(multipoint); ++it)
        {
            detail::expand::point_loop
                <
                    strategy::compare::default_strategy,
                    strategy::compare::default_strategy,
                    2, dimension<Box>::value
                >::apply(mbr, *it);
        }
    }
};


}} // namespace detail::envelope
#endif // DOXYGEN_NO_DETAIL



#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename MultiPoint, typename CSTag>
struct envelope<MultiPoint, multi_point_tag, CSTag>
    : detail::envelope::envelope_range
{};

template <typename MultiPoint>
struct envelope<MultiPoint, multi_point_tag, spherical_equatorial_tag>
    : detail::envelope::envelope_multipoint_on_spheroid
{};

template <typename MultiPoint>
struct envelope<MultiPoint, multi_point_tag, geographic_tag>
    : detail::envelope::envelope_multipoint_on_spheroid
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_MULTIPOINT_HPP
