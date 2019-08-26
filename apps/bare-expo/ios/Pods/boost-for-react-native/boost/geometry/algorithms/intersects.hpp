// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2014 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2014 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2014 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2013-2014.
// Modifications copyright (c) 2013-2014, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_INTERSECTS_HPP
#define BOOST_GEOMETRY_ALGORITHMS_INTERSECTS_HPP


#include <deque>

#include <boost/geometry/geometries/concepts/check.hpp>
#include <boost/geometry/algorithms/detail/overlay/self_turn_points.hpp>
#include <boost/geometry/algorithms/disjoint.hpp>

#include <boost/geometry/policies/robustness/no_rescale_policy.hpp>
#include <boost/geometry/policies/robustness/segment_ratio_type.hpp>


namespace boost { namespace geometry
{

/*!
\brief \brief_check{has at least one intersection (crossing or self-tangency)}
\note This function can be called for one geometry (self-intersection) and
    also for two geometries (intersection)
\ingroup intersects
\tparam Geometry \tparam_geometry
\param geometry \param_geometry
\return \return_check{is self-intersecting}

\qbk{distinguish,one geometry}
\qbk{[def __one_parameter__]}
\qbk{[include reference/algorithms/intersects.qbk]}
*/
template <typename Geometry>
inline bool intersects(Geometry const& geometry)
{
    concepts::check<Geometry const>();

    typedef typename geometry::point_type<Geometry>::type point_type;
    typedef detail::no_rescale_policy rescale_policy_type;

    typedef detail::overlay::turn_info
        <
            point_type,
            typename segment_ratio_type<point_type, rescale_policy_type>::type
        > turn_info;

    std::deque<turn_info> turns;

    typedef detail::overlay::get_turn_info
        <
            detail::overlay::assign_null_policy
        > turn_policy;

    rescale_policy_type robust_policy;

    detail::disjoint::disjoint_interrupt_policy policy;
    detail::self_get_turn_points::get_turns
        <
            turn_policy
        >::apply(geometry, robust_policy, turns, policy);
    return policy.has_intersections;
}


/*!
\brief \brief_check2{have at least one intersection}
\ingroup intersects
\tparam Geometry1 \tparam_geometry
\tparam Geometry2 \tparam_geometry
\param geometry1 \param_geometry
\param geometry2 \param_geometry
\return \return_check2{intersect each other}

\qbk{distinguish,two geometries}
\qbk{[include reference/algorithms/intersects.qbk]}
 */
template <typename Geometry1, typename Geometry2>
inline bool intersects(Geometry1 const& geometry1, Geometry2 const& geometry2)
{
    concepts::check<Geometry1 const>();
    concepts::check<Geometry2 const>();

    return ! geometry::disjoint(geometry1, geometry2);
}



}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_INTERSECTS_HPP
