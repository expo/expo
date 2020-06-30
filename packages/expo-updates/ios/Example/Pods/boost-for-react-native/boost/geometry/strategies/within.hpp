// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_WITHIN_HPP
#define BOOST_GEOMETRY_STRATEGIES_WITHIN_HPP

#include <boost/mpl/assert.hpp>


namespace boost { namespace geometry
{

namespace strategy { namespace within
{


namespace services
{

/*!
\brief Traits class binding a within determination strategy to a coordinate system
\ingroup within
\tparam TagContained tag (possibly casted) of point-type
\tparam TagContained tag (possibly casted) of (possibly) containing type
\tparam CsTagContained tag of coordinate system of point-type
\tparam CsTagContaining tag of coordinate system of (possibly) containing type
\tparam Geometry geometry-type of input (often point, or box)
\tparam GeometryContaining geometry-type of input (possibly) containing type
*/
template
<
    typename TagContained,
    typename TagContaining,
    typename CastedTagContained,
    typename CastedTagContaining,
    typename CsTagContained,
    typename CsTagContaining,
    typename GeometryContained,
    typename GeometryContaining
>
struct default_strategy
{
    BOOST_MPL_ASSERT_MSG
        (
            false, NOT_IMPLEMENTED_FOR_THESE_TYPES
            , (types<GeometryContained, GeometryContaining>)
        );
};


} // namespace services


}} // namespace strategy::within


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGIES_WITHIN_HPP

