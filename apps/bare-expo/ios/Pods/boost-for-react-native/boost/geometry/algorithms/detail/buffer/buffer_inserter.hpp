// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2012-2014 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_BUFFER_INSERTER_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_BUFFER_INSERTER_HPP

#include <cstddef>
#include <iterator>


#include <boost/core/ignore_unused.hpp>
#include <boost/numeric/conversion/cast.hpp>
#include <boost/range.hpp>

#include <boost/geometry/core/assert.hpp>
#include <boost/geometry/core/closure.hpp>
#include <boost/geometry/core/exterior_ring.hpp>
#include <boost/geometry/core/interior_rings.hpp>

#include <boost/geometry/util/condition.hpp>
#include <boost/geometry/util/math.hpp>

#include <boost/geometry/strategies/buffer.hpp>
#include <boost/geometry/strategies/side.hpp>
#include <boost/geometry/algorithms/detail/buffer/buffered_piece_collection.hpp>
#include <boost/geometry/algorithms/detail/buffer/line_line_intersection.hpp>
#include <boost/geometry/algorithms/detail/buffer/parallel_continue.hpp>

#include <boost/geometry/algorithms/assign.hpp>
#include <boost/geometry/algorithms/num_interior_rings.hpp>
#include <boost/geometry/algorithms/simplify.hpp>

#include <boost/geometry/views/detail/normalized_view.hpp>

