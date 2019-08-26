// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_IS_CONVEX_HPP
#define BOOST_GEOMETRY_ALGORITHMS_IS_CONVEX_HPP


#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/closure.hpp>
#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/point_type.hpp>
#include <boost/geometry/algorithms/detail/equals/point_point.hpp>
#include <boost/geometry/iterators/ever_circling_iterator.hpp>
#include <boost/geometry/strategies/side.hpp>
#include <boost/geometry/strategies/cartesian/side_by_triangle.hpp>
#include <boost/geometry/views/detail/normalized_view.hpp>

namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace is_convex
{

struct ring_is_convex
{
    template <typename Ring>
    static inline bool apply(Ring const& ring)
    {
        typedef typename geometry::point_type<Ring>::type point_type;
        typedef typename strategy::side::services::default_strategy
        <
            typename cs_tag<point_type>::type
        >::type side_strategy_type;

        std::size_t n = boost::size(ring);
        if (boost::size(ring) < core_detail::closure::minimum_ring_size
                                    <
                                        geometry::closure<Ring>::value
                                    >::value)
        {
            // (Too) small rings are considered as non-concave, is convex
            return true;
        }

        // Walk in clockwise direction, consider ring as closed
        // (though closure is not important in this algorithm - any dupped
        //  point is skipped)
        typedef detail::normalized_view<Ring const> view_type;
        view_type view(ring);

        typedef geometry::ever_circling_range_iterator<view_type const> it_type;
        it_type previous(view);
        it_type current(view);
        current++;

        std::size_t index = 1;
        while (equals::equals_point_point(*current, *previous) && index < n)
        {
            current++;
            index++;
        }

        if (index == n)
        {
            // All points are apparently equal
            return true;
        }

        it_type next = current;
        next++;
        while (equals::equals_point_point(*current, *next))
        {
            next++;
        }

        // We have now three different points on the ring
        // Walk through all points, use a counter because of the ever-circling
        // iterator
        for (std::size_t i = 0; i < n; i++)
        {
            int const side = side_strategy_type::apply(*previous, *current, *next);
            if (side == 1)
            {
                // Next is on the left side of clockwise ring:
                // the piece is not convex
                return false;
            }

            previous = current;
            current = next;

            // Advance next to next different point
            // (because there are non-equal points, this loop is not infinite)
            next++;
            while (equals::equals_point_point(*current, *next))
            {
                next++;
            }
        }
        return true;
    }
};


}} // namespace detail::is_convex
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

template
<
    typename Geometry,
    typename Tag = typename tag<Geometry>::type
>
struct is_convex : not_implemented<Tag>
{};

template <typename Box>
struct is_convex<Box, box_tag>
{
    static inline bool apply(Box const& )
    {
        // Any box is convex (TODO: consider spherical boxes)
        return true;
    }
};

template <typename Box>
struct is_convex<Box, ring_tag> : detail::is_convex::ring_is_convex
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

// TODO: variants

// TODO: documentation / qbk
template<typename Geometry>
inline bool is_convex(Geometry const& geometry)
{
    return dispatch::is_convex<Geometry>::apply(geometry);
}


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_IS_CONVEX_HPP
