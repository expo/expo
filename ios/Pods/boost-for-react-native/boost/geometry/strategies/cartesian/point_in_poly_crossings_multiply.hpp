// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_CARTESIAN_POINT_IN_POLY_CROSSINGS_MULTIPLY_HPP
#define BOOST_GEOMETRY_STRATEGIES_CARTESIAN_POINT_IN_POLY_CROSSINGS_MULTIPLY_HPP


#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/util/select_calculation_type.hpp>


namespace boost { namespace geometry
{

namespace strategy { namespace within
{

/*!
\brief Within detection using cross counting,
\ingroup strategies
\tparam Point \tparam_point
\tparam PointOfSegment \tparam_segment_point
\tparam CalculationType \tparam_calculation
\see http://tog.acm.org/resources/GraphicsGems/gemsiv/ptpoly_haines/ptinpoly.c
\note Does NOT work correctly for point ON border
\qbk{
[heading See also]
[link geometry.reference.algorithms.within.within_3_with_strategy within (with strategy)]
}
 */

template
<
    typename Point,
    typename PointOfSegment = Point,
    typename CalculationType = void
>
class crossings_multiply
{
    typedef typename select_calculation_type
        <
            Point,
            PointOfSegment,
            CalculationType
        >::type calculation_type;

    class flags
    {
        bool inside_flag;
        bool first;
        bool yflag0;

    public :

        friend class crossings_multiply;

        inline flags()
            : inside_flag(false)
            , first(true)
            , yflag0(false)
        {}
    };

public :

    typedef Point point_type;
    typedef PointOfSegment segment_point_type;
    typedef flags state_type;

    static inline bool apply(Point const& point,
            PointOfSegment const& seg1, PointOfSegment const& seg2,
            flags& state)
    {
        calculation_type const tx = get<0>(point);
        calculation_type const ty = get<1>(point);
        calculation_type const x0 = get<0>(seg1);
        calculation_type const y0 = get<1>(seg1);
        calculation_type const x1 = get<0>(seg2);
        calculation_type const y1 = get<1>(seg2);

        if (state.first)
        {
            state.first = false;
            state.yflag0 = y0 >= ty;
        }


        bool yflag1 = y1 >= ty;
        if (state.yflag0 != yflag1)
        {
            if ( ((y1-ty) * (x0-x1) >= (x1-tx) * (y0-y1)) == yflag1 )
            {
                state.inside_flag = ! state.inside_flag;
            }
        }
        state.yflag0 = yflag1;
        return true;
    }

    static inline int result(flags const& state)
    {
        return state.inside_flag ? 1 : -1;
    }
};



}} // namespace strategy::within


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGIES_CARTESIAN_POINT_IN_POLY_CROSSINGS_MULTIPLY_HPP