#if defined(BOOST_GEOMETRY_BUFFER_SIMPLIFY_WITH_AX)
#include <boost/geometry/strategies/cartesian/distance_projected_point_ax.hpp>
#endif


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace buffer
{

template <typename Range, typename DistanceStrategy>
inline void simplify_input(Range const& range,
        DistanceStrategy const& distance,
        Range& simplified)
{
    // We have to simplify the ring before to avoid very small-scaled
    // features in the original (convex/concave/convex) being enlarged
    // in a very large scale and causing issues (IP's within pieces).
    // This might be reconsidered later. Simplifying with a very small
    // distance (1%% of the buffer) will never be visible in the result,
    // if it is using round joins. For miter joins they are even more
    // sensitive to small scale input features, however the result will
    // look better.
    // It also gets rid of duplicate points
#if ! defined(BOOST_GEOMETRY_BUFFER_SIMPLIFY_WITH_AX)
    geometry::simplify(range, simplified, distance.simplify_distance());
#else

    typedef typename boost::range_value<Range>::type point_type;
    typedef strategy::distance::detail::projected_point_ax<> ax_type;
    typedef typename strategy::distance::services::return_type
    <
        strategy::distance::detail::projected_point_ax<>,
        point_type,
        point_type
    >::type return_type;

    typedef strategy::distance::detail::projected_point_ax_less
    <
        return_type
    > comparator_type;

    typedef strategy::simplify::detail::douglas_peucker
    <
        point_type,
        strategy::distance::detail::projected_point_ax<>,
        comparator_type
    > dp_ax;

    return_type max_distance(distance.simplify_distance() * 2.0,
                             distance.simplify_distance());
    comparator_type comparator(max_distance);
    dp_ax strategy(comparator);

    geometry::simplify(range, simplified, max_distance, strategy);
#endif

    if (boost::size(simplified) == 2
        && geometry::equals(geometry::range::front(simplified),
                geometry::range::back(simplified)))
    {
        traits::resize<Range>::apply(simplified, 1);
    }
}


template <typename RingOutput>
struct buffer_range
{
    typedef typename point_type<RingOutput>::type output_point_type;
    typedef typename coordinate_type<RingOutput>::type coordinate_type;

    template
    <
        typename Collection,
        typename Point,
        typename DistanceStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename RobustPolicy
    >
    static inline
    void add_join(Collection& collection,
            Point const& penultimate_input,
            Point const& previous_input,
            output_point_type const& prev_perp1,
            output_point_type const& prev_perp2,
            Point const& input,
            output_point_type const& perp1,
            output_point_type const& perp2,
            strategy::buffer::buffer_side_selector side,
            DistanceStrategy const& distance,
            JoinStrategy const& join_strategy,
            EndStrategy const& end_strategy,
            RobustPolicy const& )
    {
        output_point_type intersection_point;
        geometry::assign_zero(intersection_point);

        strategy::buffer::join_selector join
                = get_join_type(penultimate_input, previous_input, input);
        if (join == strategy::buffer::join_convex)
        {
            // Calculate the intersection-point formed by the two sides.
            // It might be that the two sides are not convex, but continue
            // or spikey, we then change the join-type
            join = line_line_intersection::apply(
                        perp1, perp2, prev_perp1, prev_perp2,
                        intersection_point);

        }

        switch(join)
        {
            case strategy::buffer::join_continue :
                // No join, we get two consecutive sides
                break;
            case strategy::buffer::join_concave :
                {
                    std::vector<output_point_type> range_out;
                    range_out.push_back(prev_perp2);
                    range_out.push_back(previous_input);
                    collection.add_piece(strategy::buffer::buffered_concave, previous_input, range_out);

                    range_out.clear();
                    range_out.push_back(previous_input);
                    range_out.push_back(perp1);
                    collection.add_piece(strategy::buffer::buffered_concave, previous_input, range_out);
                }
                break;
            case strategy::buffer::join_spike :
                {
                    // For linestrings, only add spike at one side to avoid
                    // duplicates
                    std::vector<output_point_type> range_out;
                    end_strategy.apply(penultimate_input, prev_perp2, previous_input, perp1, side, distance, range_out);
                    collection.add_endcap(end_strategy, range_out, previous_input);
                    collection.set_current_ring_concave();
                }
                break;
            case strategy::buffer::join_convex :
                {
                    // The corner is convex, we create a join
                    // TODO (future) - avoid a separate vector, add the piece directly
                    std::vector<output_point_type> range_out;
                    if (join_strategy.apply(intersection_point,
                                previous_input, prev_perp2, perp1,
                                distance.apply(previous_input, input, side),
                                range_out))
                    {
                        collection.add_piece(strategy::buffer::buffered_join,
                                previous_input, range_out);
                    }
                }
                break;
        }
    }

    static inline strategy::buffer::join_selector get_join_type(
            output_point_type const& p0,
            output_point_type const& p1,
            output_point_type const& p2)
    {
        typedef typename strategy::side::services::default_strategy
            <
                typename cs_tag<output_point_type>::type
            >::type side_strategy;

        int const side = side_strategy::apply(p0, p1, p2);
        return side == -1 ? strategy::buffer::join_convex
            :  side == 1  ? strategy::buffer::join_concave
            :  parallel_continue
                    (
                        get<0>(p2) - get<0>(p1),
                        get<1>(p2) - get<1>(p1),
                        get<0>(p1) - get<0>(p0),
                        get<1>(p1) - get<1>(p0)
                    )  ? strategy::buffer::join_continue
            : strategy::buffer::join_spike;
    }

    template
    <
        typename Collection,
        typename Iterator,
        typename DistanceStrategy,
        typename SideStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename RobustPolicy
    >
    static inline strategy::buffer::result_code iterate(Collection& collection,
                Iterator begin, Iterator end,
                strategy::buffer::buffer_side_selector side,
                DistanceStrategy const& distance_strategy,
                SideStrategy const& side_strategy,
                JoinStrategy const& join_strategy,
                EndStrategy const& end_strategy,
                RobustPolicy const& robust_policy,
                output_point_type& first_p1,
                output_point_type& first_p2,
                output_point_type& last_p1,
                output_point_type& last_p2)
    {
        boost::ignore_unused(side_strategy);

        typedef typename std::iterator_traits
        <
            Iterator
        >::value_type point_type;

        point_type second_point, penultimate_point, ultimate_point; // last two points from begin/end

        /*
         * last.p1    last.p2  these are the "previous (last) perpendicular points"
         * --------------
         * |            |
         * *------------*____  <- *prev
         * pup          |    | p1           "current perpendicular point 1"
         *              |    |
         *              |    |       this forms a "side", a side is a piece
         *              |    |
         *              *____| p2
         *
         *              ^
         *             *it
         *
         * pup: penultimate_point
         */

        strategy::buffer::result_code result = strategy::buffer::result_no_output;
        bool first = true;

        Iterator it = begin;

        std::vector<output_point_type> generated_side;
        generated_side.reserve(2);

        for (Iterator prev = it++; it != end; ++it)
        {
            generated_side.clear();
            strategy::buffer::result_code error_code
                = side_strategy.apply(*prev, *it, side,
                                distance_strategy, generated_side);

            if (error_code == strategy::buffer::result_no_output)
            {
                // Because input is simplified, this is improbable,
                // but it can happen for degenerate geometries
                // Further handling of this side is skipped
                continue;
            }
            else if (error_code == strategy::buffer::result_error_numerical)
            {
                return error_code;
            }

            BOOST_GEOMETRY_ASSERT(! generated_side.empty());

            result = strategy::buffer::result_normal;

            if (! first)
            {
                 add_join(collection,
                        penultimate_point,
                        *prev, last_p1, last_p2,
                        *it, generated_side.front(), generated_side.back(),
                        side,
                        distance_strategy, join_strategy, end_strategy,
                        robust_policy);
            }

            collection.add_side_piece(*prev, *it, generated_side, first);

            penultimate_point = *prev;
            ultimate_point = *it;
            last_p1 = generated_side.front();
            last_p2 = generated_side.back();
            prev = it;
            if (first)
            {
                first = false;
                second_point = *it;
                first_p1 = generated_side.front();
                first_p2 = generated_side.back();
            }
        }
        return result;
    }
};

template
<
    typename Multi,
    typename PolygonOutput,
    typename Policy
>
struct buffer_multi
{
    template
    <
        typename Collection,
        typename DistanceStrategy,
        typename SideStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename PointStrategy,
        typename RobustPolicy
    >
    static inline void apply(Multi const& multi,
            Collection& collection,
            DistanceStrategy const& distance_strategy,
            SideStrategy const& side_strategy,
            JoinStrategy const& join_strategy,
            EndStrategy const& end_strategy,
            PointStrategy const& point_strategy,
            RobustPolicy const& robust_policy)
    {
        for (typename boost::range_iterator<Multi const>::type
                it = boost::begin(multi);
            it != boost::end(multi);
            ++it)
        {
            Policy::apply(*it, collection,
                distance_strategy, side_strategy,
                join_strategy, end_strategy, point_strategy,
                robust_policy);
        }
    }
};

struct visit_pieces_default_policy
{
    template <typename Collection>
    static inline void apply(Collection const&, int)
    {}
};

template
<
    typename OutputPointType,
    typename Point,
    typename Collection,
    typename DistanceStrategy,
    typename PointStrategy
>
inline void buffer_point(Point const& point, Collection& collection,
        DistanceStrategy const& distance_strategy,
        PointStrategy const& point_strategy)
{
    collection.start_new_ring();
    std::vector<OutputPointType> range_out;
    point_strategy.apply(point, distance_strategy, range_out);
    collection.add_piece(strategy::buffer::buffered_point, range_out, false);
    collection.set_piece_center(point);
    collection.finish_ring(strategy::buffer::result_normal);
}


}} // namespace detail::buffer
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

