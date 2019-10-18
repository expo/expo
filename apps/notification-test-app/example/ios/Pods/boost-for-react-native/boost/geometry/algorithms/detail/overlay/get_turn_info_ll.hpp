// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2013, 2014, 2015.
// Modifications copyright (c) 2013-2015 Oracle and/or its affiliates.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_TURN_INFO_LL_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_TURN_INFO_LL_HPP

#include <boost/geometry/core/assert.hpp>

#include <boost/geometry/algorithms/detail/overlay/get_turn_info.hpp>
#include <boost/geometry/algorithms/detail/overlay/get_turn_info_for_endpoint.hpp>

#include <boost/geometry/util/condition.hpp>

namespace boost { namespace geometry {

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace overlay {

template<typename AssignPolicy>
struct get_turn_info_linear_linear
{
    static const bool handle_spikes = true;

    template
    <
        typename Point1,
        typename Point2,
        typename TurnInfo,
        typename RobustPolicy,
        typename OutputIterator
    >
    static inline OutputIterator apply(
                Point1 const& pi, Point1 const& pj, Point1 const& pk,
                Point2 const& qi, Point2 const& qj, Point2 const& qk,
                bool is_p_first, bool is_p_last,
                bool is_q_first, bool is_q_last,
                TurnInfo const& tp_model,
                RobustPolicy const& robust_policy,
                OutputIterator out)
    {
        typedef intersection_info<Point1, Point2, typename TurnInfo::point_type, RobustPolicy>
            inters_info;

        inters_info inters(pi, pj, pk, qi, qj, qk, robust_policy);

        char const method = inters.d_info().how;

        // Copy, to copy possibly extended fields
        TurnInfo tp = tp_model;

        // Select method and apply
        switch(method)
        {
            case 'a' : // collinear, "at"
            case 'f' : // collinear, "from"
            case 's' : // starts from the middle
                get_turn_info_for_endpoint<AssignPolicy, true, true>
                    ::apply(pi, pj, pk, qi, qj, qk,
                            is_p_first, is_p_last, is_q_first, is_q_last,
                            tp_model, inters, method_none, out);
                break;

            case 'd' : // disjoint: never do anything
                break;

            case 'm' :
            {
                if ( get_turn_info_for_endpoint<AssignPolicy, false, true>
                        ::apply(pi, pj, pk, qi, qj, qk,
                                is_p_first, is_p_last, is_q_first, is_q_last,
                                tp_model, inters, method_touch_interior, out) )
                {
                    // do nothing
                }
                else
                {
                    typedef touch_interior
                        <
                            TurnInfo
                        > policy;

                    // If Q (1) arrives (1)
                    if ( inters.d_info().arrival[1] == 1)
                    {
                        policy::template apply<0>(pi, pj, pk, qi, qj, qk,
                                                  tp, inters.i_info(), inters.d_info(),
                                                  inters.sides());
                    }
                    else
                    {
                        // Swap p/q
                        side_calculator
                            <
                                typename inters_info::cs_tag,
                                typename inters_info::robust_point2_type,
                                typename inters_info::robust_point1_type
                            > swapped_side_calc(inters.rqi(), inters.rqj(), inters.rqk(),
                                                inters.rpi(), inters.rpj(), inters.rpk());

                        policy::template apply<1>(qi, qj, qk, pi, pj, pk,
                                                  tp, inters.i_info(), inters.d_info(),
                                                  swapped_side_calc);
                    }
                    
                    if ( tp.operations[0].operation == operation_blocked )
                    {
                        tp.operations[1].is_collinear = true;
                    }
                    if ( tp.operations[1].operation == operation_blocked )
                    {
                        tp.operations[0].is_collinear = true;
                    }

                    replace_method_and_operations_tm(tp.method,
                                                     tp.operations[0].operation,
                                                     tp.operations[1].operation);
                    
                    AssignPolicy::apply(tp, pi, qi, inters);
                    *out++ = tp;
                }
            }
            break;
            case 'i' :
            {
                crosses<TurnInfo>::apply(pi, pj, pk, qi, qj, qk,
                                         tp, inters.i_info(), inters.d_info());

                replace_operations_i(tp.operations[0].operation, tp.operations[1].operation);

                AssignPolicy::apply(tp, pi, qi, inters);
                *out++ = tp;
            }
            break;
            case 't' :
            {
                // Both touch (both arrive there)
                if ( get_turn_info_for_endpoint<AssignPolicy, false, true>
                        ::apply(pi, pj, pk, qi, qj, qk,
                                is_p_first, is_p_last, is_q_first, is_q_last,
                                tp_model, inters, method_touch, out) )
                {
                    // do nothing
                }
                else 
                {
                    touch<TurnInfo>::apply(pi, pj, pk, qi, qj, qk,
                                           tp, inters.i_info(), inters.d_info(), inters.sides());

                    // workarounds for touch<> not taking spikes into account starts here
                    // those was discovered empirically
                    // touch<> is not symmetrical!
                    // P spikes and Q spikes may produce various operations!
                    // TODO: this is not optimal solution - think about rewriting touch<>

                    if ( tp.operations[0].operation == operation_blocked
                      && tp.operations[1].operation == operation_blocked )
                    {
                        // two touching spikes on the same line
                        if ( inters.is_spike_p() && inters.is_spike_q() )
                        {
                            tp.operations[0].operation = operation_union;
                            tp.operations[1].operation = operation_union; 
                        }
                        else
                        {
                            tp.operations[0].is_collinear = true;
                            tp.operations[1].is_collinear = true;
                        }
                    }
                    else if ( tp.operations[0].operation == operation_blocked )
                    {
                        // a spike on P on the same line with Q1
                        if ( inters.is_spike_p() )
                        {
                            if ( inters.sides().qk_wrt_p1() == 0 )
                            {
                                tp.operations[0].is_collinear = true;
                            }
                            else
                            {
                                tp.operations[0].operation = operation_union;                                
                            }
                        }
                        else
                        {
                            tp.operations[1].is_collinear = true;
                        }
                    }
                    else if ( tp.operations[1].operation == operation_blocked )
                    {
                        // a spike on Q on the same line with P1
                        if ( inters.is_spike_q() )
                        {
                            if ( inters.sides().pk_wrt_q1() == 0 )
                            {
                                tp.operations[1].is_collinear = true;
                            }
                            else
                            {
                                tp.operations[1].operation = operation_union;                                
                            }
                        }
                        else
                        {
                            tp.operations[0].is_collinear = true;
                        }
                    }
                    else if ( tp.operations[0].operation == operation_continue
                           && tp.operations[1].operation == operation_continue )
                    {
                        // P spike on the same line with Q2 (opposite)
                        if ( inters.sides().pk_wrt_q1() == -inters.sides().qk_wrt_q1()
                          && inters.is_spike_p() )
                        {
                            tp.operations[0].operation = operation_union;
                            tp.operations[1].operation = operation_union; 
                        }
                    }
                    else if ( tp.operations[0].operation == operation_none
                           && tp.operations[1].operation == operation_none )
                    {
                        // spike not handled by touch<>
                        bool const is_p = inters.is_spike_p();
                        bool const is_q = inters.is_spike_q();

                        if ( is_p || is_q )
                        {
                            tp.operations[0].operation = operation_union;
                            tp.operations[1].operation = operation_union;

                            if ( inters.sides().pk_wrt_q2() == 0 )
                            {
                                tp.operations[0].operation = operation_continue; // will be converted to i
                                if ( is_p )
                                {
                                    tp.operations[0].is_collinear = true;
                                }
                            }

                            if ( inters.sides().qk_wrt_p2() == 0 )
                            {
                                tp.operations[1].operation = operation_continue; // will be converted to i
                                if ( is_q )
                                {
                                    tp.operations[1].is_collinear = true;
                                }
                            }
                        }
                    }

                    // workarounds for touch<> not taking spikes into account ends here

                    replace_method_and_operations_tm(tp.method,
                                                     tp.operations[0].operation,
                                                     tp.operations[1].operation);

// TODO: move this into the append_xxx and call for each turn?
                    AssignPolicy::apply(tp, pi, qi, inters);

                    if ( ! BOOST_GEOMETRY_CONDITION(handle_spikes)
                      || ! append_opposite_spikes<append_touches>(tp, inters,
                                                                  is_p_last, is_q_last,
                                                                  out) )
                    {
                        *out++ = tp;
                    }
                }
            }
            break;
            case 'e':
            {
                if ( get_turn_info_for_endpoint<AssignPolicy, true, true>
                        ::apply(pi, pj, pk, qi, qj, qk,
                                is_p_first, is_p_last, is_q_first, is_q_last,
                                tp_model, inters, method_equal, out) )
                {
                    // do nothing
                }
                else
                {
                    tp.operations[0].is_collinear = true;
                    tp.operations[1].is_collinear = true;

                    if ( ! inters.d_info().opposite )
                    {
                        // Both equal
                        // or collinear-and-ending at intersection point
                        equal<TurnInfo>::apply(pi, pj, pk, qi, qj, qk,
                            tp, inters.i_info(), inters.d_info(), inters.sides());

                        operation_type spike_op
                            = ( tp.operations[0].operation != operation_continue
                             || tp.operations[1].operation != operation_continue ) ?
                                operation_union :
                                operation_continue;

                        // transform turn
                        turn_transformer_ec transformer(method_touch);
                        transformer(tp);

// TODO: move this into the append_xxx and call for each turn?
                        AssignPolicy::apply(tp, pi, qi, inters);

                        // conditionally handle spikes
                        if ( ! BOOST_GEOMETRY_CONDITION(handle_spikes)
                          || ! append_collinear_spikes(tp, inters,
                                                       is_p_last, is_q_last,
                                                       method_touch, spike_op,
                                                       out) )
                        {
                            *out++ = tp; // no spikes
                        }
                    }
                    else
                    {
                        // TODO: ignore for spikes or generate something else than opposite?

                        equal_opposite
                            <
                                TurnInfo,
                                AssignPolicy
                            >::apply(pi, qi, tp, out, inters);
                    }
                }
            }
            break;
            case 'c' :
            {
                // Collinear
                if ( get_turn_info_for_endpoint<AssignPolicy, true, true>
                        ::apply(pi, pj, pk, qi, qj, qk,
                                is_p_first, is_p_last, is_q_first, is_q_last,
                                tp_model, inters, method_collinear, out) )
                {
                    // do nothing
                }
                else
                {
                    // NOTE: this is for spikes since those are set in the turn_transformer_ec
                    tp.operations[0].is_collinear = true;
                    tp.operations[1].is_collinear = true;

                    if ( ! inters.d_info().opposite )
                    {
                        method_type method_replace = method_touch_interior;
                        operation_type spike_op = operation_continue;

                        if ( inters.d_info().arrival[0] == 0 )
                        {
                            // Collinear, but similar thus handled as equal
                            equal<TurnInfo>::apply(pi, pj, pk, qi, qj, qk,
                                    tp, inters.i_info(), inters.d_info(), inters.sides());

                            method_replace = method_touch;
                            if ( tp.operations[0].operation != operation_continue
                              || tp.operations[1].operation != operation_continue )
                            {
                                spike_op = operation_union;
                            }
                        }
                        else
                        {
                            collinear<TurnInfo>::apply(pi, pj, pk, qi, qj, qk,
                                    tp, inters.i_info(), inters.d_info(), inters.sides());

                            //method_replace = method_touch_interior;
                            //spike_op = operation_continue;
                        }

                        // transform turn
                        turn_transformer_ec transformer(method_replace);
                        transformer(tp);
                        
// TODO: move this into the append_xxx and call for each turn?
                        AssignPolicy::apply(tp, pi, qi, inters);

                        // conditionally handle spikes
                        if ( ! BOOST_GEOMETRY_CONDITION(handle_spikes)
                          || ! append_collinear_spikes(tp, inters,
                                                       is_p_last, is_q_last,
                                                       method_replace, spike_op,
                                                       out) )
                        {
                            // no spikes
                            *out++ = tp;
                        }
                    }
                    else
                    {
                        // If this always 'm' ?
                        turn_transformer_ec transformer(method_touch_interior);

                        // conditionally handle spikes
                        if ( BOOST_GEOMETRY_CONDITION(handle_spikes) )
                        {
                            append_opposite_spikes<append_collinear_opposite>(tp, inters,
                                                                              is_p_last, is_q_last,
                                                                              out);
                        }

                        // TODO: ignore for spikes?
                        //       E.g. pass is_p_valid = !is_p_last && !is_pj_spike,
                        //       the same with is_q_valid

                        collinear_opposite
                            <
                                TurnInfo,
                                AssignPolicy
                            >::apply(pi, pj, pk, qi, qj, qk,
                                tp, out, inters, inters.sides(),
                                transformer, !is_p_last, !is_q_last);
                    }
                }
            }
            break;
            case '0' :
            {
                // degenerate points
                if ( BOOST_GEOMETRY_CONDITION(AssignPolicy::include_degenerate) )
                {
                    only_convert::apply(tp, inters.i_info());

                    // if any, only one of those should be true
                    if ( is_p_first
                      && equals::equals_point_point(pi, tp.point) )
                    {
                        tp.operations[0].position = position_front;
                    }
                    else if ( is_p_last
                           && equals::equals_point_point(pj, tp.point) )
                    {
                        tp.operations[0].position = position_back;
                    }
                    else if ( is_q_first
                           && equals::equals_point_point(qi, tp.point) )
                    {
                        tp.operations[1].position = position_front;
                    }
                    else if ( is_q_last
                           && equals::equals_point_point(qj, tp.point) )
                    {
                        tp.operations[1].position = position_back;
                    }

                    AssignPolicy::apply(tp, pi, qi, inters);
                    *out++ = tp;
                }
            }
            break;
            default :
            {
#if defined(BOOST_GEOMETRY_DEBUG_ROBUSTNESS)
                std::cout << "TURN: Unknown method: " << method << std::endl;
#endif
#if ! defined(BOOST_GEOMETRY_OVERLAY_NO_THROW)
                throw turn_info_exception(method);
#endif
            }
            break;
        }

        return out;
    }

    template <typename TurnInfo,
              typename IntersectionInfo,
              typename OutIt>
    static inline bool append_collinear_spikes(TurnInfo & tp,
                                               IntersectionInfo const& inters_info,
                                               bool is_p_last, bool is_q_last,
                                               method_type method, operation_type spike_op,
                                               OutIt out)
    {
        // method == touch || touch_interior
        // both position == middle

        bool is_p_spike = tp.operations[0].operation == spike_op
                       && ! is_p_last
                       && inters_info.is_spike_p();
        bool is_q_spike = tp.operations[1].operation == spike_op
                       && ! is_q_last
                       && inters_info.is_spike_q();

        if ( is_p_spike && is_q_spike )
        {
            if ( tp.method == method_equal
              && tp.operations[0].operation == operation_continue
              && tp.operations[1].operation == operation_continue )
            {
                // treat both non-opposite collinear spikes as no-spikes
                return false;
            }

            tp.method = method;
            tp.operations[0].operation = operation_blocked;
            tp.operations[1].operation = operation_blocked;
            *out++ = tp;
            tp.operations[0].operation = operation_intersection;
            tp.operations[1].operation = operation_intersection;
            *out++ = tp;

            return true;
        }
        else if ( is_p_spike )
        {
            tp.method = method;
            tp.operations[0].operation = operation_blocked;
            tp.operations[1].operation = operation_union;
            *out++ = tp;
            tp.operations[0].operation = operation_intersection;
            //tp.operations[1].operation = operation_union;
            *out++ = tp;

            return true;
        }
        else if ( is_q_spike )
        {
            tp.method = method;
            tp.operations[0].operation = operation_union;
            tp.operations[1].operation = operation_blocked;
            *out++ = tp;
            //tp.operations[0].operation = operation_union;
            tp.operations[1].operation = operation_intersection;
            *out++ = tp;

            return true;
        }
        
        return false;
    }

    enum append_version { append_touches, append_collinear_opposite };

    template <append_version Version,
              typename TurnInfo,
              typename IntersectionInfo,
              typename OutIt>
    static inline bool append_opposite_spikes(TurnInfo & tp,
                                              IntersectionInfo const& inters,
                                              bool is_p_last, bool is_q_last,
                                              OutIt out)
    {
        static const bool is_version_touches = (Version == append_touches);

        bool is_p_spike = ( is_version_touches ?
                            ( tp.operations[0].operation == operation_continue
                           || tp.operations[0].operation == operation_intersection ) :
                            true )
                       && ! is_p_last
                       && inters.is_spike_p();
        bool is_q_spike = ( is_version_touches ?
                            ( tp.operations[1].operation == operation_continue
                           || tp.operations[1].operation == operation_intersection ) :
                            true )
                       && ! is_q_last
                       && inters.is_spike_q();

        bool res = false;

        if ( is_p_spike
          && ( BOOST_GEOMETRY_CONDITION(is_version_touches)
            || inters.d_info().arrival[0] == 1 ) )
        {
            if ( BOOST_GEOMETRY_CONDITION(is_version_touches) )
            {
                tp.operations[0].is_collinear = true;
                tp.operations[1].is_collinear = false;
                tp.method = method_touch;
            }
            else // Version == append_collinear_opposite
            {
                tp.operations[0].is_collinear = true;
                tp.operations[1].is_collinear = false;
                
                BOOST_GEOMETRY_ASSERT(inters.i_info().count > 1);
                
                base_turn_handler::assign_point(tp, method_touch_interior,
                                                inters.i_info(), 1);

                AssignPolicy::apply(tp, inters.pi(), inters.qi(), inters);
            }

            tp.operations[0].operation = operation_blocked;
            tp.operations[1].operation = operation_intersection;
            *out++ = tp;
            tp.operations[0].operation = operation_intersection;
            //tp.operations[1].operation = operation_intersection;
            *out++ = tp;

            res = true;
        }

        if ( is_q_spike
          && ( BOOST_GEOMETRY_CONDITION(is_version_touches)
            || inters.d_info().arrival[1] == 1 ) )
        {
            if ( BOOST_GEOMETRY_CONDITION(is_version_touches) )
            {
                tp.operations[0].is_collinear = false;
                tp.operations[1].is_collinear = true;
                tp.method = method_touch;
            }
            else // Version == append_collinear_opposite
            {
                tp.operations[0].is_collinear = false;
                tp.operations[1].is_collinear = true;
                
                BOOST_GEOMETRY_ASSERT(inters.i_info().count > 0);

                base_turn_handler::assign_point(tp, method_touch_interior, inters.i_info(), 0);

                AssignPolicy::apply(tp, inters.pi(), inters.qi(), inters);
            }

            tp.operations[0].operation = operation_intersection;
            tp.operations[1].operation = operation_blocked;
            *out++ = tp;
            //tp.operations[0].operation = operation_intersection;
            tp.operations[1].operation = operation_intersection;
            *out++ = tp;

            res = true;
        }
        
        return res;
    }

    static inline void replace_method_and_operations_tm(method_type & method,
                                                        operation_type & op0,
                                                        operation_type & op1)
    {
        if ( op0 == operation_blocked && op1 == operation_blocked )
        {
            // NOTE: probably only if methods are WRT IPs, not segments!
            method = (method == method_touch ? method_equal : method_collinear);
            op0 = operation_continue;
            op1 = operation_continue;
        }
        else
        {
            if ( op0 == operation_continue || op0 == operation_blocked )
            {
                op0 = operation_intersection;
            }
            else if ( op0 == operation_intersection )
            {
                op0 = operation_union;
            }

            if ( op1 == operation_continue || op1 == operation_blocked )
            {
                op1 = operation_intersection;
            }
            else if ( op1 == operation_intersection )
            {
                op1 = operation_union;
            }

            // spikes in 'm'
            if ( method == method_error )
            {
                method = method_touch_interior;
                op0 = operation_union;
                op1 = operation_union;
            }
        }
    }

    class turn_transformer_ec
    {
    public:
        explicit turn_transformer_ec(method_type method_t_or_m)
            : m_method(method_t_or_m)
        {}

        template <typename Turn>
        void operator()(Turn & turn) const
        {
            operation_type & op0 = turn.operations[0].operation;
            operation_type & op1 = turn.operations[1].operation;

            BOOST_GEOMETRY_ASSERT(op0 != operation_blocked || op1 != operation_blocked );

            if ( op0 == operation_blocked )
            {
                op0 = operation_intersection;
            }
            else if ( op0 == operation_intersection )
            {
                op0 = operation_union;
            }

            if ( op1 == operation_blocked )
            {
                op1 = operation_intersection;
            }
            else if ( op1 == operation_intersection )
            {
                op1 = operation_union;
            }

            if ( op0 == operation_intersection || op0 == operation_union
              || op1 == operation_intersection || op1 == operation_union )
            {
                turn.method = m_method;
            }

// TODO: is this correct?
//       it's equivalent to comparing to operation_blocked at the beginning of the function
            turn.operations[0].is_collinear = op0 != operation_intersection;
            turn.operations[1].is_collinear = op1 != operation_intersection;
        }

    private:
        method_type m_method;
    };

    static inline void replace_operations_i(operation_type & op0, operation_type & op1)
    {
        if ( op0 == operation_intersection )
        {
            op0 = operation_union;
        }

        if ( op1 == operation_intersection )
        {
            op1 = operation_union;
        }
    }
};

}} // namespace detail::overlay
#endif // DOXYGEN_NO_DETAIL

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_TURN_INFO_LL_HPP
