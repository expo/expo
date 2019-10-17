// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2013, 2014, 2015.
// Modifications copyright (c) 2013-2015 Oracle and/or its affiliates.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_TURN_INFO_HELPERS_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_TURN_INFO_HELPERS_HPP

#include <boost/geometry/policies/robustness/no_rescale_policy.hpp>

namespace boost { namespace geometry {

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace overlay {

enum turn_position { position_middle, position_front, position_back };

template <typename Point, typename SegmentRatio>
struct turn_operation_linear
    : public turn_operation<Point, SegmentRatio>
{
    turn_operation_linear()
        : position(position_middle)
        , is_collinear(false)
    {}

    turn_position position;
    bool is_collinear; // valid only for Linear geometry
};

template <typename TurnPointCSTag, typename PointP, typename PointQ,
          typename Pi = PointP, typename Pj = PointP, typename Pk = PointP,
          typename Qi = PointQ, typename Qj = PointQ, typename Qk = PointQ
>
struct side_calculator
{
    // This strategy should be the same as side strategy defined in
    // intersection_strategies<> which is used in various places
    // of the library
    typedef typename strategy::side::services::default_strategy
        <
            TurnPointCSTag
        >::type side;

    inline side_calculator(Pi const& pi, Pj const& pj, Pk const& pk,
                           Qi const& qi, Qj const& qj, Qk const& qk)
        : m_pi(pi), m_pj(pj), m_pk(pk)
        , m_qi(qi), m_qj(qj), m_qk(qk)
    {}

    inline int pk_wrt_p1() const { return side::apply(m_pi, m_pj, m_pk); }
    inline int pk_wrt_q1() const { return side::apply(m_qi, m_qj, m_pk); }
    inline int qk_wrt_p1() const { return side::apply(m_pi, m_pj, m_qk); }
    inline int qk_wrt_q1() const { return side::apply(m_qi, m_qj, m_qk); }

    inline int pk_wrt_q2() const { return side::apply(m_qj, m_qk, m_pk); }
    inline int qk_wrt_p2() const { return side::apply(m_pj, m_pk, m_qk); }

    Pi const& m_pi;
    Pj const& m_pj;
    Pk const& m_pk;
    Qi const& m_qi;
    Qj const& m_qj;
    Qk const& m_qk;
};

template <typename Point1, typename Point2, typename RobustPolicy>
struct robust_points
{
    typedef typename geometry::robust_point_type
        <
            Point1, RobustPolicy
        >::type robust_point1_type;

    // TODO: define robust_point2_type using Point2?
    typedef robust_point1_type robust_point2_type;

    inline robust_points(Point1 const& pi, Point1 const& pj, Point1 const& pk,
                         Point2 const& qi, Point2 const& qj, Point2 const& qk,
                         RobustPolicy const& robust_policy)
    {
        geometry::recalculate(m_rpi, pi, robust_policy);
        geometry::recalculate(m_rpj, pj, robust_policy);
        geometry::recalculate(m_rpk, pk, robust_policy);
        geometry::recalculate(m_rqi, qi, robust_policy);
        geometry::recalculate(m_rqj, qj, robust_policy);
        geometry::recalculate(m_rqk, qk, robust_policy);
    }

    robust_point1_type m_rpi, m_rpj, m_rpk;
    robust_point2_type m_rqi, m_rqj, m_rqk;
};

template <typename Point1, typename Point2, typename TurnPoint, typename RobustPolicy>
class intersection_info_base
    : private robust_points<Point1, Point2, RobustPolicy>
{
    typedef robust_points<Point1, Point2, RobustPolicy> base;

public:
    typedef Point1 point1_type;
    typedef Point2 point2_type;

    typedef typename base::robust_point1_type robust_point1_type;
    typedef typename base::robust_point2_type robust_point2_type;

    typedef typename cs_tag<TurnPoint>::type cs_tag;

    typedef side_calculator<cs_tag, robust_point1_type, robust_point2_type> side_calculator_type;
    
    intersection_info_base(Point1 const& pi, Point1 const& pj, Point1 const& pk,
                           Point2 const& qi, Point2 const& qj, Point2 const& qk,
                           RobustPolicy const& robust_policy)
        : base(pi, pj, pk, qi, qj, qk, robust_policy)
        , m_side_calc(base::m_rpi, base::m_rpj, base::m_rpk,
                      base::m_rqi, base::m_rqj, base::m_rqk)
        , m_pi(pi), m_pj(pj), m_pk(pk)
        , m_qi(qi), m_qj(qj), m_qk(qk)
    {}

    inline Point1 const& pi() const { return m_pi; }
    inline Point1 const& pj() const { return m_pj; }
    inline Point1 const& pk() const { return m_pk; }

    inline Point2 const& qi() const { return m_qi; }
    inline Point2 const& qj() const { return m_qj; }
    inline Point2 const& qk() const { return m_qk; }

    inline robust_point1_type const& rpi() const { return base::m_rpi; }
    inline robust_point1_type const& rpj() const { return base::m_rpj; }
    inline robust_point1_type const& rpk() const { return base::m_rpk; }

    inline robust_point2_type const& rqi() const { return base::m_rqi; }
    inline robust_point2_type const& rqj() const { return base::m_rqj; }
    inline robust_point2_type const& rqk() const { return base::m_rqk; }

    inline side_calculator_type const& sides() const { return m_side_calc; }
    
private:
    side_calculator_type m_side_calc;

    point1_type const& m_pi;
    point1_type const& m_pj;
    point1_type const& m_pk;
    point2_type const& m_qi;
    point2_type const& m_qj;
    point2_type const& m_qk;
};

template <typename Point1, typename Point2, typename TurnPoint>
class intersection_info_base<Point1, Point2, TurnPoint, detail::no_rescale_policy>
{
public:
    typedef Point1 point1_type;
    typedef Point2 point2_type;

    typedef Point1 robust_point1_type;
    typedef Point2 robust_point2_type;

    typedef typename cs_tag<TurnPoint>::type cs_tag;

    typedef side_calculator<cs_tag, Point1, Point2> side_calculator_type;
    
    intersection_info_base(Point1 const& pi, Point1 const& pj, Point1 const& pk,
                           Point2 const& qi, Point2 const& qj, Point2 const& qk,
                           no_rescale_policy const& /*robust_policy*/)
        : m_side_calc(pi, pj, pk, qi, qj, qk)
    {}

    inline Point1 const& pi() const { return m_side_calc.m_pi; }
    inline Point1 const& pj() const { return m_side_calc.m_pj; }
    inline Point1 const& pk() const { return m_side_calc.m_pk; }

    inline Point2 const& qi() const { return m_side_calc.m_qi; }
    inline Point2 const& qj() const { return m_side_calc.m_qj; }
    inline Point2 const& qk() const { return m_side_calc.m_qk; }

    inline Point1 const& rpi() const { return pi(); }
    inline Point1 const& rpj() const { return pj(); }
    inline Point1 const& rpk() const { return pk(); }

    inline Point2 const& rqi() const { return qi(); }
    inline Point2 const& rqj() const { return qj(); }
    inline Point2 const& rqk() const { return qk(); }

    inline side_calculator_type const& sides() const { return m_side_calc; }
    
private:
    side_calculator_type m_side_calc;
};


template
<
    typename Point1,
    typename Point2,
    typename TurnPoint,
    typename RobustPolicy
>
class intersection_info
    : public intersection_info_base<Point1, Point2, TurnPoint, RobustPolicy>
{
    typedef intersection_info_base<Point1, Point2, TurnPoint, RobustPolicy> base;

    typedef typename intersection_strategies
        <
            typename base::cs_tag,
            Point1,
            Point2,
            TurnPoint,
            RobustPolicy
        >::segment_intersection_strategy_type strategy;

public:
    typedef model::referring_segment<Point1 const> segment_type1;
    typedef model::referring_segment<Point2 const> segment_type2;
    typedef typename base::side_calculator_type side_calculator_type;
    
    typedef typename strategy::return_type result_type;
    typedef typename boost::tuples::element<0, result_type>::type i_info_type; // intersection_info
    typedef typename boost::tuples::element<1, result_type>::type d_info_type; // dir_info

    intersection_info(Point1 const& pi, Point1 const& pj, Point1 const& pk,
                      Point2 const& qi, Point2 const& qj, Point2 const& qk,
                      RobustPolicy const& robust_policy)
        : base(pi, pj, pk, qi, qj, qk, robust_policy)
        , m_result(strategy::apply(segment_type1(pi, pj),
                                   segment_type2(qi, qj),
                                   robust_policy,
                                   base::rpi(), base::rpj(),
                                   base::rqi(), base::rqj()))
        , m_robust_policy(robust_policy)
    {}

    inline result_type const& result() const { return m_result; }
    inline i_info_type const& i_info() const { return m_result.template get<0>(); }
    inline d_info_type const& d_info() const { return m_result.template get<1>(); }

    // TODO: it's more like is_spike_ip_p
    inline bool is_spike_p() const
    {
        if (base::sides().pk_wrt_p1() == 0)
        {
            if (! is_ip_j<0>())
            {
                return false;
            }

            int const qk_p1 = base::sides().qk_wrt_p1();
            int const qk_p2 = base::sides().qk_wrt_p2();
                
            if (qk_p1 == -qk_p2)
            {
                if (qk_p1 == 0)
                {
                    return is_spike_of_collinear(base::pi(), base::pj(),
                                                 base::pk());
                }
                        
                return true;
            }
        }
        
        return false;
    }

    // TODO: it's more like is_spike_ip_q
    inline bool is_spike_q() const
    {
        if (base::sides().qk_wrt_q1() == 0)
        {
            if (! is_ip_j<1>())
            {
                return false;
            }

            int const pk_q1 = base::sides().pk_wrt_q1();
            int const pk_q2 = base::sides().pk_wrt_q2();
                
            if (pk_q1 == -pk_q2)
            {
                if (pk_q1 == 0)
                {
                    return is_spike_of_collinear(base::qi(), base::qj(),
                                                 base::qk());
                }
                        
                return true;
            }
        }
        
        return false;
    }

private:
    template <typename Point>
    inline bool is_spike_of_collinear(Point const& i, Point const& j,
                                      Point const& k) const
    {
        typedef model::referring_segment<Point const> seg;

        typedef intersection_strategies
            <
                typename base::cs_tag, Point, Point, Point, RobustPolicy
            > si;
        
        typedef typename si::segment_intersection_strategy_type strategy;
        
        typename strategy::return_type result
            = strategy::apply(seg(i, j), seg(j, k), m_robust_policy);
        
        return result.template get<0>().count == 2;
    }

    template <std::size_t OpId>
    bool is_ip_j() const
    {
        int arrival = d_info().arrival[OpId];
        bool same_dirs = d_info().dir_a == 0 && d_info().dir_b == 0;

        if (same_dirs)
        {
            if (i_info().count == 2)
            {
                return arrival != -1;
            }
            else
            {
                return arrival == 0;
            }
        }
        else
        {
            return arrival == 1;
        }
    }

    result_type m_result;
    RobustPolicy const& m_robust_policy;
};

}} // namespace detail::overlay
#endif // DOXYGEN_NO_DETAIL

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_TURN_INFO_HELPERS_HPP