template
<
    typename Tag,
    typename RingInput,
    typename RingOutput
>
struct buffer_inserter
{};



template
<
    typename Point,
    typename RingOutput
>
struct buffer_inserter<point_tag, Point, RingOutput>
{
    template
    <
        typename Collection,
        typename DistanceStrategy,
        typename SideStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename PointStrategy,
        typename RobustPolicy
    >
    static inline void apply(Point const& point, Collection& collection,
            DistanceStrategy const& distance_strategy,
            SideStrategy const& ,
            JoinStrategy const& ,
            EndStrategy const& ,
            PointStrategy const& point_strategy,
            RobustPolicy const& )
    {
        detail::buffer::buffer_point
        <
            typename point_type<RingOutput>::type
        >(point, collection, distance_strategy, point_strategy);
    }
};


template
<
    typename RingInput,
    typename RingOutput
>
struct buffer_inserter<ring_tag, RingInput, RingOutput>
{
    typedef typename point_type<RingOutput>::type output_point_type;

    template
    <
        typename Collection,
        typename Iterator,
        typename DistanceStrategy,
        typename SideStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename RobustPolicy
    >
    static inline strategy::buffer::result_code iterate(Collection& collection,
                Iterator begin, Iterator end,
                strategy::buffer::buffer_side_selector side,
                DistanceStrategy const& distance_strategy,
                SideStrategy const& side_strategy,
                JoinStrategy const& join_strategy,
                EndStrategy const& end_strategy,
                RobustPolicy const& robust_policy)
    {
        output_point_type first_p1, first_p2, last_p1, last_p2;

        typedef detail::buffer::buffer_range<RingOutput> buffer_range;

        strategy::buffer::result_code result
            = buffer_range::iterate(collection, begin, end,
                side,
                distance_strategy, side_strategy, join_strategy, end_strategy, robust_policy,
                first_p1, first_p2, last_p1, last_p2);

        // Generate closing join
        if (result == strategy::buffer::result_normal)
        {
            buffer_range::add_join(collection,
                *(end - 2),
                *(end - 1), last_p1, last_p2,
                *(begin + 1), first_p1, first_p2,
                side,
                distance_strategy, join_strategy, end_strategy,
                robust_policy);
        }

        // Buffer is closed automatically by last closing corner
        return result;
    }

