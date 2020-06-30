// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)


#ifndef BOOST_GEOMETRY_CORE_GEOMETRY_ID_HPP
#define BOOST_GEOMETRY_CORE_GEOMETRY_ID_HPP


#include <boost/mpl/assert.hpp>
#include <boost/mpl/int.hpp>

#include <boost/geometry/core/tag.hpp>
#include <boost/geometry/core/tags.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DISPATCH
namespace core_dispatch
{

template <typename GeometryTag>
struct geometry_id
{
    BOOST_MPL_ASSERT_MSG
        (
            false, NOT_IMPLEMENTED_FOR_THIS_GEOMETRY_TYPE
            , (types<GeometryTag>)
        );
};


template <>
struct geometry_id<point_tag>            : boost::mpl::int_<1> {};


template <>
struct geometry_id<linestring_tag>       : boost::mpl::int_<2> {};


template <>
struct geometry_id<polygon_tag>          : boost::mpl::int_<3> {};


template <>
struct geometry_id<multi_point_tag>      : boost::mpl::int_<4> {};


template <>
struct geometry_id<multi_linestring_tag> : boost::mpl::int_<5> {};


template <>
struct geometry_id<multi_polygon_tag>    : boost::mpl::int_<6> {};


template <>
struct geometry_id<segment_tag>          : boost::mpl::int_<92> {};


template <>
struct geometry_id<ring_tag>             : boost::mpl::int_<93> {};


template <>
struct geometry_id<box_tag>              : boost::mpl::int_<94> {};


} // namespace core_dispatch
#endif



/*!
\brief Meta-function returning the id of a geometry type
\details The meta-function geometry_id defines a numerical ID (based on
    boost::mpl::int_<...> ) for each geometry concept. A numerical ID is
    sometimes useful, and within Boost.Geometry it is used for the
    reverse_dispatch metafuntion.
\note Used for e.g. reverse meta-function
\ingroup core
*/
template <typename Geometry>
struct geometry_id : core_dispatch::geometry_id<typename tag<Geometry>::type>
{};


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_CORE_GEOMETRY_ID_HPP
