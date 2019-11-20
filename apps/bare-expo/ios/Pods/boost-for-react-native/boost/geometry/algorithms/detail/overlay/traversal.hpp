// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_TRAVERSAL_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_TRAVERSAL_HPP

#include <cstddef>

#include <boost/range.hpp>

#include <boost/geometry/algorithms/detail/overlay/aggregate_operations.hpp>
#include <boost/geometry/algorithms/detail/overlay/sort_by_side.hpp>
#include <boost/geometry/algorithms/detail/overlay/turn_info.hpp>
#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/assert.hpp>

#if defined(BOOST_GEOMETRY_DEBUG_INTERSECTION) \
    || defined(BOOST_GEOMETRY_OVERLAY_REPORT_WKT) \
    || defined(BOOST_GEOMETRY_DEBUG_TRAVERSE)
#  include <string>
#  include <boost/geometry/algorithms/detail/overlay/debug_turn_info.hpp>
#  include <boost/geometry/io/wkt/wkt.hpp>
#endif

namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace overlay
{

template <typename Turn, typename Operation>
#ifdef BOOST_GEOMETRY_DEBUG_TRAVERSE
inline void debug_traverse(Turn const& turn, Operation op,
                std::string const& header)
{
    std::cout << header
        << " at " << op.seg_id
        << " meth: " << method_char(turn.method)
        << " op: " << operation_char(op.operation)
        << " vis: " << visited_char(op.visited)
        << " of:  " << operation_char(turn.operations[0].operation)
        << operation_char(turn.operations[1].operation)
        << " " << geometry::wkt(turn.point)
        << std::endl;

    if (boost::contains(header, "Finished"))
    {
        std::cout << std::endl;
    }
}
#else
inline void debug_traverse(Turn const& , Operation, const char*)
{
}
#endif


//! Metafunction to define side_order (clockwise, ccw) by operation_type
template <operation_type OpType>
struct side_compare {};

template <>
struct side_compare<operation_union>
{
    typedef std::greater<int> type;
};

template <>
struct side_compare<operation_intersection>
{
    typedef std::less<int> type;
};


template
<
    bool Reverse1,
    bool Reverse2,
    overlay_type OverlayType,
    typename Geometry1,
    typename Geometry2,
    typename Turns,
    typename Clusters,
    typename RobustPolicy,
    typename Visitor
>
struct traversal
{
    static const operation_type target_operation = operation_from_overlay<OverlayType>::value;

    typedef typename side_compare<target_operation>::type side_compare_type;
    typedef typename boost::range_value<Turns>::type turn_type;
    typedef typename turn_type::turn_operation_type turn_operation_type;

    typedef typename geometry::point_type<Geometry1>::type point_type;
    typedef sort_by_side::side_sorter
        <
            Reverse1, Reverse2,
            point_type, side_compare_type
        > sbs_type;

    inline traversal(Geometry1 const& geometry1, Geometry2 const& geometry2,
            Turns& turns, Clusters const& clusters,
            RobustPolicy const& robust_policy, Visitor& visitor)
        : m_geometry1(geometry1)
        , m_geometry2(geometry2)
        , m_turns(turns)
        , m_clusters(clusters)
        , m_robust_policy(robust_policy)
        , m_visitor(visitor)
    {
    }

    inline void finalize_visit_info()
    {
        for (typename boost::range_iterator<Turns>::type
            it = boost::begin(m_turns);
            it != boost::end(m_turns);
            ++it)
        {
            turn_type& turn = *it;
            for (int i = 0; i < 2; i++)
            {
                turn_operation_type& op = turn.operations[i];
                op.visited.finalize();
            }
        }
    }

    inline void set_visited(turn_type& turn, turn_operation_type& op)
    {
        // On "continue", set "visited" for ALL directions in this turn
        if (op.operation == detail::overlay::operation_continue)
        {
            for (int i = 0; i < 2; i++)
            {
                turn_operation_type& op = turn.operations[i];
                if (op.visited.none())
                {
                    op.visited.set_visited();
                }
            }
        }
        else
        {
            op.visited.set_visited();
        }
    }

    inline bool is_visited(turn_type const& , turn_operation_type const& op,
                         signed_size_type , int) const
    {
        return op.visited.visited();
    }

    inline bool select_source(signed_size_type turn_index,
                              segment_identifier const& seg_id1,
                              segment_identifier const& seg_id2) const
    {
        // For uu/ii, only switch sources if indicated
        turn_type const& turn = m_turns[turn_index];

        if (OverlayType == overlay_buffer)
        {
            // Buffer does not use source_index (always 0)
            return turn.switch_source
                    ? seg_id1.multi_index != seg_id2.multi_index
                    : seg_id1.multi_index == seg_id2.multi_index;
        }

#if defined(BOOST_GEOMETRY_DEBUG_TRAVERSAL_SWITCH_DETECTOR)
        if (turn.switch_source)
        {
            std::cout << "Switch source at " << turn_index << std::endl;
        }
        else
        {
            std::cout << "DON'T SWITCH SOURCES at " << turn_index << std::endl;
        }
#endif
        return turn.switch_source
                ? seg_id1.source_index != seg_id2.source_index
                : seg_id1.source_index == seg_id2.source_index;
    }

    inline
    signed_size_type get_next_turn_index(turn_operation_type const& op) const
    {
        return op.enriched.next_ip_index == -1
                ? op.enriched.travels_to_ip_index
                : op.enriched.next_ip_index;
    }

    inline bool traverse_possible(signed_size_type turn_index) const
    {
        if (turn_index == -1)
        {
            return false;
        }

        turn_type const& turn = m_turns[turn_index];

        // It is not a dead end if there is an operation to continue, or of
        // there is a cluster (assuming for now we can get out of the cluster)
        return turn.cluster_id >= 0
            || turn.has(target_operation)
            || turn.has(operation_continue);
    }

    inline
    bool select_cc_operation(turn_type const& turn,
                signed_size_type start_turn_index,
                int& selected_op_index) const
    {
        // For "cc", take either one, but if there is a starting one,
        //           take that one. If next is dead end, skip that one.

        bool result = false;

        typename turn_operation_type::comparable_distance_type
                max_remaining_distance = 0;

        for (int i = 0; i < 2; i++)
        {
            turn_operation_type const& op = turn.operations[i];

            signed_size_type const next_turn_index = get_next_turn_index(op);

            if (! result && traverse_possible(next_turn_index))
            {
                max_remaining_distance = op.remaining_distance;
                selected_op_index = i;
                debug_traverse(turn, op, " Candidate");
                result = true;
            }

            if (result)
            {
                if (next_turn_index == start_turn_index)
                {
                    selected_op_index = i;
                    debug_traverse(turn, op, " Candidate cc override (start)");
                }
                else if (op.remaining_distance > max_remaining_distance)
                {
                    max_remaining_distance = op.remaining_distance;
                    selected_op_index = i;
                    debug_traverse(turn, op, " Candidate cc override (remaining)");
                }
            }
        }

        return result;
    }

    inline
    bool select_noncc_operation(turn_type const& turn,
                signed_size_type turn_index,
                segment_identifier const& seg_id,
                int& selected_op_index) const
    {
        bool result = false;

        for (int i = 0; i < 2; i++)
        {
            turn_operation_type const& op = turn.operations[i];

            if (op.operation == target_operation
                && ! op.visited.finished()
                && (! result || select_source(turn_index, op.seg_id, seg_id)))
            {
                selected_op_index = i;
                debug_traverse(turn, op, " Candidate");
                result = true;
            }
        }

        return result;
    }

    inline
    bool select_operation(const turn_type& turn,
                signed_size_type turn_index,
                signed_size_type start_turn_index,
                segment_identifier const& previous_seg_id,
                int& selected_op_index) const
    {
        bool result = false;
        selected_op_index = -1;
        if (turn.both(operation_continue))
        {
            result = select_cc_operation(turn, start_turn_index,
                                         selected_op_index);
        }
        else
        {
            result = select_noncc_operation(turn, turn_index,
                                            previous_seg_id, selected_op_index);
        }
        if (result)
        {
           debug_traverse(turn, turn.operations[selected_op_index], " Accepted");
        }

        return result;
    }

    inline int starting_operation_index(const turn_type& turn) const
    {
        for (int i = 0; i < 2; i++)
        {
            if (turn.operations[i].visited.started())
            {
                return i;
            }
        }
        return -1;
    }

    inline bool both_finished(const turn_type& turn) const
    {
        for (int i = 0; i < 2; i++)
        {
            if (! turn.operations[i].visited.finished())
            {
                return false;
            }
        }
        return true;
    }

    inline bool select_from_cluster_union(signed_size_type& turn_index,
        int& op_index, signed_size_type start_turn_index,
        sbs_type const& sbs, bool is_touching) const
    {
        std::size_t selected_rank = 0;
        std::size_t min_rank = 0;
        bool result = false;
        for (std::size_t i = 0; i < sbs.m_ranked_points.size(); i++)
        {
            typename sbs_type::rp const& ranked_point = sbs.m_ranked_points[i];
            if (result && ranked_point.rank > selected_rank)
            {
                return result;
            }

            turn_type const& ranked_turn = m_turns[ranked_point.turn_index];
            turn_operation_type const& ranked_op = ranked_turn.operations[ranked_point.operation_index];

            if (result && ranked_op.visited.finalized())
            {
                // One of the arcs in the same direction as the selected result
                // is already traversed.
                return false;
            }

            if (! is_touching && ranked_op.visited.finalized())
            {
                // Skip this one, go to next
                min_rank = ranked_point.rank;
                continue;
            }

            if (ranked_point.direction == sort_by_side::dir_to
                && (ranked_point.rank > min_rank
                    || ranked_turn.both(operation_continue)))
            {
                if (ranked_op.enriched.count_left == 0
                     && ranked_op.enriched.count_right > 0)
                {
                    if (result && ranked_point.turn_index != start_turn_index)
                    {
                        // Don't override - only override if arrive at start
                        continue;
                    }

                    turn_index = ranked_point.turn_index;
                    op_index = ranked_point.operation_index;

                    result = true;
                    selected_rank = ranked_point.rank;
                }
                else if (! is_touching)
                {
                    return result;
                }
            }
        }
        return result;
    }

    inline bool analyze_cluster_intersection(signed_size_type& turn_index,
                int& op_index,
                sbs_type const& sbs) const
    {
        std::vector<sort_by_side::rank_with_rings> aggregation;
        sort_by_side::aggregate_operations(sbs, aggregation);

        std::size_t selected_rank = 0;

        for (std::size_t i = 0; i < aggregation.size(); i++)
        {
            sort_by_side::rank_with_rings const& rwr = aggregation[i];

            if (i > 1
                && i - 1 == selected_rank
                && rwr.rings.size() == 1)
            {
                sort_by_side::ring_with_direction const& rwd = *rwr.rings.begin();

                if (rwd.only_turn_on_ring)
                {
                    // Find if this arriving ring was leaving previously
                    sort_by_side::ring_with_direction leaving = rwd;
                    leaving.direction = sort_by_side::dir_to;

                    sort_by_side::rank_with_rings const& previous = aggregation[i - 1];

                    if (previous.rings.size() == 1
                        && previous.rings.count(leaving) == 1)
                    {
                        // It arrives back - if this is one of the selected, unselect it
                        selected_rank = 0;
                    }
                }
            }

            if (rwr.all_to())
            {
                if (selected_rank == 0)
                {
                    // Take the first (= right) where segments leave,
                    // having the polygon on the right side
                    selected_rank = rwr.rank;
                }
            }
        }

        if (selected_rank > 0)
        {
            std::size_t selected_index = sbs.m_ranked_points.size();
            for (std::size_t i = 0; i < sbs.m_ranked_points.size(); i++)
            {
                typename sbs_type::rp const& ranked_point = sbs.m_ranked_points[i];

                if (ranked_point.rank == selected_rank)
                {
                    turn_type const& ranked_turn = m_turns[ranked_point.turn_index];
                    turn_operation_type const& ranked_op = ranked_turn.operations[ranked_point.operation_index];

                    if (ranked_op.visited.finalized())
                    {
                        // This direction is already traveled before, the same
                        // cannot be traveled again
                        return false;
                    }

                    // Take the last turn from this rank
                    selected_index = i;
                }
            }

            if (selected_index < sbs.m_ranked_points.size())
            {
                typename sbs_type::rp const& ranked_point = sbs.m_ranked_points[selected_index];
                turn_index = ranked_point.turn_index;
                op_index = ranked_point.operation_index;
                return true;
            }
        }

        return false;
    }

    inline bool select_turn_from_cluster(signed_size_type& turn_index,
            int& op_index, bool& is_touching,
            signed_size_type start_turn_index,
            segment_identifier const& previous_seg_id,
            bool is_start) const
    {
        bool const is_union = target_operation == operation_union;

        turn_type const& turn = m_turns[turn_index];
        BOOST_ASSERT(turn.cluster_id >= 0);

        typename Clusters::const_iterator mit = m_clusters.find(turn.cluster_id);
        BOOST_ASSERT(mit != m_clusters.end());

        cluster_info const& cinfo = mit->second;
        std::set<signed_size_type> const& ids = cinfo.turn_indices;

        sbs_type sbs;

        bool has_origin = false;

        for (typename std::set<signed_size_type>::const_iterator sit = ids.begin();
             sit != ids.end(); ++sit)
        {
            signed_size_type cluster_turn_index = *sit;
            turn_type const& cluster_turn = m_turns[cluster_turn_index];
            if (cluster_turn.discarded)
            {
                // Defensive check, discarded turns should not be in cluster
                continue;
            }

            for (int i = 0; i < 2; i++)
            {
                turn_operation_type const& op = cluster_turn.operations[i];
                bool is_origin = false;
                if (cluster_turn_index == turn_index)
                {
                    // Check if this is the origin
                    if (OverlayType == overlay_buffer)
                    {
                        is_origin = op.seg_id.multi_index == previous_seg_id.multi_index;
                    }
                    else
                    {
                        is_origin = op.seg_id.source_index
                                    == previous_seg_id.source_index;
                    }
                    if (is_origin)
                    {
                        has_origin = true;
                    }
                }

                sbs.add(op, cluster_turn_index, i, m_geometry1, m_geometry2,
                        is_origin);
            }
        }

        if (! has_origin)
        {
            return false;
        }

        sbs.apply(turn.point);

        bool result = false;

        if (is_union)
        {
    #if defined(BOOST_GEOMETRY_DEBUG_TRAVERSAL_SWITCH_DETECTOR)
            is_touching = cinfo.open_count > 1;
            if (is_touching)
            {
                if (cinfo.switch_source)
                {
                    is_touching = false;
                    std::cout << "CLUSTER: SWITCH SOURCES at " << turn_index << std::endl;
                }
                else
                {
                    std::cout << "CLUSTER: CONTINUE at " << turn_index << std::endl;
                }
            }
    #else
            is_touching = cinfo.open_count > 1 && ! cinfo.switch_source;
    #endif

            if (is_touching)
            {
                sbs.reverse();
            }

            result = select_from_cluster_union(turn_index, op_index, start_turn_index, sbs,
                                       is_touching);
        }
        else
        {
            if (is_start
                && turn.both(operation_intersection)
                && turn.operations[op_index].enriched.only_turn_on_ring)
            {
                // For an ii (usually interior ring), only turn on ring,
                // reverse to take first exit
                sbs.reverse();
            }

            result = analyze_cluster_intersection(turn_index, op_index, sbs);
        }
        return result;
    }

    inline bool analyze_ii_intersection(signed_size_type& turn_index, int& op_index,
                    turn_type const& current_turn,
                    segment_identifier const& previous_seg_id)
    {
        sbs_type sbs;

        // Add this turn to the sort-by-side sorter
        bool has_origin = false;
        for (int i = 0; i < 2; i++)
        {
            turn_operation_type const& op = current_turn.operations[i];
            bool const is_origin = op.seg_id.source_index
                                   == previous_seg_id.source_index;
            has_origin = has_origin || is_origin;
            sbs.add(op, turn_index, i, m_geometry1, m_geometry2, is_origin);
        }

        if (! has_origin)
        {
            return false;
        }

        sbs.apply(current_turn.point);
        return analyze_cluster_intersection(turn_index, op_index, sbs);
    }

    inline void change_index_for_self_turn(signed_size_type& to_vertex_index,
                turn_type const& start_turn,
                turn_operation_type const& start_op,
                int start_op_index) const
    {
        if (OverlayType != overlay_buffer)
        {
            return;
        }

        // It travels to itself, can happen. If this is a buffer, it can
        // sometimes travel to itself in the following configuration:
        //
        // +---->--+
        // |       |
        // |   +---*----+ *: one turn, with segment index 2/7
        // |   |   |    |
        // |   +---C    | C: closing point (start/end)
        // |            |
        // +------------+
        //
        // If it starts on segment 2 and travels to itself on segment 2, that
        // should be corrected to 7 because that is the shortest path
        //
        // Also a uu turn (touching with another buffered ring) might have this
        // apparent configuration, but there it should
        // always travel the whole ring

        turn_operation_type const& other_op
                = start_turn.operations[1 - start_op_index];

        bool const correct
                = ! start_turn.both(operation_union)
                  && start_op.seg_id.segment_index == to_vertex_index;

#if defined(BOOST_GEOMETRY_DEBUG_TRAVERSE)
        std::cout << " WARNING: self-buffer "
                  << " correct=" << correct
                  << " turn=" << operation_char(start_turn.operations[0].operation)
                  << operation_char(start_turn.operations[1].operation)
                  << " start=" << start_op.seg_id.segment_index
                  << " from=" << to_vertex_index
                  << " to=" << other_op.enriched.travels_to_vertex_index
                  << std::endl;
#endif

        if (correct)
        {
            to_vertex_index = other_op.enriched.travels_to_vertex_index;
        }
    }

    bool select_turn_from_enriched(signed_size_type& turn_index,
            segment_identifier& previous_seg_id,
            signed_size_type& to_vertex_index,
            signed_size_type start_turn_index,
            int start_op_index,
            turn_type const& previous_turn,
            turn_operation_type const& previous_op,
            bool is_start) const
    {
        to_vertex_index = -1;

        if (previous_op.enriched.next_ip_index < 0)
        {
            // There is no next IP on this segment
            if (previous_op.enriched.travels_to_vertex_index < 0
                || previous_op.enriched.travels_to_ip_index < 0)
            {
                return false;
            }

            to_vertex_index = previous_op.enriched.travels_to_vertex_index;

            if (is_start &&
                    previous_op.enriched.travels_to_ip_index == start_turn_index)
            {
                change_index_for_self_turn(to_vertex_index, previous_turn,
                    previous_op, start_op_index);
            }

            turn_index = previous_op.enriched.travels_to_ip_index;
            previous_seg_id = previous_op.seg_id;
        }
        else
        {
            // Take the next IP on this segment
            turn_index = previous_op.enriched.next_ip_index;
            previous_seg_id = previous_op.seg_id;
        }
        return true;
    }

    bool select_turn(signed_size_type start_turn_index, int start_op_index,
                     signed_size_type& turn_index,
                     int& op_index,
                     bool& is_touching,
                     int previous_op_index,
                     signed_size_type previous_turn_index,
                     segment_identifier const& previous_seg_id,
                     bool is_start)
    {
        turn_type const& current_turn = m_turns[turn_index];

        if (target_operation == operation_intersection)
        {
            bool const back_at_start_cluster
                    = current_turn.cluster_id >= 0
                    && m_turns[start_turn_index].cluster_id == current_turn.cluster_id;

            if (turn_index == start_turn_index || back_at_start_cluster)
            {
                // Intersection can always be finished if returning
                turn_index = start_turn_index;
                op_index = start_op_index;
                return true;
            }

            if (current_turn.cluster_id < 0
                && current_turn.both(operation_intersection))
            {
                if (analyze_ii_intersection(turn_index, op_index, current_turn,
                            previous_seg_id))
                {
                    return true;
                }
            }
        }

        if (current_turn.cluster_id >= 0)
        {
            if (! select_turn_from_cluster(turn_index, op_index, is_touching,
                    start_turn_index, previous_seg_id, is_start))
            {
                return false;
            }

            if (is_start && turn_index == previous_turn_index)
            {
                op_index = previous_op_index;
            }
        }
        else
        {
            op_index = starting_operation_index(current_turn);
            if (op_index == -1)
            {
                if (both_finished(current_turn))
                {
                    return false;
                }

                if (! select_operation(current_turn, turn_index,
                                start_turn_index,
                                previous_seg_id,
                                op_index))
                {
                    return false;
                }
            }
        }
        return true;
    }

private :
    Geometry1 const& m_geometry1;
    Geometry2 const& m_geometry2;
    Turns& m_turns;
    Clusters const& m_clusters;
    RobustPolicy const& m_robust_policy;
    Visitor& m_visitor;
};



}} // namespace detail::overlay
#endif // DOXYGEN_NO_DETAIL

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_TRAVERSAL_HPP
