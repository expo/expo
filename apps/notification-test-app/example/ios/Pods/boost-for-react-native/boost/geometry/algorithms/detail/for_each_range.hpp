// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_FOR_EACH_RANGE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_FOR_EACH_RANGE_HPP


#include <boost/mpl/assert.hpp>
#include <boost/concept/requires.hpp>
#include <boost/range.hpp>
#include <boost/type_traits/is_const.hpp>
#include <boost/type_traits/remove_const.hpp>

#include <boost/geometry/core/tag.hpp>
#include <boost/geometry/core/tag_cast.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/util/add_const_if_c.hpp>
#include <boost/geometry/views/box_view.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace for_each
{


template <typename Range, typename Actor>
struct fe_range_range
{
    static inline void apply(Range & range, Actor & actor)
    {
        actor.apply(range);
    }
};


template <typename Polygon, typename Actor>
struct fe_range_polygon
{
    static inline void apply(Polygon & polygon, Actor & actor)
    {
        actor.apply(exterior_ring(polygon));

        // TODO: If some flag says true, also do the inner rings.
        // for convex hull, it's not necessary
    }
};

template <typename Box, typename Actor>
struct fe_range_box
{
    static inline void apply(Box & box, Actor & actor)
    {
        actor.apply(box_view<typename boost::remove_const<Box>::type>(box));
    }
};

template <typename Multi, typename Actor, typename SinglePolicy>
struct fe_range_multi
{
    static inline void apply(Multi & multi, Actor & actor)
    {
        for ( typename boost::range_iterator<Multi>::type
                it = boost::begin(multi); it != boost::end(multi); ++it)
        {
            SinglePolicy::apply(*it, actor);
        }
    }
};

}} // namespace detail::for_each
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template
<
    typename Geometry,
    typename Actor,
    typename Tag = typename tag<Geometry>::type
>
struct for_each_range
{
    BOOST_MPL_ASSERT_MSG
        (
            false, NOT_OR_NOT_YET_IMPLEMENTED_FOR_THIS_GEOMETRY_TYPE
            , (types<Geometry>)
        );
};


template <typename Linestring, typename Actor>
struct for_each_range<Linestring, Actor, linestring_tag>
    : detail::for_each::fe_range_range<Linestring, Actor>
{};


template <typename Ring, typename Actor>
struct for_each_range<Ring, Actor, ring_tag>
    : detail::for_each::fe_range_range<Ring, Actor>
{};


template <typename Polygon, typename Actor>
struct for_each_range<Polygon, Actor, polygon_tag>
    : detail::for_each::fe_range_polygon<Polygon, Actor>
{};


template <typename Box, typename Actor>
struct for_each_range<Box, Actor, box_tag>
    : detail::for_each::fe_range_box<Box, Actor>
{};


template <typename MultiPoint, typename Actor>
struct for_each_range<MultiPoint, Actor, multi_point_tag>
    : detail::for_each::fe_range_range<MultiPoint, Actor>
{};


template <typename Geometry, typename Actor>
struct for_each_range<Geometry, Actor, multi_linestring_tag>
    : detail::for_each::fe_range_multi
        <
            Geometry,
            Actor,
            detail::for_each::fe_range_range
                <
                    typename add_const_if_c
                        <
                            boost::is_const<Geometry>::value,
                            typename boost::range_value<Geometry>::type
                        >::type,
                    Actor
                >
        >
{};


template <typename Geometry, typename Actor>
struct for_each_range<Geometry, Actor, multi_polygon_tag>
    : detail::for_each::fe_range_multi
        <
            Geometry,
            Actor,
            detail::for_each::fe_range_polygon
                <
                    typename add_const_if_c
                        <
                            boost::is_const<Geometry>::value,
                            typename boost::range_value<Geometry>::type
                        >::type,
                    Actor
                >
        >
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

namespace detail
{

template <typename Geometry, typename Actor>
inline void for_each_range(Geometry const& geometry, Actor & actor)
{
    dispatch::for_each_range
        <
            Geometry const,
            Actor
        >::apply(geometry, actor);
}


}


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_FOR_EACH_RANGE_HPP
