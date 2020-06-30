// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2014 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2014 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2014 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2014.
// Modifications copyright (c) 2014, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle
// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_APPEND_HPP
#define BOOST_GEOMETRY_ALGORITHMS_APPEND_HPP


#include <boost/range.hpp>

#include <boost/variant/apply_visitor.hpp>
#include <boost/variant/static_visitor.hpp>
#include <boost/variant/variant_fwd.hpp>

#include <boost/geometry/algorithms/num_interior_rings.hpp>
#include <boost/geometry/algorithms/detail/convert_point_to_point.hpp>
#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/mutable_range.hpp>
#include <boost/geometry/core/point_type.hpp>
#include <boost/geometry/core/tags.hpp>
#include <boost/geometry/geometries/concepts/check.hpp>
#include <boost/geometry/geometries/variant.hpp>
#include <boost/geometry/util/range.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace append
{

template <typename Geometry, typename Point>
struct append_no_action
{
    static inline void apply(Geometry& , Point const& ,
                int = 0, int = 0)
    {
    }
};

template <typename Geometry, typename Point>
struct append_point
{
    static inline void apply(Geometry& geometry, Point const& point,
                int = 0, int = 0)
    {
        typename geometry::point_type<Geometry>::type copy;
        geometry::detail::conversion::convert_point_to_point(point, copy);
        traits::push_back<Geometry>::apply(geometry, copy);
    }
};


template <typename Geometry, typename Range>
struct append_range
{
    typedef typename boost::range_value<Range>::type point_type;

    static inline void apply(Geometry& geometry, Range const& range,
                int = 0, int = 0)
    {
        for (typename boost::range_iterator<Range const>::type
            it = boost::begin(range);
             it != boost::end(range);
             ++it)
        {
            append_point<Geometry, point_type>::apply(geometry, *it);
        }
    }
};


template <typename Polygon, typename Point>
struct point_to_polygon
{
    typedef typename ring_type<Polygon>::type ring_type;

    static inline void apply(Polygon& polygon, Point const& point,
                int ring_index, int = 0)
    {
        if (ring_index == -1)
        {
            append_point<ring_type, Point>::apply(
                        exterior_ring(polygon), point);
        }
        else if (ring_index < int(num_interior_rings(polygon)))
        {
            append_point<ring_type, Point>::apply(
                        range::at(interior_rings(polygon), ring_index), point);
        }
    }
};


template <typename Polygon, typename Range>
struct range_to_polygon
{
    typedef typename ring_type<Polygon>::type ring_type;

    static inline void apply(Polygon& polygon, Range const& range,
                int ring_index, int = 0)
    {
        if (ring_index == -1)
        {
            append_range<ring_type, Range>::apply(
                        exterior_ring(polygon), range);
        }
        else if (ring_index < int(num_interior_rings(polygon)))
        {
            append_range<ring_type, Range>::apply(
                        range::at(interior_rings(polygon), ring_index), range);
        }
    }
};


}} // namespace detail::append
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

namespace splitted_dispatch
{

template <typename Tag, typename Geometry, typename Point>
struct append_point
    : detail::append::append_no_action<Geometry, Point>
{};

template <typename Geometry, typename Point>
struct append_point<linestring_tag, Geometry, Point>
    : detail::append::append_point<Geometry, Point>
{};

template <typename Geometry, typename Point>
struct append_point<ring_tag, Geometry, Point>
    : detail::append::append_point<Geometry, Point>
{};


template <typename Polygon, typename Point>
struct append_point<polygon_tag, Polygon, Point>
        : detail::append::point_to_polygon<Polygon, Point>
{};


template <typename Tag, typename Geometry, typename Range>
struct append_range
    : detail::append::append_no_action<Geometry, Range>
{};

template <typename Geometry, typename Range>
struct append_range<linestring_tag, Geometry, Range>
    : detail::append::append_range<Geometry, Range>
{};

template <typename Geometry, typename Range>
struct append_range<ring_tag, Geometry, Range>
    : detail::append::append_range<Geometry, Range>
{};


template <typename Polygon, typename Range>
struct append_range<polygon_tag, Polygon, Range>
        : detail::append::range_to_polygon<Polygon, Range>
{};

} // namespace splitted_dispatch


// Default: append a range (or linestring or ring or whatever) to any geometry
template
<
    typename Geometry, typename RangeOrPoint,
    typename TagRangeOrPoint = typename tag<RangeOrPoint>::type
>
struct append
    : splitted_dispatch::append_range<typename tag<Geometry>::type, Geometry, RangeOrPoint>
{};

