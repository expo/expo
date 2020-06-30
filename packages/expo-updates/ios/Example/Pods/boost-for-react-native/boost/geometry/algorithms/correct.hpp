// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.
// Copyright (c) 2014 Adam Wulkiewicz, Lodz, Poland.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_CORRECT_HPP
#define BOOST_GEOMETRY_ALGORITHMS_CORRECT_HPP


#include <algorithm>
#include <cstddef>
#include <functional>

#include <boost/mpl/assert.hpp>
#include <boost/range.hpp>
#include <boost/type_traits/remove_reference.hpp>

#include <boost/variant/apply_visitor.hpp>
#include <boost/variant/static_visitor.hpp>
#include <boost/variant/variant_fwd.hpp>

#include <boost/geometry/algorithms/detail/interior_iterator.hpp>

#include <boost/geometry/core/closure.hpp>
#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/exterior_ring.hpp>
#include <boost/geometry/core/interior_rings.hpp>
#include <boost/geometry/core/mutable_range.hpp>
#include <boost/geometry/core/ring_type.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/geometries/concepts/check.hpp>

#include <boost/geometry/algorithms/area.hpp>
#include <boost/geometry/algorithms/disjoint.hpp>
#include <boost/geometry/algorithms/detail/multi_modify.hpp>
#include <boost/geometry/util/order_as_direction.hpp>