    template
    <
        typename Collection,
        typename DistanceStrategy,
        typename SideStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename PointStrategy,
        typename RobustPolicy
    >
    static inline strategy::buffer::result_code apply(RingInput const& ring,
            Collection& collection,
            DistanceStrategy const& distance,
            SideStrategy const& side_strategy,
            JoinStrategy const& join_strategy,
            EndStrategy const& end_strategy,
            PointStrategy const& point_strategy,
            RobustPolicy const& robust_policy)
    {
        RingInput simplified;
        detail::buffer::simplify_input(ring, distance, simplified);

        strategy::buffer::result_code code = strategy::buffer::result_no_output;

        std::size_t n = boost::size(simplified);
        std::size_t const min_points = core_detail::closure::minimum_ring_size
            <
                geometry::closure<RingInput>::value
            >::value;

        if (n >= min_points)
        {
            detail::normalized_view<RingInput const> view(simplified);
            if (distance.negative())
            {
                // Walk backwards (rings will be reversed afterwards)
                code = iterate(collection, boost::rbegin(view), boost::rend(view),
                        strategy::buffer::buffer_side_right,
                        distance, side_strategy, join_strategy, end_strategy, robust_policy);
            }
            else
            {
                code = iterate(collection, boost::begin(view), boost::end(view),
                        strategy::buffer::buffer_side_left,
                        distance, side_strategy, join_strategy, end_strategy, robust_policy);
            }
        }

        if (code == strategy::buffer::result_no_output && n >= 1)
        {
            // Use point_strategy to buffer degenerated ring
            detail::buffer::buffer_point<output_point_type>
                (
                    geometry::range::front(simplified),
                    collection, distance, point_strategy
                );
        }
        return code;
    }
};


template
<
    typename Linestring,
    typename Polygon
