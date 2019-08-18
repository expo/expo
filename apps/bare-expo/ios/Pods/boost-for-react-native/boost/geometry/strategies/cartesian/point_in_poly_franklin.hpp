// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_CARTESIAN_POINT_IN_POLY_FRANKLIN_HPP
#define BOOST_GEOMETRY_STRATEGIES_CARTESIAN_POINT_IN_POLY_FRANKLIN_HPP


#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/util/select_calculation_type.hpp>


namespace boost { namespace geometry
{

namespace strategy { namespace within
{

/*!
\brief Within detection using cross counting
\ingroup strategies
\tparam Point \tparam_point
\tparam PointOfSegment \tparam_segment_point
\tparam CalculationType \tparam_calculation
\author adapted from Randolph Franklin algorithm
\author Barend and Maarten, 1995
\author Revised for templatized library, Barend Gehrels, 2007
\return true if point is in ring, works for closed rings in both directions
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
class franklin
{
    typedef typename select_calculation_type
        <
            Point,
            PointOfSegment,
            CalculationType
        >::type calculation_type;

        /*! subclass to keep state */
        class crossings
        {
            bool crosses;

        public :

            friend class franklin;
            inline crossings()
                : crosses(false)
            {}
        };

public :

    typedef Point point_type;
    typedef PointOfSegment segment_point_type;
    typedef crossings state_type;

    static inline bool apply(Point const& point,
            PointOfSegment const& seg1, PointOfSegment const& seg2,
            crossings& state)
    {
        calculation_type const& px = get<0>(point);
        calculation_type const& py = get<1>(point);
        calculation_type const& x1 = get<0>(seg1);
        calculation_type const& y1 = get<1>(seg1);
        calculation_type const& x2 = get<0>(seg2);
        calculation_type const& y2 = get<1>(seg2);

        if (
            ( (y2 <= py && py < y1) || (y1 <= py && py < y2) )
            && (px < (x1 - x2) * (py - y2) / (y1 - y2) + x2)
            )
        {
            state.crosses = ! state.crosses;
        }
        return true;
    }

    static inline int result(crossings const& state)
    {
        return state.crosses ? 1 : -1;
    }
};



}} // namespace strategy::within





}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGIES_CARTESIAN_POINT_IN_POLY_FRANKLIN_HPP
