// Boost.Geometry

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2015, 2016.
// Modifications copyright (c) 2015-2016 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_THOMAS_HPP
#define BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_THOMAS_HPP


#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/core/radian_access.hpp>

#include <boost/geometry/strategies/distance.hpp>

#include <boost/geometry/util/promote_floating_point.hpp>
#include <boost/geometry/util/select_calculation_type.hpp>

#include <boost/geometry/formulas/thomas_inverse.hpp>

namespace boost { namespace geometry
{

namespace strategy { namespace distance
{

/*!
\brief The solution of the inverse problem of geodesics on latlong coordinates,
       Forsyth-Andoyer-Lambert type approximation with second order terms.
\ingroup distance
\tparam Spheroid The reference spheroid model
\tparam CalculationType \tparam_calculation
\author See
    - Technical Report: PAUL D. THOMAS, MATHEMATICAL MODELS FOR NAVIGATION SYSTEMS, 1965
      http://www.dtic.mil/docs/citations/AD0627893
    - Technical Report: PAUL D. THOMAS, SPHEROIDAL GEODESICS, REFERENCE SYSTEMS, AND LOCAL GEOMETRY, 1970
      http://www.dtic.mil/docs/citations/AD703541
*/
template
<
    typename Spheroid,
    typename CalculationType = void
>
class thomas
{
public :
    template <typename Point1, typename Point2>
    struct calculation_type
        : promote_floating_point
          <
              typename select_calculation_type
                  <
                      Point1,
                      Point2,
                      CalculationType
                  >::type
          >
    {};

    typedef Spheroid model_type;

    inline thomas()
        : m_spheroid()
    {}

    explicit inline thomas(Spheroid const& spheroid)
        : m_spheroid(spheroid)
    {}

    template <typename Point1, typename Point2>
    inline typename calculation_type<Point1, Point2>::type
    apply(Point1 const& point1, Point2 const& point2) const
    {
        return geometry::formula::thomas_inverse
                <
                    typename calculation_type<Point1, Point2>::type,
                    true, false
                >::apply(get_as_radian<0>(point1),
                         get_as_radian<1>(point1),
                         get_as_radian<0>(point2),
                         get_as_radian<1>(point2),
                         m_spheroid).distance;
    }

    inline Spheroid const& model() const
    {
        return m_spheroid;
    }

private :
    Spheroid m_spheroid;
};

#ifndef DOXYGEN_NO_STRATEGY_SPECIALIZATIONS
namespace services
{

template <typename Spheroid, typename CalculationType>
struct tag<thomas<Spheroid, CalculationType> >
{
    typedef strategy_tag_distance_point_point type;
};


template <typename Spheroid, typename CalculationType, typename P1, typename P2>
struct return_type<thomas<Spheroid, CalculationType>, P1, P2>
    : thomas<Spheroid, CalculationType>::template calculation_type<P1, P2>
{};


template <typename Spheroid, typename CalculationType>
struct comparable_type<thomas<Spheroid, CalculationType> >
{
    typedef thomas<Spheroid, CalculationType> type;
};


template <typename Spheroid, typename CalculationType>
struct get_comparable<thomas<Spheroid, CalculationType> >
{
    static inline thomas<Spheroid, CalculationType> apply(thomas<Spheroid, CalculationType> const& input)
    {
        return input;
    }
};

template <typename Spheroid, typename CalculationType, typename P1, typename P2>
struct result_from_distance<thomas<Spheroid, CalculationType>, P1, P2 >
{
    template <typename T>
    static inline typename return_type<thomas<Spheroid, CalculationType>, P1, P2>::type
        apply(thomas<Spheroid, CalculationType> const& , T const& value)
    {
        return value;
    }
};


} // namespace services
#endif // DOXYGEN_NO_STRATEGY_SPECIALIZATIONS


}} // namespace strategy::distance


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_THOMAS_HPP