>
struct buffer_inserter<linestring_tag, Linestring, Polygon>
{
    typedef typename ring_type<Polygon>::type output_ring_type;
    typedef typename point_type<output_ring_type>::type output_point_type;
    typedef typename point_type<Linestring>::type input_point_type;

    template
    <
        typename Collection,
        typename Iterator,
        typename DistanceStrategy,
        typename SideStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename RobustPolicy
    >
    static inline strategy::buffer::result_code iterate(Collection& collection,
                Iterator begin, Iterator end,
                strategy::buffer::buffer_side_selector side,
                DistanceStrategy const& distance_strategy,
                SideStrategy const& side_strategy,
                JoinStrategy const& join_strategy,
                EndStrategy const& end_strategy,
                RobustPolicy const& robust_policy,
                output_point_type& first_p1)
    {
        input_point_type const& ultimate_point = *(end - 1);
        input_point_type const& penultimate_point = *(end - 2);

        // For the end-cap, we need to have the last perpendicular point on the
        // other side of the linestring. If it is the second pass (right),
        // we have it already from the first phase (left).
        // But for the first pass, we have to generate it
        output_point_type reverse_p1;
        if (side == strategy::buffer::buffer_side_right)
        {
            reverse_p1 = first_p1;
        }
        else
        {
            std::vector<output_point_type> generated_side;
            strategy::buffer::result_code code
                = side_strategy.apply(ultimate_point, penultimate_point,
                    strategy::buffer::buffer_side_right,
                    distance_strategy, generated_side);
            if (code != strategy::buffer::result_normal)
            {
                // No output or numerical error
                return code;
            }
            reverse_p1 = generated_side.front();
        }

        output_point_type first_p2, last_p1, last_p2;

        strategy::buffer::result_code result
            = detail::buffer::buffer_range<output_ring_type>::iterate(collection,
                begin, end, side,
                distance_strategy, side_strategy, join_strategy, end_strategy, robust_policy,
                first_p1, first_p2, last_p1, last_p2);

        if (result == strategy::buffer::result_normal)
        {
            std::vector<output_point_type> range_out;
            end_strategy.apply(penultimate_point, last_p2, ultimate_point, reverse_p1, side, distance_strategy, range_out);
            collection.add_endcap(end_strategy, range_out, ultimate_point);
        }
        return result;
    }

    template
    <
        typename Collection,
        typename DistanceStrategy,
        typename SideStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename PointStrategy,
        typename RobustPolicy
    >
    static inline strategy::buffer::result_code apply(Linestring const& linestring, Collection& collection,
            DistanceStrategy const& distance,
            SideStrategy const& side_strategy,
            JoinStrategy const& join_strategy,
            EndStrategy const& end_strategy,
            PointStrategy const& point_strategy,
            RobustPolicy const& robust_policy)
    {
        Linestring simplified;
        detail::buffer::simplify_input(linestring, distance, simplified);

        strategy::buffer::result_code code = strategy::buffer::result_no_output;
        std::size_t n = boost::size(simplified);
        if (n > 1)
        {
            collection.start_new_ring();
            output_point_type first_p1;
            code = iterate(collection,
                    boost::begin(simplified), boost::end(simplified),
                    strategy::buffer::buffer_side_left,
                    distance, side_strategy, join_strategy, end_strategy, robust_policy,
                    first_p1);

            if (code == strategy::buffer::result_normal)
            {
                code = iterate(collection,
                        boost::rbegin(simplified), boost::rend(simplified),
                        strategy::buffer::buffer_side_right,
                        distance, side_strategy, join_strategy, end_strategy, robust_policy,
                        first_p1);
            }
            collection.finish_ring(code);
        }
        if (code == strategy::buffer::result_no_output && n >= 1)
        {
            // Use point_strategy to buffer degenerated linestring
            detail::buffer::buffer_point<output_point_type>
                (
                    geometry::range::front(simplified),
                    collection, distance, point_strategy
                );
        }
        return code;
    }
};


