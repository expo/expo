// Boost.Geometry

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2014, 2015, 2016.
// Modifications copyright (c) 2014-2016 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_SIDE_DETAIL_HPP
#define BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_SIDE_DETAIL_HPP

#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/radian_access.hpp>
#include <boost/geometry/core/radius.hpp>

#include <boost/geometry/util/math.hpp>
#include <boost/geometry/util/promote_floating_point.hpp>
#include <boost/geometry/util/select_calculation_type.hpp>

#include <boost/geometry/strategies/side.hpp>
//#include <boost/geometry/strategies/concepts/side_concept.hpp>


namespace boost { namespace geometry
{


namespace strategy { namespace side
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail
{

/*!
\brief Check at which side of a segment a point lies
         left of segment (> 0), right of segment (< 0), on segment (0)
\ingroup strategies
\tparam InverseFormula Geodesic inverse solution formula.
\tparam Model Reference model of coordinate system.
\tparam CalculationType \tparam_calculation
 */
template <template<typename, bool, bool, bool, bool, bool> class InverseFormula,
          typename Model,
          typename CalculationType = void>
class by_azimuth
{
public:
    by_azimuth(Model const& model = Model())
        : m_model(model)
    {}

    template <typename P1, typename P2, typename P>
    inline int apply(P1 const& p1, P2 const& p2, P const& p)
    {
        typedef typename promote_floating_point
            <
                typename select_calculation_type_alt
                    <
                        CalculationType,
                        P1, P2, P
                    >::type
            >::type calc_t;

        typedef InverseFormula<calc_t, false, true, false, false, false> inverse_formula;

        calc_t a1p = azimuth<calc_t, inverse_formula>(p1, p, m_model);
        calc_t a12 = azimuth<calc_t, inverse_formula>(p1, p2, m_model);

        calc_t const pi = math::pi<calc_t>();

        // instead of the formula from XTD
        //calc_t a_diff = asin(sin(a1p - a12));

        calc_t a_diff = a1p - a12;
        // normalize, angle in [-pi, pi]
        while ( a_diff > pi )
            a_diff -= calc_t(2) * pi;
        while ( a_diff < -pi )
            a_diff += calc_t(2) * pi;

        // NOTE: in general it shouldn't be required to support the pi/-pi case
        // because in non-cartesian systems it makes sense to check the side
        // only "between" the endpoints.
        // However currently the winding strategy calls the side strategy
        // for vertical segments to check if the point is "between the endpoints.
        // This could be avoided since the side strategy is not required for that
        // because meridian is the shortest path. So a difference of
        // longitudes would be sufficient (of course normalized to [-pi, pi]).

        // NOTE: with the above said, the pi/-pi check is temporary
        // however in case if this was required
        // the geodesics on ellipsoid aren't "symmetrical"
        // therefore instead of comparing a_diff to pi and -pi
        // one should probably use inverse azimuths and compare
        // the difference to 0 as well

        // positive azimuth is on the right side
        return math::equals(a_diff, 0)
            || math::equals(a_diff, pi)
            || math::equals(a_diff, -pi) ? 0
             : a_diff > 0 ? -1 // right
             : 1; // left
    }

private:
    template <typename ResultType,
              typename InverseFormulaType,
              typename Point1,
              typename Point2,
              typename ModelT>
    static inline ResultType azimuth(Point1 const& point1, Point2 const& point2, ModelT const& model)
    {
        return InverseFormulaType::apply(get_as_radian<0>(point1),
                                         get_as_radian<1>(point1),
                                         get_as_radian<0>(point2),
                                         get_as_radian<1>(point2),
                                         model).azimuth;
    }

    Model m_model;
};

} // detail
#endif // DOXYGEN_NO_DETAIL

}} // namespace strategy::side


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_SIDE_DETAIL_HPP
