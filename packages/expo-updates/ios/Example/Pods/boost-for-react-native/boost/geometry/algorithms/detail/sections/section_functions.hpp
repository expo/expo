// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2015.
// Modifications copyright (c) 2015, Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_SECTIONS_FUNCTIONS_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_SECTIONS_FUNCTIONS_HPP


#include <boost/geometry/core/access.hpp>
#include <boost/geometry/algorithms/detail/recalculate.hpp>
#include <boost/geometry/policies/robustness/robust_point_type.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace section
{

template
<
    std::size_t Dimension,
    typename Point,
    typename RobustBox,
    typename RobustPolicy
>
static inline bool preceding(int dir, Point const& point,
            RobustBox const& robust_box,
            RobustPolicy const& robust_policy)
{
    typename geometry::robust_point_type<Point, RobustPolicy>::type robust_point;
    geometry::recalculate(robust_point, point, robust_policy);
    return (dir == 1  && get<Dimension>(robust_point) < get<min_corner, Dimension>(robust_box))
        || (dir == -1 && get<Dimension>(robust_point) > get<max_corner, Dimension>(robust_box));
}

template
<
    std::size_t Dimension,
    typename Point,
    typename RobustBox,
    typename RobustPolicy
>
static inline bool exceeding(int dir, Point const& point,
            RobustBox const& robust_box,
            RobustPolicy const& robust_policy)
{
    typename geometry::robust_point_type<Point, RobustPolicy>::type robust_point;
    geometry::recalculate(robust_point, point, robust_policy);
    return (dir == 1  && get<Dimension>(robust_point) > get<max_corner, Dimension>(robust_box))
        || (dir == -1 && get<Dimension>(robust_point) < get<min_corner, Dimension>(robust_box));
}


}} // namespace detail::section
#endif


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_SECTIONS_FUNCTIONS_HPP