// Specialization for point to append a point to any geometry
template <typename Geometry, typename RangeOrPoint>
struct append<Geometry, RangeOrPoint, point_tag>
    : splitted_dispatch::append_point<typename tag<Geometry>::type, Geometry, RangeOrPoint>
{};

} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace append
{

template <typename MultiGeometry, typename RangeOrPoint>
struct append_to_multigeometry
{
    static inline void apply(MultiGeometry& multigeometry,
                             RangeOrPoint const& range_or_point,
                             int ring_index, int multi_index)
    {

        dispatch::append
            <
                typename boost::range_value<MultiGeometry>::type,
                RangeOrPoint
            >::apply(range::at(multigeometry, multi_index), range_or_point, ring_index);
    }
};

}} // namespace detail::append
#endif // DOXYGEN_NO_DETAIL

#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

namespace splitted_dispatch
{

template <typename Geometry, typename Point>
struct append_point<multi_point_tag, Geometry, Point>
    : detail::append::append_point<Geometry, Point>
{};

template <typename Geometry, typename Range>
struct append_range<multi_point_tag, Geometry, Range>
    : detail::append::append_range<Geometry, Range>
{};

template <typename MultiGeometry, typename RangeOrPoint>
struct append_point<multi_linestring_tag, MultiGeometry, RangeOrPoint>
    : detail::append::append_to_multigeometry<MultiGeometry, RangeOrPoint>
{};

template <typename MultiGeometry, typename RangeOrPoint>
struct append_range<multi_linestring_tag, MultiGeometry, RangeOrPoint>
    : detail::append::append_to_multigeometry<MultiGeometry, RangeOrPoint>
{};

template <typename MultiGeometry, typename RangeOrPoint>
struct append_point<multi_polygon_tag, MultiGeometry, RangeOrPoint>
    : detail::append::append_to_multigeometry<MultiGeometry, RangeOrPoint>
{};

template <typename MultiGeometry, typename RangeOrPoint>
struct append_range<multi_polygon_tag, MultiGeometry, RangeOrPoint>
    : detail::append::append_to_multigeometry<MultiGeometry, RangeOrPoint>
{};

} // namespace splitted_dispatch

} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


namespace resolve_variant {

template <typename Geometry>
struct append
{
    template <typename RangeOrPoint>
    static inline void apply(Geometry& geometry,
                             RangeOrPoint const& range_or_point,
                             int ring_index,
                             int multi_index)
    {
        concepts::check<Geometry>();
        dispatch::append<Geometry, RangeOrPoint>::apply(geometry,
                                                        range_or_point,
                                                        ring_index,
                                                        multi_index);
    }
};


template <BOOST_VARIANT_ENUM_PARAMS(typename T)>
struct append<boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)> >
{
    template <typename RangeOrPoint>
    struct visitor: boost::static_visitor<void>
    {
        RangeOrPoint const& m_range_or_point;
        int m_ring_index;
        int m_multi_index;

        visitor(RangeOrPoint const& range_or_point,
                int ring_index,
                int multi_index):
            m_range_or_point(range_or_point),
            m_ring_index(ring_index),
            m_multi_index(multi_index)
        {}

        template <typename Geometry>
        void operator()(Geometry& geometry) const
        {
            append<Geometry>::apply(geometry,
                                    m_range_or_point,
                                    m_ring_index,
                                    m_multi_index);
        }
    };

    template <typename RangeOrPoint>
    static inline void apply(boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)>& variant_geometry,
                             RangeOrPoint const& range_or_point,
                             int ring_index,
                             int multi_index)
    {
        boost::apply_visitor(
            visitor<RangeOrPoint>(
                range_or_point,
                ring_index,
                multi_index
            ),
            variant_geometry
        );
    }
};

} // namespace resolve_variant;


/*!
\brief Appends one or more points to a linestring, ring, polygon, multi-geometry
\ingroup append
\tparam Geometry \tparam_geometry
\tparam RangeOrPoint Either a range or a point, fullfilling Boost.Range concept or Boost.Geometry Point Concept
\param geometry \param_geometry
\param range_or_point The point or range to add
\param ring_index The index of the ring in case of a polygon:
    exterior ring (-1, the default) or  interior ring index
\param multi_index The index of the geometry to which the points are appended

\qbk{[include reference/algorithms/append.qbk]}
}
 */
template <typename Geometry, typename RangeOrPoint>
inline void append(Geometry& geometry, RangeOrPoint const& range_or_point,
                   int ring_index = -1, int multi_index = 0)
{
    resolve_variant::append<Geometry>
                   ::apply(geometry, range_or_point, ring_index, multi_index);
}


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_APPEND_HPP