template
<
    typename PolygonInput,
    typename PolygonOutput
>
struct buffer_inserter<polygon_tag, PolygonInput, PolygonOutput>
{
private:
    typedef typename ring_type<PolygonInput>::type input_ring_type;
    typedef typename ring_type<PolygonOutput>::type output_ring_type;

    typedef buffer_inserter<ring_tag, input_ring_type, output_ring_type> policy;


    template
    <
        typename Iterator,
        typename Collection,
        typename DistanceStrategy,
        typename SideStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename PointStrategy,
        typename RobustPolicy
    >
    static inline
    void iterate(Iterator begin, Iterator end,
            Collection& collection,
            DistanceStrategy const& distance,
            SideStrategy const& side_strategy,
            JoinStrategy const& join_strategy,
            EndStrategy const& end_strategy,
            PointStrategy const& point_strategy,
            RobustPolicy const& robust_policy,
            bool is_interior)
    {
        for (Iterator it = begin; it != end; ++it)
        {
            collection.start_new_ring();
            strategy::buffer::result_code const code
                    = policy::apply(*it, collection, distance, side_strategy,
                    join_strategy, end_strategy, point_strategy,
                    robust_policy);

            collection.finish_ring(code, is_interior);
        }
    }

    template
    <
        typename InteriorRings,
        typename Collection,
        typename DistanceStrategy,
        typename SideStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename PointStrategy,
        typename RobustPolicy
    >
    static inline
    void apply_interior_rings(InteriorRings const& interior_rings,
            Collection& collection,
            DistanceStrategy const& distance,
            SideStrategy const& side_strategy,
            JoinStrategy const& join_strategy,
            EndStrategy const& end_strategy,
            PointStrategy const& point_strategy,
            RobustPolicy const& robust_policy)
    {
        iterate(boost::begin(interior_rings), boost::end(interior_rings),
            collection, distance, side_strategy,
            join_strategy, end_strategy, point_strategy,
            robust_policy, true);
    }

public:
    template
    <
        typename Collection,
        typename DistanceStrategy,
        typename SideStrategy,
        typename JoinStrategy,
        typename EndStrategy,
        typename PointStrategy,
        typename RobustPolicy
    >
    static inline void apply(PolygonInput const& polygon,
            Collection& collection,
            DistanceStrategy const& distance,
            SideStrategy const& side_strategy,
            JoinStrategy const& join_strategy,
            EndStrategy const& end_strategy,
            PointStrategy const& point_strategy,
            RobustPolicy const& robust_policy)
    {
        {
            collection.start_new_ring();

            strategy::buffer::result_code const code
                = policy::apply(exterior_ring(polygon), collection,
                    distance, side_strategy,
                    join_strategy, end_strategy, point_strategy,
                    robust_policy);

            collection.finish_ring(code, false,
                    geometry::num_interior_rings(polygon) > 0u);
        }

        apply_interior_rings(interior_rings(polygon),
                collection, distance, side_strategy,
                join_strategy, end_strategy, point_strategy,
                robust_policy);
    }
};


template
<
    typename Multi,
    typename PolygonOutput
