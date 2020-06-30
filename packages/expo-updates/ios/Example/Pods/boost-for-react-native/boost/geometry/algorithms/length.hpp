// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2014 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2014 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2014 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2014, 2015.
// Modifications copyright (c) 2014-2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle
// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_LENGTH_HPP
#define BOOST_GEOMETRY_ALGORITHMS_LENGTH_HPP

#include <iterator>

#include <boost/concept_check.hpp>
#include <boost/core/ignore_unused.hpp>
#include <boost/mpl/fold.hpp>
#include <boost/mpl/greater.hpp>
#include <boost/mpl/if.hpp>
#include <boost/mpl/insert.hpp>
#include <boost/mpl/int.hpp>
#include <boost/mpl/set.hpp>
#include <boost/mpl/size.hpp>
#include <boost/mpl/transform.hpp>
#include <boost/range/begin.hpp>
#include <boost/range/end.hpp>
#include <boost/range/iterator.hpp>
#include <boost/range/value_type.hpp>
#include <boost/variant/apply_visitor.hpp>
#include <boost/variant/static_visitor.hpp>
#include <boost/variant/variant_fwd.hpp>

#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/closure.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/geometries/concepts/check.hpp>

#include <boost/geometry/algorithms/assign.hpp>
#include <boost/geometry/algorithms/detail/calculate_null.hpp>
#include <boost/geometry/algorithms/detail/multi_sum.hpp>
// #include <boost/geometry/algorithms/detail/throw_on_empty_input.hpp>
#include <boost/geometry/views/closeable_view.hpp>
#include <boost/geometry/strategies/distance.hpp>
#include <boost/geometry/strategies/default_length_result.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace length
{


template<typename Segment>
struct segment_length
{
    template <typename Strategy>
    static inline typename default_length_result<Segment>::type apply(
            Segment const& segment, Strategy const& strategy)
    {
        boost::ignore_unused(strategy);
        typedef typename point_type<Segment>::type point_type;
        point_type p1, p2;
        geometry::detail::assign_point_from_index<0>(segment, p1);
        geometry::detail::assign_point_from_index<1>(segment, p2);
        return strategy.apply(p1, p2);
    }
};

/*!
\brief Internal, calculates length of a linestring using iterator pairs and
    specified strategy
\note for_each could be used here, now that point_type is changed by boost
    range iterator
*/
template<typename Range, closure_selector Closure>
struct range_length
{
    typedef typename default_length_result<Range>::type return_type;

    template <typename Strategy>
    static inline return_type apply(
            Range const& range, Strategy const& strategy)
    {
        boost::ignore_unused(strategy);
        typedef typename closeable_view<Range const, Closure>::type view_type;
        typedef typename boost::range_iterator
            <
                view_type const
            >::type iterator_type;

        return_type sum = return_type();
        view_type view(range);
        iterator_type it = boost::begin(view), end = boost::end(view);
        if(it != end)
        {
            for(iterator_type previous = it++;
                    it != end;
                    ++previous, ++it)
            {
                // Add point-point distance using the return type belonging
                // to strategy
                sum += strategy.apply(*previous, *it);
            }
        }

        return sum;
    }
};


}} // namespace detail::length
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename Geometry, typename Tag = typename tag<Geometry>::type>
struct length : detail::calculate_null
{
    typedef typename default_length_result<Geometry>::type return_type;

    template <typename Strategy>
    static inline return_type apply(Geometry const& geometry, Strategy const& strategy)
    {
        return calculate_null::apply<return_type>(geometry, strategy);
    }
};


template <typename Geometry>
struct length<Geometry, linestring_tag>
    : detail::length::range_length<Geometry, closed>
{};


// RING: length is currently 0; it might be argued that it is the "perimeter"


template <typename Geometry>
struct length<Geometry, segment_tag>
    : detail::length::segment_length<Geometry>
{};


template <typename MultiLinestring>
struct length<MultiLinestring, multi_linestring_tag> : detail::multi_sum
{
    template <typename Strategy>
    static inline typename default_length_result<MultiLinestring>::type
    apply(MultiLinestring const& multi, Strategy const& strategy)
    {
        return multi_sum::apply
               <
                   typename default_length_result<MultiLinestring>::type,
                   detail::length::range_length
                   <
                       typename boost::range_value<MultiLinestring>::type,
                       closed // no need to close it explicitly
                   >
               >(multi, strategy);

    }
};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


namespace resolve_variant {

template <typename Geometry>
struct length
{
    template <typename Strategy>
    static inline typename default_length_result<Geometry>::type
    apply(Geometry const& geometry, Strategy const& strategy)
    {
        return dispatch::length<Geometry>::apply(geometry, strategy);
    }
};

template <BOOST_VARIANT_ENUM_PARAMS(typename T)>
struct length<boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)> >
{
    typedef typename default_length_result
        <
            boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)>
        >::type result_type;

    template <typename Strategy>
    struct visitor
        : static_visitor<result_type>
    {
        Strategy const& m_strategy;

        visitor(Strategy const& strategy)
            : m_strategy(strategy)
        {}

        template <typename Geometry>
        inline typename default_length_result<Geometry>::type
        operator()(Geometry const& geometry) const
        {
            return length<Geometry>::apply(geometry, m_strategy);
        }
    };

    template <typename Strategy>
    static inline result_type apply(
        variant<BOOST_VARIANT_ENUM_PARAMS(T)> const& geometry,
        Strategy const& strategy
    )
    {
        return boost::apply_visitor(visitor<Strategy>(strategy), geometry);
    }
};

} // namespace resolve_variant


/*!
\brief \brief_calc{length}
\ingroup length
\details \details_calc{length, length (the sum of distances between consecutive points)}. \details_default_strategy
\tparam Geometry \tparam_geometry
\param geometry \param_geometry
\return \return_calc{length}

\qbk{[include reference/algorithms/length.qbk]}
\qbk{[length] [length_output]}
 */
template<typename Geometry>
inline typename default_length_result<Geometry>::type
length(Geometry const& geometry)
{
    concepts::check<Geometry const>();

    // detail::throw_on_empty_input(geometry);

    // TODO put this into a resolve_strategy stage
    typedef typename strategy::distance::services::default_strategy
        <
            point_tag, point_tag, typename point_type<Geometry>::type
        >::type strategy_type;

    return resolve_variant::length<Geometry>::apply(geometry, strategy_type());
}


/*!
\brief \brief_calc{length} \brief_strategy
\ingroup length
\details \details_calc{length, length (the sum of distances between consecutive points)} \brief_strategy. \details_strategy_reasons
\tparam Geometry \tparam_geometry
\tparam Strategy \tparam_strategy{distance}
\param geometry \param_geometry
\param strategy \param_strategy{distance}
\return \return_calc{length}

\qbk{distinguish,with strategy}
\qbk{[include reference/algorithms/length.qbk]}
\qbk{[length_with_strategy] [length_with_strategy_output]}
 */
template<typename Geometry, typename Strategy>
inline typename default_length_result<Geometry>::type
length(Geometry const& geometry, Strategy const& strategy)
{
    concepts::check<Geometry const>();

    // detail::throw_on_empty_input(geometry);

    return resolve_variant::length<Geometry>::apply(geometry, strategy);
}


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_LENGTH_HPP
