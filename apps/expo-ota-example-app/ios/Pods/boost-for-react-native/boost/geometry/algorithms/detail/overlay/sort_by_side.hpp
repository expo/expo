// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_SORT_BY_SIDE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_SORT_BY_SIDE_HPP

#include <algorithm>
#include <vector>

#include <boost/geometry/algorithms/detail/direction_code.hpp>
#include <boost/geometry/algorithms/detail/overlay/turn_info.hpp>
#include <boost/geometry/strategies/side.hpp>

namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace overlay { namespace sort_by_side
{

enum direction_type { dir_unknown = -1, dir_from = 0, dir_to = 1 };

// Point-wrapper, adding some properties
template <typename Point>
struct ranked_point
{
    ranked_point()
        : rank(0)
        , turn_index(-1)
        , operation_index(-1)
        , direction(dir_unknown)
        , count_left(0)
        , count_right(0)
        , operation(operation_none)
        , only_turn_on_ring(false)
    {}

    template <typename Op>
    ranked_point(const Point& p, signed_size_type ti, int oi,
                 direction_type d, Op op)
        : point(p)
        , rank(0)
        , zone(-1)
        , turn_index(ti)
        , operation_index(oi)
        , direction(d)
        , count_left(0)
        , count_right(0)
        , operation(op.operation)
        , seg_id(op.seg_id)
        , only_turn_on_ring(op.enriched.only_turn_on_ring)
    {}

    Point point;
    std::size_t rank;
    signed_size_type zone; // index of closed zone, in uu turn there would be 2 zones
    signed_size_type turn_index;
    int operation_index; // 0,1
    direction_type direction;
    std::size_t count_left;
    std::size_t count_right;
    operation_type operation;
    segment_identifier seg_id;
    bool only_turn_on_ring;
};

struct less_by_turn_index
{
    template <typename T>
    inline bool operator()(const T& first, const T& second) const
    {
        return first.turn_index == second.turn_index
            ? first.index < second.index
            : first.turn_index < second.turn_index
            ;
    }
};

struct less_by_index
{
    template <typename T>
    inline bool operator()(const T& first, const T& second) const
    {
        // First order by from/to
        if (first.direction != second.direction)
        {
            return first.direction < second.direction;
        }
        // All the same, order by turn index (we might consider length too)
        return first.turn_index < second.turn_index;
    }
};

struct less_false
{
    template <typename T>
    inline bool operator()(const T&, const T& ) const
    {
        return false;
    }
};

template <typename Point, typename LessOnSame, typename Compare>
struct less_by_side
{
    typedef typename strategy::side::services::default_strategy
        <
            typename cs_tag<Point>::type
        >::type side;

    less_by_side(const Point& p1, const Point& p2)
        : m_p1(p1)
        , m_p2(p2)
    {}

    template <typename T>
    inline bool operator()(const T& first, const T& second) const
    {
        LessOnSame on_same;
        Compare compare;

        int const side_first = side::apply(m_p1, m_p2, first.point);
        int const side_second = side::apply(m_p1, m_p2, second.point);

        if (side_first == 0 && side_second == 0)
        {
            // Both collinear. They might point into different directions: <------*------>
            // If so, order the one going backwards as the very first.

            int const first_code = direction_code(m_p1, m_p2, first.point);
            int const second_code = direction_code(m_p1, m_p2, second.point);

            // Order by code, backwards first, then forward.
            return first_code != second_code
                ? first_code < second_code
                : on_same(first, second)
                ;
        }
        else if (side_first == 0
                && direction_code(m_p1, m_p2, first.point) == -1)
        {
            // First collinear and going backwards.
            // Order as the very first, so return always true
            return true;
        }
        else if (side_second == 0
            && direction_code(m_p1, m_p2, second.point) == -1)
        {
            // Second is collinear and going backwards
            // Order as very last, so return always false
            return false;
        }

        // They are not both collinear

        if (side_first != side_second)
        {
            return compare(side_first, side_second);
        }

        // They are both left, both right, and/or both collinear (with each other and/or with p1,p2)
        // Check mutual side
        int const side_second_wrt_first = side::apply(m_p2, first.point, second.point);

        if (side_second_wrt_first == 0)
        {
            return on_same(first, second);
        }

        int const side_first_wrt_second = -side_second_wrt_first;

        // Both are on same side, and not collinear
        // Union: return true if second is right w.r.t. first, so -1,
        // so other is 1. union has greater as compare functor
        // Intersection: v.v.
        return compare(side_first_wrt_second, side_second_wrt_first);
    }

private :
    Point m_p1, m_p2;
};

// Sorts vectors in counter clockwise order (by default)
template <bool Reverse1, bool Reverse2, typename Point, typename Compare>
struct side_sorter
{
    typedef ranked_point<Point> rp;

private :
    struct include_union
    {
        inline bool operator()(rp const& ranked_point) const
        {
            // New candidate if there are no polygons on left side,
            // but there are on right side
            return ranked_point.count_left == 0
                && ranked_point.count_right > 0;
        }
    };

    struct include_intersection
    {
        inline bool operator()(rp const& ranked_point) const
        {
            // New candidate if there are two polygons on right side,
            // and less on the left side
            return ranked_point.count_left < 2
                && ranked_point.count_right >= 2;
        }
    };

public :
    inline void set_origin(Point const& origin)
    {
        m_origin = origin;
    }

    template <typename Operation, typename Geometry1, typename Geometry2>
    void add(Operation const& op, signed_size_type turn_index, signed_size_type op_index,
            Geometry1 const& geometry1,
            Geometry2 const& geometry2,
            bool is_origin)
    {
        Point point1, point2, point3;
        geometry::copy_segment_points<Reverse1, Reverse2>(geometry1, geometry2,
                op.seg_id, point1, point2, point3);
        Point const& point_to = op.fraction.is_one() ? point3 : point2;

        m_ranked_points.push_back(rp(point1, turn_index, op_index, dir_from, op));
        m_ranked_points.push_back(rp(point_to, turn_index, op_index, dir_to, op));

        if (is_origin)
        {
            m_origin = point1;
        }
    }

    void apply(Point const& turn_point)
    {
        // We need three compare functors:
        // 1) to order clockwise (union) or counter clockwise (intersection)
        // 2) to order by side, resulting in unique ranks for all points
        // 3) to order by side, resulting in non-unique ranks
        //    to give colinear points

        // Sort by side and assign rank
        less_by_side<Point, less_by_index, Compare> less_unique(m_origin, turn_point);
        less_by_side<Point, less_false, Compare> less_non_unique(m_origin, turn_point);

        std::sort(m_ranked_points.begin(), m_ranked_points.end(), less_unique);

        std::size_t colinear_rank = 0;
        for (std::size_t i = 0; i < m_ranked_points.size(); i++)
        {
            if (i > 0
                && less_non_unique(m_ranked_points[i - 1], m_ranked_points[i]))
            {
                // It is not collinear
                colinear_rank++;
            }

            m_ranked_points[i].rank = colinear_rank;
        }
    }

    template <signed_size_type segment_identifier::*Member, typename Map>
    void find_open_generic(Map& handled)
    {
        for (std::size_t i = 0; i < m_ranked_points.size(); i++)
        {
            const rp& ranked = m_ranked_points[i];
            if (ranked.direction != dir_from)
            {
                continue;
            }

            signed_size_type const& index = ranked.seg_id.*Member;
            if (! handled[index])
            {
                find_polygons_for_source<Member>(index, i);
                handled[index] = true;
            }
        }
    }

    void find_open()
    {
        // TODO: we might pass Buffer as overlay_type, instead on the fly below
        bool one_source = true;
        for (std::size_t i = 0; i < m_ranked_points.size(); i++)
        {
            const rp& ranked = m_ranked_points[i];
            signed_size_type const& src = ranked.seg_id.source_index;
            if (src != 0)
            {
                one_source = false;
                break;
            }
        }

        if (one_source)
        {
            // by multi index
            std::map<signed_size_type, bool> handled;
            find_open_generic
                <
                    &segment_identifier::piece_index
                >(handled);
        }
        else
        {
            // by source (there should only source 0,1) TODO assert this
            bool handled[2] = {false, false};
            find_open_generic
                <
                    &segment_identifier::source_index
                >(handled);
        }
    }

    void reverse()
    {
        if (m_ranked_points.empty())
        {
            return;
        }

        std::size_t const last = 1 + m_ranked_points.back().rank;

        // Move iterator after rank==0
        bool has_first = false;
        typename container_type::iterator it = m_ranked_points.begin() + 1;
        for (; it != m_ranked_points.end() && it->rank == 0; ++it)
        {
            has_first = true;
        }

        if (has_first)
        {
            // Reverse first part (having rank == 0), if any,
            // but skip the very first row
            std::reverse(m_ranked_points.begin() + 1, it);
            for (typename container_type::iterator fit = m_ranked_points.begin();
                 fit != it; ++fit)
            {
                BOOST_ASSERT(fit->rank == 0);
            }
        }

        // Reverse the rest (main rank > 0)
        std::reverse(it, m_ranked_points.end());
        for (; it != m_ranked_points.end(); ++it)
        {
            BOOST_ASSERT(it->rank > 0);
            it->rank = last - it->rank;
        }
    }

//private :

    typedef std::vector<rp> container_type;
    container_type m_ranked_points;
    Point m_origin;

private :

    //! Check how many open spaces there are
    template <typename Include>
    inline std::size_t open_count(Include const& include_functor) const
    {
        std::size_t result = 0;
        std::size_t last_rank = 0;
        for (std::size_t i = 0; i < m_ranked_points.size(); i++)
        {
            rp const& ranked_point = m_ranked_points[i];

            if (ranked_point.rank > last_rank
                && ranked_point.direction == sort_by_side::dir_to
                && include_functor(ranked_point))
            {
                result++;
                last_rank = ranked_point.rank;
            }
        }
        return result;
    }

    std::size_t move(std::size_t index) const
    {
        std::size_t const result = index + 1;
        return result >= m_ranked_points.size() ? 0 : result;
    }

    //! member is pointer to member (source_index or multi_index)
    template <signed_size_type segment_identifier::*Member>
    std::size_t move(signed_size_type member_index, std::size_t index) const
    {
        std::size_t result = move(index);
        while (m_ranked_points[result].seg_id.*Member != member_index)
        {
            result = move(result);
        }
        return result;
    }

    void assign_ranks(std::size_t min_rank, std::size_t max_rank, int side_index)
    {
        for (std::size_t i = 0; i < m_ranked_points.size(); i++)
        {
            rp& ranked = m_ranked_points[i];
            // Suppose there are 8 ranks, if min=4,max=6: assign 4,5,6
            // if min=5,max=2: assign from 5,6,7,1,2
            bool const in_range
                = max_rank >= min_rank
                ? ranked.rank >= min_rank && ranked.rank <= max_rank
                : ranked.rank >= min_rank || ranked.rank <= max_rank
                ;

            if (in_range)
            {
                if (side_index == 1)
                {
                    ranked.count_left++;
                }
                else if (side_index == 2)
                {
                    ranked.count_right++;
                }
            }
        }
    }

    template <signed_size_type segment_identifier::*Member>
    void find_polygons_for_source(signed_size_type the_index,
                std::size_t start_index)
    {
        int state = 1; // 'closed', because start_index is "from", arrives at the turn
        std::size_t last_from_rank = m_ranked_points[start_index].rank;
        std::size_t previous_rank = m_ranked_points[start_index].rank;

        for (std::size_t index = move<Member>(the_index, start_index);
             ;
             index = move<Member>(the_index, index))
        {
            rp& ranked = m_ranked_points[index];

            if (ranked.rank != previous_rank && state == 0)
            {
                assign_ranks(last_from_rank, previous_rank - 1, 1);
                assign_ranks(last_from_rank + 1, previous_rank, 2);
            }

            if (index == start_index)
            {
                return;
            }

            if (ranked.direction == dir_from)
            {
                last_from_rank = ranked.rank;
                state++;
            }
            else if (ranked.direction == dir_to)
            {
                state--;
            }

            previous_rank = ranked.rank;
        }
    }

    //! Find closed zones and assign it
    template <typename Include>
    std::size_t assign_zones(Include const& include_functor)
    {
        // Find a starting point (the first rank after an outgoing rank
        // with no polygons on the left side)
        std::size_t start_rank = m_ranked_points.size() + 1;
        std::size_t start_index = 0;
        std::size_t max_rank = 0;
        for (std::size_t i = 0; i < m_ranked_points.size(); i++)
        {
            rp const& ranked_point = m_ranked_points[i];
            if (ranked_point.rank > max_rank)
            {
                max_rank = ranked_point.rank;
            }
            if (ranked_point.direction == sort_by_side::dir_to
                && include_functor(ranked_point))
            {
                start_rank = ranked_point.rank + 1;
            }
            if (ranked_point.rank == start_rank && start_index == 0)
            {
                start_index = i;
            }
        }

        // Assign the zones
        std::size_t const undefined_rank = max_rank + 1;
        std::size_t zone_id = 0;
        std::size_t last_rank = 0;
        std::size_t rank_at_next_zone = undefined_rank;
        std::size_t index = start_index;
        for (std::size_t i = 0; i < m_ranked_points.size(); i++)
        {
            rp& ranked_point = m_ranked_points[index];

            // Implement cyclic behavior
            index++;
            if (index == m_ranked_points.size())
            {
                index = 0;
            }

            if (ranked_point.rank != last_rank)
            {
                if (ranked_point.rank == rank_at_next_zone)
                {
                    zone_id++;
                    rank_at_next_zone = undefined_rank;
                }

                if (ranked_point.direction == sort_by_side::dir_to
                    && include_functor(ranked_point))
                {
                    rank_at_next_zone = ranked_point.rank + 1;
                    if (rank_at_next_zone > max_rank)
                    {
                        rank_at_next_zone = 0;
                    }
                }

                last_rank = ranked_point.rank;
            }

            ranked_point.zone = zone_id;
        }
        return zone_id;
    }

public :
    inline std::size_t open_count(operation_type for_operation) const
    {
        return for_operation == operation_union
            ? open_count(include_union())
            : open_count(include_intersection())
            ;
    }

    inline std::size_t assign_zones(operation_type for_operation)
    {
        return for_operation == operation_union
            ? assign_zones(include_union())
            : assign_zones(include_intersection())
            ;
    }

};


}}} // namespace detail::overlay::sort_by_side
#endif //DOXYGEN_NO_DETAIL


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_SORT_BY_SIDE_HPP