>
struct buffer_inserter<multi_tag, Multi, PolygonOutput>
    : public detail::buffer::buffer_multi
             <
                Multi,
                PolygonOutput,
                dispatch::buffer_inserter
                <
                    typename single_tag_of
                                <
                                    typename tag<Multi>::type
                                >::type,
                    typename boost::range_value<Multi const>::type,
                    typename geometry::ring_type<PolygonOutput>::type
                >
            >
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace buffer
{

template
<
    typename GeometryOutput,
    typename GeometryInput,
    typename OutputIterator,
    typename DistanceStrategy,
    typename SideStrategy,
    typename JoinStrategy,
    typename EndStrategy,
    typename PointStrategy,
    typename RobustPolicy,
    typename VisitPiecesPolicy
>
inline void buffer_inserter(GeometryInput const& geometry_input, OutputIterator out,
        DistanceStrategy const& distance_strategy,
        SideStrategy const& side_strategy,
        JoinStrategy const& join_strategy,
        EndStrategy const& end_strategy,
        PointStrategy const& point_strategy,
        RobustPolicy const& robust_policy,
        VisitPiecesPolicy& visit_pieces_policy
    )
{
    boost::ignore_unused(visit_pieces_policy);

    typedef detail::buffer::buffered_piece_collection
    <
        typename geometry::ring_type<GeometryOutput>::type,
        RobustPolicy
    > collection_type;
    collection_type collection(robust_policy);
    collection_type const& const_collection = collection;

    bool const areal = boost::is_same
        <
            typename tag_cast<typename tag<GeometryInput>::type, areal_tag>::type,
            areal_tag
        >::type::value;
    bool const linear = boost::is_same
        <
            typename tag_cast<typename tag<GeometryInput>::type, linear_tag>::type,
            linear_tag
        >::type::value;

    dispatch::buffer_inserter
        <
            typename tag_cast
                <
                    typename tag<GeometryInput>::type,
                    multi_tag
                >::type,
            GeometryInput,
            GeometryOutput
        >::apply(geometry_input, collection,
            distance_strategy, side_strategy, join_strategy,
            end_strategy, point_strategy,
            robust_policy);

    collection.get_turns();
    collection.classify_turns(linear);
    if (BOOST_GEOMETRY_CONDITION(areal))
    {
        collection.check_remaining_points(distance_strategy);
    }

    // Visit the piece collection. This does nothing (by default), but
    // optionally a debugging tool can be attached (e.g. console or svg),
    // or the piece collection can be unit-tested
    // phase 0: turns (before discarded)
    visit_pieces_policy.apply(const_collection, 0);

    collection.discard_rings();
    collection.block_turns();
    collection.enrich();

    // phase 1: turns (after enrichment/clustering)
    visit_pieces_policy.apply(const_collection, 1);

    collection.traverse();

    // Reverse all offsetted rings / traversed rings if:
    // - they were generated on the negative side (deflate) of polygons
    // - the output is counter clockwise
    // and avoid reversing twice
    bool reverse = distance_strategy.negative() && areal;
    if (BOOST_GEOMETRY_CONDITION(
            geometry::point_order<GeometryOutput>::value == counterclockwise))
    {
        reverse = ! reverse;
    }
    if (reverse)
    {
        collection.reverse();
    }

    if (BOOST_GEOMETRY_CONDITION(distance_strategy.negative() && areal))
    {
        collection.discard_nonintersecting_deflated_rings();
    }

    collection.template assign<GeometryOutput>(out);

    // Visit collection again
    // phase 2: rings (after traversing)
    visit_pieces_policy.apply(const_collection, 2);
}

template
<
    typename GeometryOutput,
    typename GeometryInput,
    typename OutputIterator,
    typename DistanceStrategy,
    typename SideStrategy,
    typename JoinStrategy,
    typename EndStrategy,
    typename PointStrategy,
    typename RobustPolicy
>
inline void buffer_inserter(GeometryInput const& geometry_input, OutputIterator out,
        DistanceStrategy const& distance_strategy,
        SideStrategy const& side_strategy,
        JoinStrategy const& join_strategy,
        EndStrategy const& end_strategy,
        PointStrategy const& point_strategy,
        RobustPolicy const& robust_policy)
{
    detail::buffer::visit_pieces_default_policy visitor;
    buffer_inserter<GeometryOutput>(geometry_input, out,
        distance_strategy, side_strategy, join_strategy,
        end_strategy, point_strategy,
        robust_policy, visitor);
}
#endif // DOXYGEN_NO_DETAIL

}} // namespace detail::buffer

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_BUFFER_INSERTER_HPP