namespace boost { namespace geometry
{

// Silence warning C4127: conditional expression is constant
#if defined(_MSC_VER)
#pragma warning(push)
#pragma warning(disable : 4127)
#endif

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace correct
{

template <typename Geometry>
struct correct_nop
{
    static inline void apply(Geometry& )
    {}
};


template <typename Box, std::size_t Dimension, std::size_t DimensionCount>
struct correct_box_loop
{
    typedef typename coordinate_type<Box>::type coordinate_type;

    static inline void apply(Box& box)
    {
        if (get<min_corner, Dimension>(box) > get<max_corner, Dimension>(box))
        {
            // Swap the coordinates
            coordinate_type max_value = get<min_corner, Dimension>(box);
            coordinate_type min_value = get<max_corner, Dimension>(box);
            set<min_corner, Dimension>(box, min_value);
            set<max_corner, Dimension>(box, max_value);
        }

        correct_box_loop
            <
                Box, Dimension + 1, DimensionCount
            >::apply(box);
    }
};



template <typename Box, std::size_t DimensionCount>
struct correct_box_loop<Box, DimensionCount, DimensionCount>
{
    static inline void apply(Box& )
    {}

};


// Correct a box: make min/max correct
template <typename Box>
struct correct_box
{

    static inline void apply(Box& box)
    {
        // Currently only for Cartesian coordinates
        // (or spherical without crossing dateline)
        // Future version: adapt using strategies
        correct_box_loop
            <
                Box, 0, dimension<Box>::type::value
            >::apply(box);
    }
};


// Close a ring, if not closed
template <typename Ring, typename Predicate>
struct correct_ring
{
    typedef typename point_type<Ring>::type point_type;
    typedef typename coordinate_type<Ring>::type coordinate_type;

    typedef typename strategy::area::services::default_strategy
        <
            typename cs_tag<point_type>::type,
            point_type
        >::type strategy_type;

    typedef detail::area::ring_area
            <
                order_as_direction<geometry::point_order<Ring>::value>::value,
                geometry::closure<Ring>::value
            > ring_area_type;


    static inline void apply(Ring& r)
    {
        // Check close-ness
        if (boost::size(r) > 2)
        {
            // check if closed, if not, close it
            bool const disjoint = geometry::disjoint(*boost::begin(r), *(boost::end(r) - 1));
            closure_selector const s = geometry::closure<Ring>::value;

            if (disjoint && (s == closed))
            {
                geometry::append(r, *boost::begin(r));
            }
            if (! disjoint && s != closed)
            {
                // Open it by removing last point
                geometry::traits::resize<Ring>::apply(r, boost::size(r) - 1);
            }
        }
        // Check area
        Predicate predicate;
        typedef typename default_area_result<Ring>::type area_result_type;
        area_result_type const zero = area_result_type();
        if (predicate(ring_area_type::apply(r, strategy_type()), zero))
        {
            std::reverse(boost::begin(r), boost::end(r));
        }
    }
};

// Correct a polygon: normalizes all rings, sets outer ring clockwise, sets all
// inner rings counter clockwise (or vice versa depending on orientation)
template <typename Polygon>
struct correct_polygon
{
    typedef typename ring_type<Polygon>::type ring_type;
    typedef typename default_area_result<Polygon>::type area_result_type;

    static inline void apply(Polygon& poly)
    {
        correct_ring
            <
                ring_type,
                std::less<area_result_type>
            >::apply(exterior_ring(poly));

        typename interior_return_type<Polygon>::type
            rings = interior_rings(poly);
        for (typename detail::interior_iterator<Polygon>::type
                it = boost::begin(rings); it != boost::end(rings); ++it)
        {
            correct_ring
                <
                    ring_type,
                    std::greater<area_result_type>
                >::apply(*it);
        }
    }
};


}} // namespace detail::correct
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

template <typename Geometry, typename Tag = typename tag<Geometry>::type>
struct correct: not_implemented<Tag>
{};

template <typename Point>
struct correct<Point, point_tag>
    : detail::correct::correct_nop<Point>
{};

template <typename LineString>
struct correct<LineString, linestring_tag>
    : detail::correct::correct_nop<LineString>
{};

template <typename Segment>
struct correct<Segment, segment_tag>
    : detail::correct::correct_nop<Segment>
{};


template <typename Box>
struct correct<Box, box_tag>
    : detail::correct::correct_box<Box>
{};

template <typename Ring>
struct correct<Ring, ring_tag>
    : detail::correct::correct_ring
        <
            Ring,
            std::less<typename default_area_result<Ring>::type>
        >
{};

template <typename Polygon>
struct correct<Polygon, polygon_tag>
    : detail::correct::correct_polygon<Polygon>
{};


template <typename MultiPoint>
struct correct<MultiPoint, multi_point_tag>
    : detail::correct::correct_nop<MultiPoint>
{};


template <typename MultiLineString>
struct correct<MultiLineString, multi_linestring_tag>
    : detail::correct::correct_nop<MultiLineString>
{};


template <typename Geometry>
struct correct<Geometry, multi_polygon_tag>
    : detail::multi_modify
        <
            Geometry,
            detail::correct::correct_polygon
                <
                    typename boost::range_value<Geometry>::type
                >
        >
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


namespace resolve_variant {

template <typename Geometry>
struct correct
{
    static inline void apply(Geometry& geometry)
    {
        concepts::check<Geometry const>();
        dispatch::correct<Geometry>::apply(geometry);
    }
};

template <BOOST_VARIANT_ENUM_PARAMS(typename T)>
struct correct<boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)> >
{
    struct visitor: boost::static_visitor<void>
    {
        template <typename Geometry>
        void operator()(Geometry& geometry) const
        {
            correct<Geometry>::apply(geometry);
        }
    };

    static inline void
    apply(boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)>& geometry)
    {
        boost::apply_visitor(visitor(), geometry);
    }
};

} // namespace resolve_variant


/*!
\brief Corrects a geometry
\details Corrects a geometry: all rings which are wrongly oriented with respect
    to their expected orientation are reversed. To all rings which do not have a
    closing point and are typed as they should have one, the first point is
    appended. Also boxes can be corrected.
\ingroup correct
\tparam Geometry \tparam_geometry
\param geometry \param_geometry which will be corrected if necessary

\qbk{[include reference/algorithms/correct.qbk]}
*/
template <typename Geometry>
inline void correct(Geometry& geometry)
{
    resolve_variant::correct<Geometry>::apply(geometry);
}

#if defined(_MSC_VER)
#pragma warning(pop)
#endif

}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_CORRECT_HPP
