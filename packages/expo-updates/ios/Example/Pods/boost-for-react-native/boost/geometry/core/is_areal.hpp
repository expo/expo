// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)


#ifndef BOOST_GEOMETRY_CORE_IS_AREAL_HPP
#define BOOST_GEOMETRY_CORE_IS_AREAL_HPP


#include <boost/type_traits/integral_constant.hpp>

#include <boost/geometry/core/tag.hpp>
#include <boost/geometry/core/tags.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DISPATCH
namespace core_dispatch
{

template <typename GeometryTag> struct is_areal : boost::false_type {};

template <> struct is_areal<ring_tag> : boost::true_type {};
template <> struct is_areal<box_tag> : boost::true_type {};
template <> struct is_areal<polygon_tag> : boost::true_type {};
template <> struct is_areal<multi_polygon_tag> : boost::true_type {};

} // namespace core_dispatch
#endif



/*!
    \brief Meta-function defining "true" for areal types (box, (multi)polygon, ring),
    \note Used for tag dispatching and meta-function finetuning
    \note Also a "ring" has areal properties within Boost.Geometry
    \ingroup core
*/
template <typename Geometry>
struct is_areal : core_dispatch::is_areal<typename tag<Geometry>::type>
{};


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_CORE_IS_AREAL_HPP
