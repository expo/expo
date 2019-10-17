// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2014-2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_IS_SIMPLE_LINEAR_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_IS_SIMPLE_LINEAR_HPP

#include <algorithm>
#include <deque>

#include <boost/range.hpp>

#include <boost/geometry/core/assert.hpp>
#include <boost/geometry/core/closure.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/core/point_type.hpp>
#include <boost/geometry/core/tag.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/util/range.hpp>

#include <boost/geometry/policies/predicate_based_interrupt_policy.hpp>
#include <boost/geometry/policies/robustness/no_rescale_policy.hpp>
#include <boost/geometry/policies/robustness/segment_ratio.hpp>

#include <boost/geometry/algorithms/equals.hpp>
#include <boost/geometry/algorithms/intersects.hpp>
#include <boost/geometry/algorithms/not_implemented.hpp>

#include <boost/geometry/algorithms/detail/check_iterator_range.hpp>
#include <boost/geometry/algorithms/detail/signed_size_type.hpp>

#include <boost/geometry/algorithms/detail/disjoint/linear_linear.hpp>
#include <boost/geometry/algorithms/detail/overlay/get_turn_info.hpp>
#include <boost/geometry/algorithms/detail/overlay/turn_info.hpp>
#include <boost/geometry/algorithms/detail/overlay/self_turn_points.hpp>
#include <boost/geometry/algorithms/detail/is_valid/has_duplicates.hpp>
#include <boost/geometry/algorithms/detail/is_valid/has_spikes.hpp>

#include <boost/geometry/algorithms/detail/is_simple/debug_print_boundary_points.hpp>
#include <boost/geometry/algorithms/detail/is_simple/failure_policy.hpp>
#include <boost/geometry/algorithms/detail/is_valid/debug_print_turns.hpp>

