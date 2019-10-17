// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)


#ifndef BOOST_GEOMETRY_CORE_EXTERIOR_RING_HPP
#define BOOST_GEOMETRY_CORE_EXTERIOR_RING_HPP


#include <boost/mpl/assert.hpp>
#include <boost/type_traits/is_const.hpp>
#include <boost/type_traits/remove_const.hpp>


#include <boost/geometry/core/ring_type.hpp>
#include <boost/geometry/core/tag.hpp>
#include <boost/geometry/core/tags.hpp>
#include <boost/geometry/util/add_const_if_c.hpp>


namespace boost { namespace geometry
{

namespace traits
{


/*!
    \brief Traits class defining access to exterior_ring of a polygon
    \details Should define const and non const access
    \ingroup traits
    \tparam Polygon the polygon type
    \par Geometries:
        - polygon
    \par Specializations should provide:
        - static inline RING& get(POLY& )
        - static inline RING const& get(POLY const& )
*/
template <typename Polygon>
struct exterior_ring
{
    BOOST_MPL_ASSERT_MSG
        (
            false, NOT_IMPLEMENTED_FOR_THIS_POLYGON_TYPE
            , (types<Polygon>)
        );
};


} // namespace traits


#ifndef DOXYGEN_NO_DISPATCH
namespace core_dispatch
{


template <typename Tag, typename Geometry>
struct exterior_ring
{
    BOOST_MPL_ASSERT_MSG
        (
            false, NOT_IMPLEMENTED_FOR_THIS_GEOMETRY_TYPE
            , (types<Geometry>)
        );
};


template <typename Polygon>
struct exterior_ring<polygon_tag, Polygon>
{
    static
    typename geometry::ring_return_type<Polygon>::type
        apply(typename add_const_if_c
            <
                boost::is_const<Polygon>::type::value,
                Polygon
            >::type& polygon)
    {
        return traits::exterior_ring
            <
                typename boost::remove_const<Polygon>::type
            >::get(polygon);
    }
};


} // namespace core_dispatch
#endif // DOXYGEN_NO_DISPATCH


/*!
    \brief Function to get the exterior_ring ring of a polygon
    \ingroup exterior_ring
    \note OGC compliance: instead of ExteriorRing
    \tparam Polygon polygon type
    \param polygon the polygon to get the exterior ring from
    \return a reference to the exterior ring
*/
template <typename Polygon>
inline typename ring_return_type<Polygon>::type exterior_ring(Polygon& polygon)
{
    return core_dispatch::exterior_ring
        <
            typename tag<Polygon>::type,
            Polygon
        >::apply(polygon);
}


/*!
\brief Function to get the exterior ring of a polygon (const version)
\ingroup exterior_ring
\note OGC compliance: instead of ExteriorRing
\tparam Polygon polygon type
\param polygon the polygon to get the exterior ring from
\return a const reference to the exterior ring

\qbk{distinguish,const version}
*/
template <typename Polygon>
inline typename ring_return_type<Polygon const>::type exterior_ring(
        Polygon const& polygon)
{
    return core_dispatch::exterior_ring
        <
            typename tag<Polygon>::type,
            Polygon const
        >::apply(polygon);
}


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_CORE_EXTERIOR_RING_HPP
