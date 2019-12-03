// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2014, Oracle and/or its affiliates.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_TOPOLOGY_CHECK_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_TOPOLOGY_CHECK_HPP

#include <boost/geometry/util/range.hpp>

#include <boost/geometry/algorithms/detail/equals/point_point.hpp>
#include <boost/geometry/policies/compare.hpp>

#include <boost/geometry/util/has_nan_coordinate.hpp>

namespace boost { namespace geometry {

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace relate {

// TODO: change the name for e.g. something with the word "exterior"

template <typename Geometry,
          typename Tag = typename geometry::tag<Geometry>::type>
struct topology_check
    : not_implemented<Tag>
{};

//template <typename Point>
//struct topology_check<Point, point_tag>
//{
//    static const char interior = '0';
//    static const char boundary = 'F';
//
//    static const bool has_interior = true;
//    static const bool has_boundary = false;
//
//    topology_check(Point const&) {}
//    template <typename IgnoreBoundaryPoint>
//    topology_check(Point const&, IgnoreBoundaryPoint const&) {}
//};

template <typename Linestring>
struct topology_check<Linestring, linestring_tag>
{
    static const char interior = '1';
    static const char boundary = '0';

    bool has_interior;
    bool has_boundary;

    topology_check(Linestring const& ls)
    {
        init(ls, 0); /*dummy param*/
    }

    template <typename IgnoreBoundaryPoint>
    topology_check(Linestring const& ls, IgnoreBoundaryPoint const& ibp)
    {
        init(ls, ibp); /*dummy param, won't be used*/
    }

    // Even if some point is on the boundary, if the Linestring has the boundary,
    // there will be second boundary point different than IgnoreBoundaryPoint
    template <typename IgnoreBoundaryPoint>
    void init(Linestring const& ls, IgnoreBoundaryPoint const&)
    {
        std::size_t count = boost::size(ls);
        has_interior = count > 0;
        // NOTE: Linestring with all points equal is treated as 1d linear ring
        has_boundary = count > 1
                    && ! detail::equals::equals_point_point(range::front(ls), range::back(ls));
    }
};

template <typename MultiLinestring>
struct topology_check<MultiLinestring, multi_linestring_tag>
{
    static const char interior = '1';
    static const char boundary = '0';

    bool has_interior;
    bool has_boundary;

    topology_check(MultiLinestring const& mls)
    {
        init(mls, not_ignoring_counter());
    }

    template <typename IgnoreBoundaryPoint>
    topology_check(MultiLinestring const& mls, IgnoreBoundaryPoint const& ibp)
    {
        init(mls, ignoring_counter<IgnoreBoundaryPoint>(ibp));
    }

    template <typename OddCounter>
    void init(MultiLinestring const& mls, OddCounter const& odd_counter)
    {
        typedef typename geometry::point_type<MultiLinestring>::type point_type;
        std::vector<point_type> endpoints;
        endpoints.reserve(boost::size(mls) * 2);

        typedef typename boost::range_iterator<MultiLinestring const>::type ls_iterator;
        for ( ls_iterator it = boost::begin(mls) ; it != boost::end(mls) ; ++it )
        {
            typename boost::range_reference<MultiLinestring const>::type
                ls = *it;

            std::size_t count = boost::size(ls);

            if (count > 0)
            {
                has_interior = true;
            }

            if (count > 1)
            {
                typedef typename boost::range_reference
                    <
                        typename boost::range_value<MultiLinestring const>::type const
                    >::type point_reference;
                
                point_reference front_pt = range::front(ls);
                point_reference back_pt = range::back(ls);

                // don't store boundaries of linear rings, this doesn't change anything
                if (! equals::equals_point_point(front_pt, back_pt))
                {
                    // do not add points containing NaN coordinates
                    // because they cannot be reasonably compared, e.g. with MSVC
                    // an assertion failure is reported in std::equal_range()
                    // NOTE: currently ignoring_counter calling std::equal_range()
                    //   is not used anywhere in the code, still it's safer this way
                    if (! geometry::has_nan_coordinate(front_pt))
                    {
                        endpoints.push_back(front_pt);
                    }
                    if (! geometry::has_nan_coordinate(back_pt))
                    {
                        endpoints.push_back(back_pt);
                    }
                }
            }
        }

        has_boundary = false;

        if ( !endpoints.empty() )
        {
            std::sort(endpoints.begin(), endpoints.end(), geometry::less<point_type>());
            has_boundary = odd_counter(endpoints.begin(), endpoints.end());
        }
    }

    struct not_ignoring_counter
    {
        template <typename It>
        bool operator()(It first, It last) const
        {
            return find_odd_count(first, last);
        }
    };

    template <typename Point>
    struct ignoring_counter
    {
        ignoring_counter(Point const& pt) : m_pt(pt) {}

        template <typename It>
        bool operator()(It first, It last) const
        {
            typedef typename std::iterator_traits<It>::value_type point_type;

            std::pair<It, It> ignore_range
                              = std::equal_range(first, last, m_pt,
                                                 geometry::less<point_type>());

            if ( find_odd_count(first, ignore_range.first) )
                return true;

            return find_odd_count(ignore_range.second, last);
        }

        Point const& m_pt;
    };

    template <typename It>
    static inline bool find_odd_count(It first, It last)
    {
        if ( first == last )
            return false;

        std::size_t count = 1;
        It prev = first;
        ++first;
        for ( ; first != last ; ++first, ++prev )
        {
            // the end of the equal points subrange
            if ( ! equals::equals_point_point(*first, *prev) )
            {
                if ( count % 2 != 0 )
                    return true;

                count = 1;
            }
            else
            {
                ++count;
            }
        }

        return count % 2 != 0;
    }
};

template <typename Ring>
struct topology_check<Ring, ring_tag>
{
    static const char interior = '2';
    static const char boundary = '1';
    static const bool has_interior = true;
    static const bool has_boundary = true;

    topology_check(Ring const&) {}
    template <typename P>
    topology_check(Ring const&, P const&) {}
};

template <typename Polygon>
struct topology_check<Polygon, polygon_tag>
{
    static const char interior = '2';
    static const char boundary = '1';
    static const bool has_interior = true;
    static const bool has_boundary = true;

    topology_check(Polygon const&) {}
    template <typename P>
    topology_check(Polygon const&, P const&) {}
};

template <typename MultiPolygon>
struct topology_check<MultiPolygon, multi_polygon_tag>
{
    static const char interior = '2';
    static const char boundary = '1';
    static const bool has_interior = true;
    static const bool has_boundary = true;

    topology_check(MultiPolygon const&) {}
    template <typename P>
    topology_check(MultiPolygon const&, P const&) {}
};

}} // namespace detail::relate
#endif // DOXYGEN_NO_DETAIL

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_TOPOLOGY_CHECK_HPP