#include <boost/geometry/algorithms/dispatch/is_simple.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace is_simple
{


template <typename Turn>
inline bool check_segment_indices(Turn const& turn,
                                  signed_size_type last_index)
{
    return
        (turn.operations[0].seg_id.segment_index == 0
         && turn.operations[1].seg_id.segment_index == last_index)
        ||
        (turn.operations[0].seg_id.segment_index == 0
         && turn.operations[1].seg_id.segment_index == last_index);
}


template <typename Geometry, typename Tag = typename tag<Geometry>::type>
class is_acceptable_turn
    : not_implemented<Geometry>
{};

template <typename Linestring>
class is_acceptable_turn<Linestring, linestring_tag>
{
public:
    is_acceptable_turn(Linestring const& linestring)
        : m_linestring(linestring)
        , m_is_closed(geometry::equals(range::front(linestring),
                                       range::back(linestring)))
    {}

    template <typename Turn>
    inline bool apply(Turn const& turn) const
    {
        BOOST_GEOMETRY_ASSERT(boost::size(m_linestring) > 1);
        return m_is_closed
            && turn.method == overlay::method_none
            && check_segment_indices(turn, boost::size(m_linestring) - 2)
            && turn.operations[0].fraction.is_zero();
    }

private:
    Linestring const& m_linestring;
    bool const m_is_closed;
};

template <typename MultiLinestring>
class is_acceptable_turn<MultiLinestring, multi_linestring_tag>
{
private:
    typedef typename boost::range_value<MultiLinestring>::type linestring_type;
    typedef is_acceptable_turn<linestring_type> base_type;

    template <typename Point, typename Linestring>
    static inline bool is_boundary_point_of(Point const& point,
                                            Linestring const& linestring)
    {
        BOOST_GEOMETRY_ASSERT(boost::size(linestring) > 1);
        return
            ! geometry::equals(range::front(linestring),
                               range::back(linestring))
            &&
            (geometry::equals(point, range::front(linestring))
             || geometry::equals(point, range::back(linestring)));
    }

    template <typename Turn, typename Linestring>
    static inline bool is_closing_point_of(Turn const& turn,
                                           Linestring const& linestring)
    {
        BOOST_GEOMETRY_ASSERT(boost::size(linestring) > 1);
        return
            turn.method == overlay::method_none
            &&
            check_segment_indices(turn, boost::size(linestring) - 2)
            &&
            geometry::equals(range::front(linestring), range::back(linestring))
            &&
            turn.operations[0].fraction.is_zero();
            ;
    }

    template <typename Linestring1, typename Linestring2>
    static inline bool have_same_boundary_points(Linestring1 const& ls1,
                                                 Linestring2 const& ls2)
    {
        return
            geometry::equals(range::front(ls1), range::front(ls2))
            ?
            geometry::equals(range::back(ls1), range::back(ls2))
            :
            (geometry::equals(range::front(ls1), range::back(ls2))
             &&
             geometry::equals(range::back(ls1), range::front(ls2)))
            ;
    }

public:
    is_acceptable_turn(MultiLinestring const& multilinestring)
        : m_multilinestring(multilinestring)
    {}

    template <typename Turn>
    inline bool apply(Turn const& turn) const
    {
        linestring_type const& ls1 =
            range::at(m_multilinestring, turn.operations[0].seg_id.multi_index);

        linestring_type const& ls2 =
            range::at(m_multilinestring, turn.operations[1].seg_id.multi_index);

        if (turn.operations[0].seg_id.multi_index
            == turn.operations[1].seg_id.multi_index)
        {
            return is_closing_point_of(turn, ls1);
        }

        return
            is_boundary_point_of(turn.point, ls1)
            && is_boundary_point_of(turn.point, ls2)
            &&
            ( boost::size(ls1) != 2
              || boost::size(ls2) != 2
              || ! have_same_boundary_points(ls1, ls2) );
    }

private:
    MultiLinestring const& m_multilinestring;
};


template <typename Linear>
inline bool has_self_intersections(Linear const& linear)
{
    typedef typename point_type<Linear>::type point_type;

    // compute self turns
    typedef detail::overlay::turn_info
        <
            point_type,
            geometry::segment_ratio
                <
                    typename geometry::coordinate_type<point_type>::type
                >
        > turn_info;

    std::deque<turn_info> turns;

    typedef detail::overlay::get_turn_info
        <
            detail::disjoint::assign_disjoint_policy
        > turn_policy;

    is_acceptable_turn<Linear> predicate(linear);
    detail::overlay::predicate_based_interrupt_policy
        <
            is_acceptable_turn<Linear>
        > interrupt_policy(predicate);

    detail::self_get_turn_points::get_turns
        <
            turn_policy
        >::apply(linear,
                 detail::no_rescale_policy(),
                 turns,
                 interrupt_policy);

    detail::is_valid::debug_print_turns(turns.begin(), turns.end());
    debug_print_boundary_points(linear);

    return interrupt_policy.has_intersections;
}


template <typename Linestring, bool CheckSelfIntersections = true>
struct is_simple_linestring
{
    static inline bool apply(Linestring const& linestring)
    {
        simplicity_failure_policy policy;
        return ! boost::empty(linestring)
            && ! detail::is_valid::has_duplicates
                    <
                        Linestring, closed
                    >::apply(linestring, policy)
            && ! detail::is_valid::has_spikes
                    <
                        Linestring, closed
                    >::apply(linestring, policy)
            && ! (CheckSelfIntersections && has_self_intersections(linestring));
    }
};


template <typename MultiLinestring>
struct is_simple_multilinestring
{
    static inline bool apply(MultiLinestring const& multilinestring)
    {
        // check each of the linestrings for simplicity
        // but do not compute self-intersections yet; these will be
        // computed for the entire multilinestring
        if ( ! detail::check_iterator_range
                 <
                     is_simple_linestring
                         <
                             typename boost::range_value<MultiLinestring>::type,
                             false // do not compute self-intersections
                         >,
                     true // allow empty multilinestring
                 >::apply(boost::begin(multilinestring),
                          boost::end(multilinestring))
             )
        {
            return false;
        }

        return ! has_self_intersections(multilinestring);
    }
};



}} // namespace detail::is_simple
#endif // DOXYGEN_NO_DETAIL



#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

// A linestring is a curve.
// A curve is simple if it does not pass through the same point twice,
// with the possible exception of its two endpoints
//
// Reference: OGC 06-103r4 (6.1.6.1)
template <typename Linestring>
struct is_simple<Linestring, linestring_tag>
    : detail::is_simple::is_simple_linestring<Linestring>
{};


// A MultiLinestring is a MultiCurve
// A MultiCurve is simple if all of its elements are simple and the
// only intersections between any two elements occur at Points that
// are on the boundaries of both elements.
//
// Reference: OGC 06-103r4 (6.1.8.1; Fig. 9)
template <typename MultiLinestring>
struct is_simple<MultiLinestring, multi_linestring_tag>
    : detail::is_simple::is_simple_multilinestring<MultiLinestring>
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_IS_SIMPLE_LINEAR_HPP
