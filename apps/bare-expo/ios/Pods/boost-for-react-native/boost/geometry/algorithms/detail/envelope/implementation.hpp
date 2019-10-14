// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2015 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2015 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2015.
// Modifications copyright (c) 2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_IMPLEMENTATION_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_IMPLEMENTATION_HPP

#include <boost/geometry/core/exterior_ring.hpp>
#include <boost/geometry/core/interior_rings.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/algorithms/is_empty.hpp>

#include <boost/geometry/algorithms/detail/envelope/box.hpp>
#include <boost/geometry/algorithms/detail/envelope/linear.hpp>
#include <boost/geometry/algorithms/detail/envelope/multipoint.hpp>
#include <boost/geometry/algorithms/detail/envelope/point.hpp>
#include <boost/geometry/algorithms/detail/envelope/range.hpp>
#include <boost/geometry/algorithms/detail/envelope/segment.hpp>

#include <boost/geometry/algorithms/dispatch/envelope.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace envelope
{


struct envelope_polygon
{
    template <typename Polygon, typename Box>
    static inline void apply(Polygon const& polygon, Box& mbr)
    {
        typename ring_return_type<Polygon const>::type ext_ring
            = exterior_ring(polygon);

        if (geometry::is_empty(ext_ring))
        {
            // if the exterior ring is empty, consider the interior rings
            envelope_multi_range
                <
                    envelope_range
                >::apply(interior_rings(polygon), mbr);
        }
        else
        {
            // otherwise, consider only the exterior ring
            envelope_range::apply(ext_ring, mbr);
        }
    }
};


}} // namespace detail::envelope
#endif // DOXYGEN_NO_DETAIL

#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename Ring>
struct envelope<Ring, ring_tag>
    : detail::envelope::envelope_range
{};


template <typename Polygon>
struct envelope<Polygon, polygon_tag>
    : detail::envelope::envelope_polygon
{};


template <typename MultiPolygon>
struct envelope<MultiPolygon, multi_polygon_tag>
    : detail::envelope::envelope_multi_range
        <
            detail::envelope::envelope_polygon
        >
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_IMPLEMENTATION_HPP
