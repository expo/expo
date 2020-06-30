// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2014-2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_IS_SIMPLE_AREAL_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_IS_SIMPLE_AREAL_HPP

#include <boost/range.hpp>

#include <boost/geometry/core/closure.hpp>
#include <boost/geometry/core/exterior_ring.hpp>
#include <boost/geometry/core/interior_rings.hpp>
#include <boost/geometry/core/ring_type.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/algorithms/detail/check_iterator_range.hpp>
#include <boost/geometry/algorithms/detail/is_simple/failure_policy.hpp>
#include <boost/geometry/algorithms/detail/is_valid/has_duplicates.hpp>

#include <boost/geometry/algorithms/dispatch/is_simple.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace is_simple
{


template <typename Ring>
struct is_simple_ring
{
    static inline bool apply(Ring const& ring)
    {
        simplicity_failure_policy policy;
        return ! boost::empty(ring)
            && ! detail::is_valid::has_duplicates
                    <
                        Ring, geometry::closure<Ring>::value
                    >::apply(ring, policy);
    }
};


template <typename Polygon>
class is_simple_polygon
{
private:
    template <typename InteriorRings>
    static inline
    bool are_simple_interior_rings(InteriorRings const& interior_rings)
    {
        return
            detail::check_iterator_range
                <
                    is_simple_ring
                        <
                            typename boost::range_value<InteriorRings>::type
                        >
                >::apply(boost::begin(interior_rings),
                         boost::end(interior_rings));
    }

public:
    static inline bool apply(Polygon const& polygon)
    {
        return
            is_simple_ring
                <
                    typename ring_type<Polygon>::type
                >::apply(exterior_ring(polygon))
            &&
            are_simple_interior_rings(geometry::interior_rings(polygon));
    }
};


}} // namespace detail::is_simple
#endif // DOXYGEN_NO_DETAIL




#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


// A Ring is a Polygon.
// A Polygon is always a simple geometric object provided that it is valid.
//
// Reference (for polygon validity): OGC 06-103r4 (6.1.11.1)
template <typename Ring>
struct is_simple<Ring, ring_tag>
    : detail::is_simple::is_simple_ring<Ring>
{};


// A Polygon is always a simple geometric object provided that it is valid.
//
// Reference (for validity of Polygons): OGC 06-103r4 (6.1.11.1)
template <typename Polygon>
struct is_simple<Polygon, polygon_tag>
    : detail::is_simple::is_simple_polygon<Polygon>
{};


// Not clear what the definition is.
// Right now we consider a MultiPolygon as simple if it is valid.
//
// Reference (for validity of MultiPolygons): OGC 06-103r4 (6.1.14)
template <typename MultiPolygon>
struct is_simple<MultiPolygon, multi_polygon_tag>
{
    static inline bool apply(MultiPolygon const& multipolygon)
    {
        return
            detail::check_iterator_range
                <
                    detail::is_simple::is_simple_polygon
                        <
                            typename boost::range_value<MultiPolygon>::type
                        >,
                    true // allow empty multi-polygon
                >::apply(boost::begin(multipolygon), boost::end(multipolygon));
    }
};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_IS_SIMPLE_AREAL_HPP
