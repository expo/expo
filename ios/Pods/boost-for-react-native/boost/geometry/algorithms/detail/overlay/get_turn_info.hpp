// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2015.
// Modifications copyright (c) 2015 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_TURN_INFO_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_TURN_INFO_HPP


#include <boost/core/ignore_unused.hpp>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/assert.hpp>
#include <boost/geometry/strategies/intersection_strategies.hpp>

#include <boost/geometry/algorithms/convert.hpp>
#include <boost/geometry/algorithms/detail/overlay/turn_info.hpp>
#include <boost/geometry/algorithms/detail/recalculate.hpp>

#include <boost/geometry/geometries/segment.hpp>

#include <boost/geometry/policies/robustness/robust_point_type.hpp>
#include <boost/geometry/algorithms/detail/overlay/get_turn_info_helpers.hpp>

// Silence warning C4127: conditional expression is constant
#if defined(_MSC_VER)
#pragma warning(push)
#pragma warning(disable : 4127)
#endif


namespace boost { namespace geometry
{

#if ! defined(BOOST_GEOMETRY_OVERLAY_NO_THROW)
class turn_info_exception : public geometry::exception
{
    std::string message;
public:

    // NOTE: "char" will be replaced by enum in future version
    inline turn_info_exception(char const method)
    {
        message = "Boost.Geometry Turn exception: ";
        message += method;
    }

    virtual ~turn_info_exception() throw()
    {}

