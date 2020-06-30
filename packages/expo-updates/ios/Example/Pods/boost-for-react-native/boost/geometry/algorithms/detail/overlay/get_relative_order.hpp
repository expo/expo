// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_RELATIVE_ORDER_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_RELATIVE_ORDER_HPP


#include <boost/geometry/strategies/intersection_strategies.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace overlay
{


/*!
    \brief Get relative order
    \details Can indicate which of two segments R and S,
        both crossing a common segment P, comes first.
        If the two segments cross P very close (e.g. in a spike),
        the distance between the intersection points can be zero,
        but we still need to know which comes first.
        Therefore, it is useful that using sides we are able to discover this.
 */
template <typename Point1>
struct get_relative_order
{
    typedef typename strategy::side::services::default_strategy
        <
            typename cs_tag<Point1>::type
        >::type strategy;

    template <typename Point>
    static inline int value_via_product(Point const& ti, Point const& tj,
                    Point const& ui, Point const& uj, int factor)
    {
        int const side_ti_u = strategy::apply(ti, tj, ui);
        int const side_tj_u = strategy::apply(ti, tj, uj);

#ifdef BOOST_GEOMETRY_DEBUG_RELATIVE_ORDER
        std::cout << (factor == 1  ? " r//s " :  " s//r ")
            << side_ti_u << " / " << side_tj_u;
#endif

        return side_ti_u * side_tj_u >= 0
            ? factor * (side_ti_u != 0 ? side_ti_u : side_tj_u)
            : 0;
    }


    static inline int apply(
                Point1 const& pi, Point1 const& pj,
                Point1 const& ri, Point1 const& rj,
                Point1 const& si, Point1 const& sj)
    {
        int const side_ri_p = strategy::apply(pi, pj, ri);
        int const side_si_p = strategy::apply(pi, pj, si);

#ifdef BOOST_GEOMETRY_DEBUG_RELATIVE_ORDER
        int const side_rj_p = strategy::apply(pi, pj, rj);
        int const side_sj_p = strategy::apply(pi, pj, sj);
        std::cout << "r//p: " << side_ri_p << " / " << side_rj_p;
        std::cout << " s//p: " << side_si_p << " / " << side_sj_p;
#endif

        int value = value_via_product(si, sj, ri, rj, 1);
        if (value == 0)
        {
            value = value_via_product(ri, rj, si, sj, -1);
        }

        int const order = side_ri_p * side_ri_p * side_si_p * value;

#ifdef BOOST_GEOMETRY_DEBUG_RELATIVE_ORDER
        std::cout
            << " o: " << order
            << std::endl << std::endl;
#endif

        return order;
    }
};


}} // namespace detail::overlay
#endif //DOXYGEN_NO_DETAIL


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_RELATIVE_ORDER_HPP
