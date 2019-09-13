// Boost.Geometry Index
//
// Spatial query predicates
//
// Copyright (c) 2011-2015 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_PREDICATES_HPP
#define BOOST_GEOMETRY_INDEX_PREDICATES_HPP

#include <boost/geometry/index/detail/predicates.hpp>
#include <boost/geometry/index/detail/tuples.hpp>

/*!
\defgroup predicates Predicates (boost::geometry::index::)
*/

namespace boost { namespace geometry { namespace index {

/*!
\brief Generate \c contains() predicate.

Generate a predicate defining Value and Geometry relationship.
Value will be returned by the query if <tt>bg::within(Geometry, Indexable)</tt>
returns true.

\par Example
\verbatim
bgi::query(spatial_index, bgi::contains(box), std::back_inserter(result));
\endverbatim

\ingroup predicates

\tparam Geometry    The Geometry type.

\param g            The Geometry object.
*/
template <typename Geometry> inline
detail::predicates::spatial_predicate<Geometry, detail::predicates::contains_tag, false>
contains(Geometry const& g)
{
    return detail::predicates::spatial_predicate
                <
                    Geometry,
                    detail::predicates::contains_tag,
                    false
                >(g);
}

/*!
\brief Generate \c covered_by() predicate.

Generate a predicate defining Value and Geometry relationship.
Value will be returned by the query if <tt>bg::covered_by(Indexable, Geometry)</tt>
returns true.

\par Example
\verbatim
bgi::query(spatial_index, bgi::covered_by(box), std::back_inserter(result));
\endverbatim

\ingroup predicates

\tparam Geometry    The Geometry type.

\param g            The Geometry object.
*/
template <typename Geometry> inline
detail::predicates::spatial_predicate<Geometry, detail::predicates::covered_by_tag, false>
covered_by(Geometry const& g)
{
    return detail::predicates::spatial_predicate
                <
                    Geometry,
                    detail::predicates::covered_by_tag,
                    false
                >(g);
}

/*!
\brief Generate \c covers() predicate.

Generate a predicate defining Value and Geometry relationship.
Value will be returned by the query if <tt>bg::covered_by(Geometry, Indexable)</tt>
returns true.

\par Example
\verbatim
bgi::query(spatial_index, bgi::covers(box), std::back_inserter(result));
\endverbatim

\ingroup predicates

\tparam Geometry    The Geometry type.

\param g            The Geometry object.
*/
template <typename Geometry> inline
detail::predicates::spatial_predicate<Geometry, detail::predicates::covers_tag, false>
covers(Geometry const& g)
{
    return detail::predicates::spatial_predicate
                <
                    Geometry,
                    detail::predicates::covers_tag,
                    false
                >(g);
}

/*!
\brief Generate \c disjoint() predicate.

Generate a predicate defining Value and Geometry relationship.
Value will be returned by the query if <tt>bg::disjoint(Indexable, Geometry)</tt>
returns true.

\par Example
\verbatim
bgi::query(spatial_index, bgi::disjoint(box), std::back_inserter(result));
\endverbatim

\ingroup predicates

\tparam Geometry    The Geometry type.

\param g            The Geometry object.
*/
template <typename Geometry> inline
detail::predicates::spatial_predicate<Geometry, detail::predicates::disjoint_tag, false>
disjoint(Geometry const& g)
{
    return detail::predicates::spatial_predicate
                <
                    Geometry,
                    detail::predicates::disjoint_tag,
                    false
                >(g);
}

/*!
\brief Generate \c intersects() predicate.

Generate a predicate defining Value and Geometry relationship.
Value will be returned by the query if <tt>bg::intersects(Indexable, Geometry)</tt>
returns true.

\par Example
\verbatim
bgi::query(spatial_index, bgi::intersects(box), std::back_inserter(result));
bgi::query(spatial_index, bgi::intersects(ring), std::back_inserter(result));
bgi::query(spatial_index, bgi::intersects(polygon), std::back_inserter(result));
\endverbatim

\ingroup predicates

\tparam Geometry    The Geometry type.

\param g            The Geometry object.
*/
template <typename Geometry> inline
detail::predicates::spatial_predicate<Geometry, detail::predicates::intersects_tag, false>
intersects(Geometry const& g)
{
    return detail::predicates::spatial_predicate
                <
                    Geometry,
                    detail::predicates::intersects_tag,
                    false
                >(g);
}

/*!
\brief Generate \c overlaps() predicate.

Generate a predicate defining Value and Geometry relationship.
Value will be returned by the query if <tt>bg::overlaps(Indexable, Geometry)</tt>
returns true.

\par Example
\verbatim
bgi::query(spatial_index, bgi::overlaps(box), std::back_inserter(result));
\endverbatim

\ingroup predicates

\tparam Geometry    The Geometry type.

\param g            The Geometry object.
*/
template <typename Geometry> inline
detail::predicates::spatial_predicate<Geometry, detail::predicates::overlaps_tag, false>
overlaps(Geometry const& g)
{
    return detail::predicates::spatial_predicate
                <
                    Geometry,
                    detail::predicates::overlaps_tag,
                    false
                >(g);
}

#ifdef BOOST_GEOMETRY_INDEX_DETAIL_EXPERIMENTAL

/*!
\brief Generate \c touches() predicate.

Generate a predicate defining Value and Geometry relationship.
Value will be returned by the query if <tt>bg::touches(Indexable, Geometry)</tt>
returns true.

\ingroup predicates

\tparam Geometry    The Geometry type.

\param g            The Geometry object.
*/
template <typename Geometry> inline
detail::predicates::spatial_predicate<Geometry, detail::predicates::touches_tag, false>
touches(Geometry const& g)
{
    return detail::predicates::spatial_predicate
                <
                    Geometry,
                    detail::predicates::touches_tag,
                    false
                >(g);
}

#endif // BOOST_GEOMETRY_INDEX_DETAIL_EXPERIMENTAL

/*!
\brief Generate \c within() predicate.

Generate a predicate defining Value and Geometry relationship.
Value will be returned by the query if <tt>bg::within(Indexable, Geometry)</tt>
returns true.

\par Example
\verbatim
bgi::query(spatial_index, bgi::within(box), std::back_inserter(result));
\endverbatim

\ingroup predicates

\tparam Geometry    The Geometry type.

\param g            The Geometry object.
*/
template <typename Geometry> inline
detail::predicates::spatial_predicate<Geometry, detail::predicates::within_tag, false>
within(Geometry const& g)
{
    return detail::predicates::spatial_predicate
                <
                    Geometry,
                    detail::predicates::within_tag,
                    false
                >(g);
}

/*!
\brief Generate satisfies() predicate.

A wrapper around user-defined UnaryPredicate checking if Value should be returned by spatial query.

\par Example
\verbatim
bool is_red(Value const& v) { return v.is_red(); }

struct is_red_o {
template <typename Value> bool operator()(Value const& v) { return v.is_red(); }
}

// ...

rt.query(index::intersects(box) && index::satisfies(is_red),
std::back_inserter(result));

rt.query(index::intersects(box) && index::satisfies(is_red_o()),
std::back_inserter(result));

#ifndef BOOST_NO_CXX11_LAMBDAS
rt.query(index::intersects(box) && index::satisfies([](Value const& v) { return v.is_red(); }),
std::back_inserter(result));
#endif
\endverbatim

\ingroup predicates

\tparam UnaryPredicate  A type of unary predicate function or function object.

\param pred             The unary predicate function or function object.
*/
template <typename UnaryPredicate> inline
detail::predicates::satisfies<UnaryPredicate, false>
satisfies(UnaryPredicate const& pred)
{
    return detail::predicates::satisfies<UnaryPredicate, false>(pred);
}

/*!
\brief Generate nearest() predicate.

When nearest predicate is passed to the query, k-nearest neighbour search will be performed.
\c nearest() predicate takes a \c Geometry from which distances to \c Values are calculated
and the maximum number of \c Values that should be returned. Internally
boost::geometry::comparable_distance() is used to perform the calculation.

\par Example
\verbatim
bgi::query(spatial_index, bgi::nearest(pt, 5), std::back_inserter(result));
bgi::query(spatial_index, bgi::nearest(pt, 5) && bgi::intersects(box), std::back_inserter(result));
bgi::query(spatial_index, bgi::nearest(box, 5), std::back_inserter(result));
\endverbatim

\warning
Only one \c nearest() predicate may be used in a query.

\ingroup predicates

\param geometry     The geometry from which distance is calculated.
\param k            The maximum number of values to return.
*/
template <typename Geometry> inline
detail::predicates::nearest<Geometry>
nearest(Geometry const& geometry, unsigned k)
{
    return detail::predicates::nearest<Geometry>(geometry, k);
}

#ifdef BOOST_GEOMETRY_INDEX_DETAIL_EXPERIMENTAL

/*!
\brief Generate path() predicate.

When path predicate is passed to the query, the returned values are k values along the path closest to
its begin. \c path() predicate takes a \c Segment or a \c Linestring defining the path and the maximum
number of \c Values that should be returned.

\par Example
\verbatim
bgi::query(spatial_index, bgi::path(segment, 5), std::back_inserter(result));
bgi::query(spatial_index, bgi::path(linestring, 5) && bgi::intersects(box), std::back_inserter(result));
\endverbatim

\warning
Only one distance predicate (\c nearest() or \c path()) may be used in a query.

\ingroup predicates

\param linestring   The path along which distance is calculated.
\param k            The maximum number of values to return.
*/
template <typename SegmentOrLinestring> inline
detail::predicates::path<SegmentOrLinestring>
path(SegmentOrLinestring const& linestring, unsigned k)
{
    return detail::predicates::path<SegmentOrLinestring>(linestring, k);
}

#endif // BOOST_GEOMETRY_INDEX_DETAIL_EXPERIMENTAL

namespace detail { namespace predicates {

// operator! generators

template <typename Fun, bool Negated> inline
satisfies<Fun, !Negated>
operator!(satisfies<Fun, Negated> const& p)
{
    return satisfies<Fun, !Negated>(p);
}

template <typename Geometry, typename Tag, bool Negated> inline
spatial_predicate<Geometry, Tag, !Negated>
operator!(spatial_predicate<Geometry, Tag, Negated> const& p)
{
    return spatial_predicate<Geometry, Tag, !Negated>(p.geometry);
}

// operator&& generators

template <typename Pred1, typename Pred2> inline
boost::tuples::cons<
    Pred1,
    boost::tuples::cons<Pred2, boost::tuples::null_type>
>
operator&&(Pred1 const& p1, Pred2 const& p2)
{
    /*typedef typename boost::mpl::if_c<is_predicate<Pred1>::value, Pred1, Pred1 const&>::type stored1;
    typedef typename boost::mpl::if_c<is_predicate<Pred2>::value, Pred2, Pred2 const&>::type stored2;*/
    namespace bt = boost::tuples;

    return
    bt::cons< Pred1, bt::cons<Pred2, bt::null_type> >
        ( p1, bt::cons<Pred2, bt::null_type>(p2, bt::null_type()) );
}

template <typename Head, typename Tail, typename Pred> inline
typename tuples::push_back<
    boost::tuples::cons<Head, Tail>, Pred
>::type
operator&&(boost::tuples::cons<Head, Tail> const& t, Pred const& p)
{
    //typedef typename boost::mpl::if_c<is_predicate<Pred>::value, Pred, Pred const&>::type stored;
    namespace bt = boost::tuples;

    return
    tuples::push_back<
        bt::cons<Head, Tail>, Pred
    >::apply(t, p);
}
    
}} // namespace detail::predicates

}}} // namespace boost::geometry::index

#endif // BOOST_GEOMETRY_INDEX_PREDICATES_HPP
