// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)


#ifndef BOOST_GEOMETRY_CORE_REVERSE_DISPATCH_HPP
#define BOOST_GEOMETRY_CORE_REVERSE_DISPATCH_HPP


#include <cstddef>

#include <boost/mpl/if.hpp>
#include <boost/type_traits/integral_constant.hpp>

#include <boost/geometry/core/geometry_id.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail
{

// Different geometries: reverse_dispatch if second ID < first ID
template <std::size_t GeometryId1, std::size_t GeometryId2>
struct reverse_dispatch : boost::mpl::if_c
    <
        (GeometryId1 > GeometryId2),
        boost::true_type,
        boost::false_type
    >
{};


// Same geometry: never reverse_dispatch
template <std::size_t GeometryId>
struct reverse_dispatch<GeometryId, GeometryId> : boost::false_type {};


} // namespace detail
#endif // DOXYGEN_NO_DETAIL


template <typename Geometry1, typename Geometry2>
struct reverse_dispatch : detail::reverse_dispatch
    <
        geometry_id<Geometry1>::type::value,
        geometry_id<Geometry2>::type::value
    >
{};


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_CORE_REVERSE_DISPATCH_HPP