    virtual char const* what() const throw()
    {
        return message.c_str();
    }
};
#endif

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace overlay
{

struct base_turn_handler
{
    // Returns true if both sides are opposite
    static inline bool opposite(int side1, int side2)
    {
        // We cannot state side1 == -side2, because 0 == -0
        // So either side1*side2==-1 or side1==-side2 && side1 != 0
        return side1 * side2 == -1;
    }

    // Same side of a segment (not being 0)
    static inline bool same(int side1, int side2)
    {
        return side1 * side2 == 1;
    }

    // Both continue
    template <typename TurnInfo>
    static inline void both(TurnInfo& ti, operation_type const op)
    {
        ti.operations[0].operation = op;
        ti.operations[1].operation = op;
    }

    // If condition, first union/second intersection, else vice versa
    template <typename TurnInfo>
    static inline void ui_else_iu(bool condition, TurnInfo& ti)
    {
        ti.operations[0].operation = condition
                    ? operation_union : operation_intersection;
        ti.operations[1].operation = condition
                    ? operation_intersection : operation_union;
    }

    // If condition, both union, else both intersection
    template <typename TurnInfo>
    static inline void uu_else_ii(bool condition, TurnInfo& ti)
    {
        both(ti, condition ? operation_union : operation_intersection);
    }

    template <typename TurnInfo, typename IntersectionInfo>
    static inline void assign_point(TurnInfo& ti,
                method_type method,
                IntersectionInfo const& info, unsigned int index)
    {
        ti.method = method;

        BOOST_GEOMETRY_ASSERT(index < info.count);

        geometry::convert(info.intersections[index], ti.point);
        ti.operations[0].fraction = info.fractions[index].robust_ra;
        ti.operations[1].fraction = info.fractions[index].robust_rb;
    }

    template <typename IntersectionInfo>
    static inline unsigned int non_opposite_to_index(IntersectionInfo const& info)
    {
        return info.fractions[0].robust_rb < info.fractions[1].robust_rb
            ? 1 : 0;
    }

};


template
<
    typename TurnInfo
>
struct touch_interior : public base_turn_handler
{
    // Index: 0, P is the interior, Q is touching and vice versa
    template
    <
        unsigned int Index,
        typename Point1,
        typename Point2,
        typename IntersectionInfo,
        typename DirInfo,
        typename SidePolicy
    >
    static inline void apply(
                Point1 const& , Point1 const& , Point1 const& ,
                Point2 const& , Point2 const& , Point2 const& ,
                TurnInfo& ti,
                IntersectionInfo const& intersection_info,
                DirInfo const& dir_info,
                SidePolicy const& side)
    {
        assign_point(ti, method_touch_interior, intersection_info, 0);

        // Both segments of q touch segment p somewhere in its interior
        // 1) We know: if q comes from LEFT or RIGHT
        // (i.e. dir_info.sides.get<Index,0>() == 1 or -1)
        // 2) Important is: if q_k goes to LEFT, RIGHT, COLLINEAR
        //    and, if LEFT/COLL, if it is lying LEFT or RIGHT w.r.t. q_i

        BOOST_STATIC_ASSERT(Index <= 1);
        static unsigned int const index_p = Index;
        static unsigned int const index_q = 1 - Index;

        int const side_qi_p = dir_info.sides.template get<index_q, 0>();
        int const side_qk_p = side.qk_wrt_p1();

        if (side_qi_p == -side_qk_p)
        {
            // Q crosses P from left->right or from right->left (test "ML1")
            // Union: folow P (left->right) or Q (right->left)
            // Intersection: other turn
            unsigned int index = side_qk_p == -1 ? index_p : index_q;
            ti.operations[index].operation = operation_union;
            ti.operations[1 - index].operation = operation_intersection;
            return;
        }

        int const side_qk_q = side.qk_wrt_q1();

        if (side_qi_p == -1 && side_qk_p == -1 && side_qk_q == 1)
        {
            // Q turns left on the right side of P (test "MR3")
            // Both directions for "intersection"
            both(ti, operation_intersection);
        }
        else if (side_qi_p == 1 && side_qk_p == 1 && side_qk_q == -1)
        {
            // Q turns right on the left side of P (test "ML3")
            // Union: take both operation
            // Intersection: skip
            both(ti, operation_union);
        }
        else if (side_qi_p == side_qk_p && side_qi_p == side_qk_q)
        {
            // Q turns left on the left side of P (test "ML2")
            // or Q turns right on the right side of P (test "MR2")
            // Union: take left turn (Q if Q turns left, P if Q turns right)
            // Intersection: other turn
            unsigned int index = side_qk_q == 1 ? index_q : index_p;
            ti.operations[index].operation = operation_union;
            ti.operations[1 - index].operation = operation_intersection;
        }
        else if (side_qk_p == 0)
        {
            // Q intersects on interior of P and continues collinearly
            if (side_qk_q == side_qi_p)
            {
                // Collinearly in the same direction
                // (Q comes from left of P and turns left,
                //  OR Q comes from right of P and turns right)
                // Omit intersection point.
                // Union: just continue
                // Intersection: just continue
                both(ti, operation_continue);
            }
            else
            {
                // Opposite direction, which is never travelled.
                // If Q turns left, P continues for intersection
                // If Q turns right, P continues for union
                ti.operations[index_p].operation = side_qk_q == 1
                    ? operation_intersection
                    : operation_union;
                ti.operations[index_q].operation = operation_blocked;
            }
        }
        else
        {
            // Should not occur!
            ti.method = method_error;
        }
    }
};


template
<
    typename TurnInfo
>
struct touch : public base_turn_handler
{
    static inline bool between(int side1, int side2, int turn)
    {
        return side1 == side2 && ! opposite(side1, turn);
    }

    /*static inline void block_second(bool block, TurnInfo& ti)
    {
        if (block)
        {
            ti.operations[1].operation = operation_blocked;
        }
    }*/


    template
    <
        typename Point1,
        typename Point2,
        typename IntersectionInfo,
        typename DirInfo,
        typename SidePolicy
    >
    static inline void apply(
                Point1 const& , Point1 const& , Point1 const& ,
                Point2 const& , Point2 const& , Point2 const& ,
                TurnInfo& ti,
                IntersectionInfo const& intersection_info,
                DirInfo const& dir_info,
                SidePolicy const& side)
    {
        assign_point(ti, method_touch, intersection_info, 0);

        int const side_qi_p1 = dir_info.sides.template get<1, 0>();
        int const side_qk_p1 = side.qk_wrt_p1();


        // If Qi and Qk are both at same side of Pi-Pj,
        // or collinear (so: not opposite sides)
        if (! opposite(side_qi_p1, side_qk_p1))
        {
            int const side_pk_q2 = side.pk_wrt_q2();
            int const side_pk_p  = side.pk_wrt_p1();
            int const side_qk_q  = side.qk_wrt_q1();

            bool const q_turns_left = side_qk_q == 1;
            bool const block_q = side_qk_p1 == 0
                        && ! same(side_qi_p1, side_qk_q)
                        ;

            // If Pk at same side as Qi/Qk
            // (the "or" is for collinear case)
            // or Q is fully collinear && P turns not to left
            if (side_pk_p == side_qi_p1
                || side_pk_p == side_qk_p1
                || (side_qi_p1 == 0 && side_qk_p1 == 0 && side_pk_p != -1)
                )
            {
                // Collinear -> lines join, continue
                // (#BRL2)
                if (side_pk_q2 == 0 && ! block_q)
                {
                    both(ti, operation_continue);
                    return;
                }

                int const side_pk_q1 = side.pk_wrt_q1();


                // Collinear opposite case -> block P
                // (#BRL4, #BLR8)
                if (side_pk_q1 == 0)
                {
                    ti.operations[0].operation = operation_blocked;
                    // Q turns right -> union (both independent),
                    // Q turns left -> intersection
                    ti.operations[1].operation = block_q ? operation_blocked
                        : q_turns_left ? operation_intersection
                        : operation_union;
                    return;
                }

                // Pk between Qi and Qk
                // (#BRL3, #BRL7)
                if (between(side_pk_q1, side_pk_q2, side_qk_q))
                {
                    ui_else_iu(q_turns_left, ti);
                    if (block_q)
                    {
                        ti.operations[1].operation = operation_blocked;
                    }
                    //block_second(block_q, ti);
                    return;
                }

                // Pk between Qk and P, so left of Qk (if Q turns right) and vv
                // (#BRL1)
                if (side_pk_q2 == -side_qk_q)
                {
                    ui_else_iu(! q_turns_left, ti);
                    return;
                }

                //
                // (#BRL5, #BRL9)
                if (side_pk_q1 == -side_qk_q)
                {
                    uu_else_ii(! q_turns_left, ti);
                    if (block_q)
                    {
                        ti.operations[1].operation = operation_blocked;
                    }
                    //block_second(block_q, ti);
                    return;
                }
            }
            else
            {
                // Pk at other side than Qi/Pk
                ti.operations[0].operation = q_turns_left
                            ? operation_intersection
                            : operation_union;
                ti.operations[1].operation = block_q
                            ? operation_blocked
                            : side_qi_p1 == 1 || side_qk_p1 == 1
                            ? operation_union
                            : operation_intersection;

                return;
            }
        }
        else
        {
            // From left to right or from right to left
            int const side_pk_p = side.pk_wrt_p1();
            bool const right_to_left = side_qk_p1 == 1;

            // If p turns into direction of qi (1,2)
            if (side_pk_p == side_qi_p1)
            {
                int const side_pk_q1 = side.pk_wrt_q1();

                // Collinear opposite case -> block P
                if (side_pk_q1 == 0)
                {
                    ti.operations[0].operation = operation_blocked;
                    ti.operations[1].operation = right_to_left
                                ? operation_union : operation_intersection;
                    return;
                }

                if (side_pk_q1 == side_qk_p1)
                {
                    uu_else_ii(right_to_left, ti);
                    return;
                }
            }

            // If p turns into direction of qk (4,5)
            if (side_pk_p == side_qk_p1)
            {
                int const side_pk_q2 = side.pk_wrt_q2();

                // Collinear case -> lines join, continue
                if (side_pk_q2 == 0)
                {
                    both(ti, operation_continue);
                    return;
                }
                if (side_pk_q2 == side_qk_p1)
                {
                    ui_else_iu(right_to_left, ti);
                    return;
                }
            }
            // otherwise (3)
            ui_else_iu(! right_to_left, ti);
            return;
        }

#ifdef BOOST_GEOMETRY_DEBUG_GET_TURNS
        // Normally a robustness issue.
        // TODO: more research if still occuring
        std::cout << "Not yet handled" << std::endl
            << "pi " << get<0>(pi) << " , " << get<1>(pi)
            << " pj " << get<0>(pj) << " , " << get<1>(pj)
            << " pk " << get<0>(pk) << " , " << get<1>(pk)
            << std::endl
            << "qi " << get<0>(qi) << " , " << get<1>(qi)
            << " qj " << get<0>(qj) << " , " << get<1>(qj)
            << " qk " << get<0>(qk) << " , " << get<1>(qk)
            << std::endl;
#endif

    }
};


template
<
    typename TurnInfo
>
struct equal : public base_turn_handler
{
    template
    <
        typename Point1,
        typename Point2,
        typename IntersectionInfo,
        typename DirInfo,
        typename SidePolicy
    >
    static inline void apply(
                Point1 const& , Point1 const& , Point1 const& ,
                Point2 const& , Point2 const& , Point2 const& ,
                TurnInfo& ti,
                IntersectionInfo const& info,
                DirInfo const&  ,
                SidePolicy const& side)
    {
        // Copy the intersection point in TO direction
        assign_point(ti, method_equal, info, non_opposite_to_index(info));

        int const side_pk_q2 = side.pk_wrt_q2();
        int const side_pk_p = side.pk_wrt_p1();
        int const side_qk_p = side.qk_wrt_p1();


        // If pk is collinear with qj-qk, they continue collinearly.
        // This can be on either side of p1 (== q1), or collinear
        // The second condition checks if they do not continue
        // oppositely
        if (side_pk_q2 == 0 && side_pk_p == side_qk_p)
        {
            both(ti, operation_continue);

            return;
        }


        // If they turn to same side (not opposite sides)
        if (! opposite(side_pk_p, side_qk_p))
        {
            // If pk is left of q2 or collinear: p: union, q: intersection
            ui_else_iu(side_pk_q2 != -1, ti);
        }
        else
        {
            // They turn opposite sides. If p turns left (or collinear),
            // p: union, q: intersection
            ui_else_iu(side_pk_p != -1, ti);
        }
    }
};


template
<
    typename TurnInfo,
    typename AssignPolicy
>
struct equal_opposite : public base_turn_handler
{
    template
    <
        typename Point1,
        typename Point2,
        typename OutputIterator,
        typename IntersectionInfo
    >
    static inline void apply(Point1 const& pi, Point2 const& qi,
                /* by value: */ TurnInfo tp,
                OutputIterator& out,
                IntersectionInfo const& intersection_info)
    {
        // For equal-opposite segments, normally don't do anything.
        if (AssignPolicy::include_opposite)
        {
            tp.method = method_equal;
            for (unsigned int i = 0; i < 2; i++)
            {
                tp.operations[i].operation = operation_opposite;
            }
            for (unsigned int i = 0; i < intersection_info.i_info().count; i++)
            {
                assign_point(tp, method_none, intersection_info.i_info(), i);
                AssignPolicy::apply(tp, pi, qi, intersection_info);
                *out++ = tp;
            }
        }
    }
};

template
<
    typename TurnInfo
>
struct collinear : public base_turn_handler
{
    /*
        arrival P   pk//p1  qk//q1   product*  case    result
         1           1                1        CLL1    ui
        -1                   1       -1        CLL2    iu
         1           1                1        CLR1    ui
        -1                  -1        1        CLR2    ui

         1          -1               -1        CRL1    iu
        -1                   1       -1        CRL2    iu
         1          -1               -1        CRR1    iu
        -1                  -1        1        CRR2    ui

         1           0                0        CC1     cc
        -1                   0        0        CC2     cc

         *product = arrival * (pk//p1 or qk//q1)

         Stated otherwise:
         - if P arrives: look at turn P
         - if Q arrives: look at turn Q
         - if P arrives and P turns left: union for P
         - if P arrives and P turns right: intersection for P
         - if Q arrives and Q turns left: union for Q (=intersection for P)
         - if Q arrives and Q turns right: intersection for Q (=union for P)

         ROBUSTNESS: p and q are collinear, so you would expect
         that side qk//p1 == pk//q1. But that is not always the case
         in near-epsilon ranges. Then decision logic is different.
         If p arrives, q is further, so the angle qk//p1 is (normally)
         more precise than pk//p1

    */
    template
    <
        typename Point1,
        typename Point2,
        typename IntersectionInfo,
        typename DirInfo,
        typename SidePolicy
    >
    static inline void apply(
                Point1 const& , Point1 const& pj, Point1 const& pk,
                Point2 const& , Point2 const& qj, Point2 const& qk,
                TurnInfo& ti,
                IntersectionInfo const& info,
                DirInfo const& dir_info,
                SidePolicy const& side)
    {
        // Copy the intersection point in TO direction
        assign_point(ti, method_collinear, info, non_opposite_to_index(info));

        int const arrival = dir_info.arrival[0];
        // Should not be 0, this is checked before
        BOOST_GEOMETRY_ASSERT(arrival != 0);

        int const side_p = side.pk_wrt_p1();
        int const side_q = side.qk_wrt_q1();

        // If p arrives, use p, else use q
        int const side_p_or_q = arrival == 1
            ? side_p
            : side_q
            ;

        // See comments above,
        // resulting in a strange sort of mathematic rule here:
        // The arrival-info multiplied by the relevant side
        // delivers a consistent result.

        int const product = arrival * side_p_or_q;

        if(product == 0)
        {
            both(ti, operation_continue);
        }
        else
        {
            ui_else_iu(product == 1, ti);
        }

        // Calculate remaining distance. If it continues collinearly it is
        // measured until the end of the next segment
        ti.operations[0].remaining_distance
                = side_p == 0
                ? distance_measure(ti.point, pk)
                : distance_measure(ti.point, pj);
        ti.operations[1].remaining_distance
                = side_q == 0
                ? distance_measure(ti.point, qk)
                : distance_measure(ti.point, qj);
    }

    template <typename Point1, typename Point2>
    static inline typename geometry::coordinate_type<Point1>::type
            distance_measure(Point1 const& a, Point2 const& b)
    {
        // TODO: use comparable distance for point-point instead - but that
        // causes currently cycling include problems
        typedef typename geometry::coordinate_type<Point1>::type ctype;
        ctype const dx = get<0>(a) - get<0>(b);
        ctype const dy = get<1>(b) - get<1>(b);
        return dx * dx + dy * dy;
    }
};

template
<
    typename TurnInfo,
    typename AssignPolicy
>
struct collinear_opposite : public base_turn_handler
{
private :
    /*
        arrival P  arrival Q  pk//p1   qk//q1  case  result2  result
        --------------------------------------------------------------
         1          1          1       -1      CLO1    ix      xu
         1          1          1        0      CLO2    ix      (xx)
         1          1          1        1      CLO3    ix      xi

         1          1          0       -1      CCO1    (xx)    xu
         1          1          0        0      CCO2    (xx)    (xx)
         1          1          0        1      CCO3    (xx)    xi

         1          1         -1       -1      CRO1    ux      xu
         1          1         -1        0      CRO2    ux      (xx)
         1          1         -1        1      CRO3    ux      xi

        -1          1                  -1      CXO1    xu
        -1          1                   0      CXO2    (xx)
        -1          1                   1      CXO3    xi

         1         -1          1               CXO1    ix
         1         -1          0               CXO2    (xx)
         1         -1         -1               CXO3    ux
    */

    template
    <
        unsigned int Index,
        typename Point1,
        typename Point2,
        typename IntersectionInfo
    >
    static inline bool set_tp(Point1 const& , Point1 const& , Point1 const& , int side_rk_r,
                bool const handle_robustness,
                Point2 const& , Point2 const& , int side_rk_s,
                TurnInfo& tp, IntersectionInfo const& intersection_info)
    {
        BOOST_STATIC_ASSERT(Index <= 1);

        boost::ignore_unused(handle_robustness, side_rk_s);

        operation_type blocked = operation_blocked;
        switch(side_rk_r)
        {

            case 1 :
                // Turning left on opposite collinear: intersection
                tp.operations[Index].operation = operation_intersection;
                break;
            case -1 :
                // Turning right on opposite collinear: union
                tp.operations[Index].operation = operation_union;
                break;
            case 0 :
                // No turn on opposite collinear: block, do not traverse
                // But this "xx" is usually ignored, it is useless to include
                // two operations blocked, so the whole point does not need
                // to be generated.
                // So return false to indicate nothing is to be done.
                if (AssignPolicy::include_opposite)
                {
                    tp.operations[Index].operation = operation_opposite;
                    blocked = operation_opposite;
                }
                else
                {
                    return false;
                }
                break;
        }

        // The other direction is always blocked when collinear opposite
        tp.operations[1 - Index].operation = blocked;

        // If P arrives within Q, set info on P (which is done above, index=0),
        // this turn-info belongs to the second intersection point, index=1
        // (see e.g. figure CLO1)
        assign_point(tp, method_collinear, intersection_info, 1 - Index);
        return true;
    }

public:
    static inline void empty_transformer(TurnInfo &) {}

    template
    <
        typename Point1,
        typename Point2,
        typename OutputIterator,
        typename IntersectionInfo,
        typename SidePolicy
    >
    static inline void apply(
                Point1 const& pi, Point1 const& pj, Point1 const& pk,
                Point2 const& qi, Point2 const& qj, Point2 const& qk,

                // Opposite collinear can deliver 2 intersection points,
                TurnInfo const& tp_model,
                OutputIterator& out,

                IntersectionInfo const& intersection_info,
                SidePolicy const& side)
    {
        apply(pi, pj, pk, qi, qj, qk, tp_model, out, intersection_info, side, empty_transformer);
    }

public:
    template
    <
        typename Point1,
        typename Point2,
        typename OutputIterator,
        typename IntersectionInfo,
        typename SidePolicy,
        typename TurnTransformer
    >
    static inline void apply(
                Point1 const& pi, Point1 const& pj, Point1 const& pk,
                Point2 const& qi, Point2 const& qj, Point2 const& qk,

                // Opposite collinear can deliver 2 intersection points,
                TurnInfo const& tp_model,
                OutputIterator& out,

                IntersectionInfo const& info,
                SidePolicy const& side,
                TurnTransformer turn_transformer,
                bool const is_pk_valid = true, bool const is_qk_valid = true)
    {
        TurnInfo tp = tp_model;

        int const p_arrival = info.d_info().arrival[0];
        int const q_arrival = info.d_info().arrival[1];

        // If P arrives within Q, there is a turn dependent on P
        if ( p_arrival == 1
          && is_pk_valid
          && set_tp<0>(pi, pj, pk, side.pk_wrt_p1(), true, qi, qj, side.pk_wrt_q1(), tp, info.i_info()) )
        {
            turn_transformer(tp);

            AssignPolicy::apply(tp, pi, qi, info);
            *out++ = tp;
        }

        // If Q arrives within P, there is a turn dependent on Q
        if ( q_arrival == 1
          && is_qk_valid
          && set_tp<1>(qi, qj, qk, side.qk_wrt_q1(), false, pi, pj, side.qk_wrt_p1(), tp, info.i_info()) )
        {
            turn_transformer(tp);

            AssignPolicy::apply(tp, pi, qi, info);
            *out++ = tp;
        }

        if (AssignPolicy::include_opposite)
        {
            // Handle cases not yet handled above
            if ((q_arrival == -1 && p_arrival == 0)
                || (p_arrival == -1 && q_arrival == 0))
            {
                for (unsigned int i = 0; i < 2; i++)
                {
                    tp.operations[i].operation = operation_opposite;
                }
                for (unsigned int i = 0; i < info.i_info().count; i++)
                {
                    assign_point(tp, method_collinear, info.i_info(), i);
                    AssignPolicy::apply(tp, pi, qi, info);
                    *out++ = tp;
                }
            }
        }

    }
};


template
<
    typename TurnInfo
>
struct crosses : public base_turn_handler
{
    template
    <
        typename Point1,
        typename Point2,
        typename IntersectionInfo,
        typename DirInfo
    >
    static inline void apply(
                Point1 const& , Point1 const& , Point1 const& ,
                Point2 const& , Point2 const& , Point2 const& ,
                TurnInfo& ti,
                IntersectionInfo const& intersection_info,
                DirInfo const& dir_info)
    {
        assign_point(ti, method_crosses, intersection_info, 0);

        // In all casees:
        // If Q crosses P from left to right
        // Union: take P
        // Intersection: take Q
        // Otherwise: vice versa
        int const side_qi_p1 = dir_info.sides.template get<1, 0>();
        unsigned int const index = side_qi_p1 == 1 ? 0 : 1;
        ti.operations[index].operation = operation_union;
        ti.operations[1 - index].operation = operation_intersection;
    }
};

struct only_convert : public base_turn_handler
{
    template<typename TurnInfo, typename IntersectionInfo>
    static inline void apply(TurnInfo& ti, IntersectionInfo const& intersection_info)
    {
        assign_point(ti, method_none, intersection_info, 0); // was collinear
        ti.operations[0].operation = operation_continue;
        ti.operations[1].operation = operation_continue;
    }
};

/*!
\brief Policy doing nothing
\details get_turn_info can have an optional policy to get/assign some
    extra information. By default it does not, and this class
    is that default.
 */
struct assign_null_policy
{
    static bool const include_no_turn = false;
    static bool const include_degenerate = false;
    static bool const include_opposite = false;

    template
    <
        typename Info,
        typename Point1,
        typename Point2,
        typename IntersectionInfo
    >
    static inline void apply(Info& , Point1 const& , Point2 const&, IntersectionInfo const&)
    {}

};


/*!
    \brief Turn information: intersection point, method, and turn information
    \details Information necessary for traversal phase (a phase
        of the overlay process). The information is gathered during the
        get_turns (segment intersection) phase.
    \tparam Point1 point type of first segment
    \tparam Point2 point type of second segment
    \tparam TurnInfo type of class getting intersection and turn info
    \tparam AssignPolicy policy to assign extra info,
        e.g. to calculate distance from segment's first points
        to intersection points.
        It also defines if a certain class of points
        (degenerate, non-turns) should be included.
 */
template<typename AssignPolicy>
struct get_turn_info
{
    // Intersect pi-pj with qi-qj
    // The points pk and qk are used do determine more information
    // about the turn (turn left/right)
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
                bool /*is_p_first*/, bool /*is_p_last*/,
                bool /*is_q_first*/, bool /*is_q_last*/,
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
                if (AssignPolicy::include_no_turn
                    && inters.i_info().count > 0)
                {
                    only_convert::apply(tp, inters.i_info());
                    AssignPolicy::apply(tp, pi, qi, inters);
                    *out++ = tp;
                }
                break;

            case 'd' : // disjoint: never do anything
                break;

            case 'm' :
            {
                typedef touch_interior
                    <
                        TurnInfo
                    > policy;

                // If Q (1) arrives (1)
                if ( inters.d_info().arrival[1] == 1 )
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
                AssignPolicy::apply(tp, pi, qi, inters);
                *out++ = tp;
            }
            break;
            case 'i' :
            {
                crosses<TurnInfo>::apply(pi, pj, pk, qi, qj, qk,
                    tp, inters.i_info(), inters.d_info());
                AssignPolicy::apply(tp, pi, qi, inters);
                *out++ = tp;
            }
            break;
            case 't' :
            {
                // Both touch (both arrive there)
                touch<TurnInfo>::apply(pi, pj, pk, qi, qj, qk,
                    tp, inters.i_info(), inters.d_info(), inters.sides());
                AssignPolicy::apply(tp, pi, qi, inters);
                *out++ = tp;
            }
            break;
            case 'e':
            {
                if ( ! inters.d_info().opposite )
                {
                    // Both equal
                    // or collinear-and-ending at intersection point
                    equal<TurnInfo>::apply(pi, pj, pk, qi, qj, qk,
                        tp, inters.i_info(), inters.d_info(), inters.sides());
                    AssignPolicy::apply(tp, pi, qi, inters);
                    *out++ = tp;
                }
                else
                {
                    equal_opposite
                        <
                            TurnInfo,
                            AssignPolicy
                        >::apply(pi, qi,
                            tp, out, inters);
                }
            }
            break;
            case 'c' :
            {
                // Collinear
                if ( ! inters.d_info().opposite )
                {

                    if ( inters.d_info().arrival[0] == 0 )
                    {
                        // Collinear, but similar thus handled as equal
                        equal<TurnInfo>::apply(pi, pj, pk, qi, qj, qk,
                                tp, inters.i_info(), inters.d_info(), inters.sides());

                        // override assigned method
                        tp.method = method_collinear;
                    }
                    else
                    {
                        collinear<TurnInfo>::apply(pi, pj, pk, qi, qj, qk,
                                tp, inters.i_info(), inters.d_info(), inters.sides());
                    }

                    AssignPolicy::apply(tp, pi, qi, inters);
                    *out++ = tp;
                }
                else
                {
                    collinear_opposite
                        <
                            TurnInfo,
                            AssignPolicy
                        >::apply(pi, pj, pk, qi, qj, qk,
                            tp, out, inters, inters.sides());
                }
            }
            break;
            case '0' :
            {
                // degenerate points
                if (AssignPolicy::include_degenerate)
                {
                    only_convert::apply(tp, inters.i_info());
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
};


}} // namespace detail::overlay
#endif //DOXYGEN_NO_DETAIL


}} // namespace boost::geometry


#if defined(_MSC_VER)
#pragma warning(pop)
#endif

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_GET_TURN_INFO_HPP
