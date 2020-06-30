// Boost.Geometry

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2014, 2015, 2016.
// Modifications copyright (c) 2014-2016 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_SIDE_THOMAS_HPP
#define BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_SIDE_THOMAS_HPP


#include <boost/geometry/formulas/thomas_inverse.hpp>

#include <boost/geometry/strategies/geographic/side_detail.hpp>


namespace boost { namespace geometry
{


namespace strategy { namespace side
{

/*!
\brief Check at which side of a segment a point lies
         left of segment (> 0), right of segment (< 0), on segment (0)
\ingroup strategies
\tparam Model Reference model of coordinate system.
\tparam CalculationType \tparam_calculation
 */
template <typename Model, typename CalculationType = void>
class thomas
    : public detail::by_azimuth<geometry::formula::thomas_inverse, Model, CalculationType>
{
    typedef detail::by_azimuth<geometry::formula::thomas_inverse, Model, CalculationType> base_t;

public:
    thomas(Model const& model = Model())
        : base_t(model)
    {}
};

}} // namespace strategy::side


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_SIDE_THOMAS_HPP
