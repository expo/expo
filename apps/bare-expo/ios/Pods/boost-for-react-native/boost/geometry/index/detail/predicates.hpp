// Boost.Geometry Index
//
// Spatial query predicates definition and checks.
//
// Copyright (c) 2011-2015 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_DETAIL_PREDICATES_HPP
#define BOOST_GEOMETRY_INDEX_DETAIL_PREDICATES_HPP

//#include <utility>

#include <boost/mpl/assert.hpp>
#include <boost/tuple/tuple.hpp>

#include <boost/geometry/index/detail/tags.hpp>

namespace boost { namespace geometry { namespace index { namespace detail {

namespace predicates {

// ------------------------------------------------------------------ //
// predicates
// ------------------------------------------------------------------ //

template <typename Fun, bool IsFunction>
struct satisfies_impl
{
    satisfies_impl() : fun(NULL) {}
    satisfies_impl(Fun f) : fun(f) {}
    Fun * fun;
};

template <typename Fun>
struct satisfies_impl<Fun, false>
{
    satisfies_impl() {}
    satisfies_impl(Fun const& f) : fun(f) {}
    Fun fun;
};

template <typename Fun, bool Negated>
struct satisfies
    : satisfies_impl<Fun, ::boost::is_function<Fun>::value>
{
    typedef satisfies_impl<Fun, ::boost::is_function<Fun>::value> base;

    satisfies() {}
    satisfies(Fun const& f) : base(f) {}
    satisfies(base const& b) : base(b) {}
};

// ------------------------------------------------------------------ //

struct contains_tag {};
struct covered_by_tag {};
struct covers_tag {};
struct disjoint_tag {};
struct intersects_tag {};
struct overlaps_tag {};
struct touches_tag {};
struct within_tag {};

template <typename Geometry, typename Tag, bool Negated>
struct spatial_predicate
{
    spatial_predicate() {}
    spatial_predicate(Geometry const& g) : geometry(g) {}
    Geometry geometry;
};

// ------------------------------------------------------------------ //

// CONSIDER: separated nearest<> and path<> may be replaced by
//           nearest_predicate<Geometry, Tag>
//           where Tag = point_tag | path_tag
// IMPROVEMENT: user-defined nearest predicate allowing to define
//              all or only geometrical aspects of the search

template <typename PointOrRelation>
struct nearest
{
    nearest()
//        : count(0)
    {}
    nearest(PointOrRelation const& por, unsigned k)
        : point_or_relation(por)
        , count(k)
    {}
    PointOrRelation point_or_relation;
    unsigned count;
};

template <typename SegmentOrLinestring>
struct path
{
    path()
//        : count(0)
    {}
    path(SegmentOrLinestring const& g, unsigned k)
        : geometry(g)
        , count(k)
    {}
    SegmentOrLinestring geometry;
    unsigned count;
};

} // namespace predicates

// ------------------------------------------------------------------ //
// predicate_check
// ------------------------------------------------------------------ //

template <typename Predicate, typename Tag>
struct predicate_check
{
    BOOST_MPL_ASSERT_MSG(
        (false),
        NOT_IMPLEMENTED_FOR_THIS_PREDICATE_OR_TAG,
        (predicate_check));
};

// ------------------------------------------------------------------ //

template <typename Fun>
struct predicate_check<predicates::satisfies<Fun, false>, value_tag>
{
    template <typename Value, typename Indexable>
    static inline bool apply(predicates::satisfies<Fun, false> const& p, Value const& v, Indexable const&)
    {
        return p.fun(v);
    }
};

template <typename Fun>
struct predicate_check<predicates::satisfies<Fun, true>, value_tag>
{
    template <typename Value, typename Indexable>
    static inline bool apply(predicates::satisfies<Fun, true> const& p, Value const& v, Indexable const&)
    {
        return !p.fun(v);
    }
};

// ------------------------------------------------------------------ //

template <typename Tag>
struct spatial_predicate_call
{
    BOOST_MPL_ASSERT_MSG(false, NOT_IMPLEMENTED_FOR_THIS_TAG, (Tag));
};

template <>
struct spatial_predicate_call<predicates::contains_tag>
{
    template <typename G1, typename G2>
    static inline bool apply(G1 const& g1, G2 const& g2)
    {
        return geometry::within(g2, g1);
    }
};

template <>
struct spatial_predicate_call<predicates::covered_by_tag>
{
    template <typename G1, typename G2>
    static inline bool apply(G1 const& g1, G2 const& g2)
    {
        return geometry::covered_by(g1, g2);
    }
};

template <>
struct spatial_predicate_call<predicates::covers_tag>
{
    template <typename G1, typename G2>
    static inline bool apply(G1 const& g1, G2 const& g2)
    {
        return geometry::covered_by(g2, g1);
    }
};

template <>
struct spatial_predicate_call<predicates::disjoint_tag>
{
    template <typename G1, typename G2>
    static inline bool apply(G1 const& g1, G2 const& g2)
    {
        return geometry::disjoint(g1, g2);
    }
};

template <>
struct spatial_predicate_call<predicates::intersects_tag>
{
    template <typename G1, typename G2>
    static inline bool apply(G1 const& g1, G2 const& g2)
    {
        return geometry::intersects(g1, g2);
    }
};

template <>
struct spatial_predicate_call<predicates::overlaps_tag>
{
    template <typename G1, typename G2>
    static inline bool apply(G1 const& g1, G2 const& g2)
    {
        return geometry::overlaps(g1, g2);
    }
};

template <>
struct spatial_predicate_call<predicates::touches_tag>
{
    template <typename G1, typename G2>
    static inline bool apply(G1 const& g1, G2 const& g2)
    {
        return geometry::touches(g1, g2);
    }
};

template <>
struct spatial_predicate_call<predicates::within_tag>
{
    template <typename G1, typename G2>
    static inline bool apply(G1 const& g1, G2 const& g2)
    {
        return geometry::within(g1, g2);
    }
};

// ------------------------------------------------------------------ //

// spatial predicate
template <typename Geometry, typename Tag>
struct predicate_check<predicates::spatial_predicate<Geometry, Tag, false>, value_tag>
{
    typedef predicates::spatial_predicate<Geometry, Tag, false> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& p, Value const&, Indexable const& i)
    {
        return spatial_predicate_call<Tag>::apply(i, p.geometry);
    }
};

// negated spatial predicate
template <typename Geometry, typename Tag>
struct predicate_check<predicates::spatial_predicate<Geometry, Tag, true>, value_tag>
{
    typedef predicates::spatial_predicate<Geometry, Tag, true> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& p, Value const&, Indexable const& i)
    {
        return !spatial_predicate_call<Tag>::apply(i, p.geometry);
    }
};

// ------------------------------------------------------------------ //

template <typename DistancePredicates>
struct predicate_check<predicates::nearest<DistancePredicates>, value_tag>
{
    template <typename Value, typename Box>
    static inline bool apply(predicates::nearest<DistancePredicates> const&, Value const&, Box const&)
    {
        return true;
    }
};

template <typename Linestring>
struct predicate_check<predicates::path<Linestring>, value_tag>
{
    template <typename Value, typename Box>
    static inline bool apply(predicates::path<Linestring> const&, Value const&, Box const&)
    {
        return true;
    }
};

// ------------------------------------------------------------------ //
// predicates_check for bounds
// ------------------------------------------------------------------ //

template <typename Fun, bool Negated>
struct predicate_check<predicates::satisfies<Fun, Negated>, bounds_tag>
{
    template <typename Value, typename Box>
    static bool apply(predicates::satisfies<Fun, Negated> const&, Value const&, Box const&)
    {
        return true;
    }
};

// ------------------------------------------------------------------ //

// NOT NEGATED
// value_tag        bounds_tag
// ---------------------------
// contains(I,G)    covers(I,G)
// covered_by(I,G)  intersects(I,G)
// covers(I,G)      covers(I,G)
// disjoint(I,G)    !covered_by(I,G)
// intersects(I,G)  intersects(I,G)
// overlaps(I,G)    intersects(I,G)  - possibly change to the version without border case, e.g. intersects_without_border(0,0x1,1, 1,1x2,2) should give false
// touches(I,G)     intersects(I,G)
// within(I,G)      intersects(I,G)  - possibly change to the version without border case, e.g. intersects_without_border(0,0x1,1, 1,1x2,2) should give false

// spatial predicate - default
template <typename Geometry, typename Tag>
struct predicate_check<predicates::spatial_predicate<Geometry, Tag, false>, bounds_tag>
{
    typedef predicates::spatial_predicate<Geometry, Tag, false> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& p, Value const&, Indexable const& i)
    {
        return spatial_predicate_call<predicates::intersects_tag>::apply(i, p.geometry);
    }
};

// spatial predicate - contains
template <typename Geometry>
struct predicate_check<predicates::spatial_predicate<Geometry, predicates::contains_tag, false>, bounds_tag>
{
    typedef predicates::spatial_predicate<Geometry, predicates::contains_tag, false> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& p, Value const&, Indexable const& i)
    {
        return spatial_predicate_call<predicates::covers_tag>::apply(i, p.geometry);
    }
};

// spatial predicate - covers
template <typename Geometry>
struct predicate_check<predicates::spatial_predicate<Geometry, predicates::covers_tag, false>, bounds_tag>
{
    typedef predicates::spatial_predicate<Geometry, predicates::covers_tag, false> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& p, Value const&, Indexable const& i)
    {
        return spatial_predicate_call<predicates::covers_tag>::apply(i, p.geometry);
    }
};

// spatial predicate - disjoint
template <typename Geometry>
struct predicate_check<predicates::spatial_predicate<Geometry, predicates::disjoint_tag, false>, bounds_tag>
{
    typedef predicates::spatial_predicate<Geometry, predicates::disjoint_tag, false> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& p, Value const&, Indexable const& i)
    {
        return !spatial_predicate_call<predicates::covered_by_tag>::apply(i, p.geometry);
    }
};

// NEGATED
// value_tag        bounds_tag
// ---------------------------
// !contains(I,G)   TRUE
// !covered_by(I,G) !covered_by(I,G)
// !covers(I,G)     TRUE
// !disjoint(I,G)   !disjoint(I,G)
// !intersects(I,G) !covered_by(I,G)
// !overlaps(I,G)   TRUE
// !touches(I,G)    !intersects(I,G)
// !within(I,G)     !within(I,G)

// negated spatial predicate - default
template <typename Geometry, typename Tag>
struct predicate_check<predicates::spatial_predicate<Geometry, Tag, true>, bounds_tag>
{
    typedef predicates::spatial_predicate<Geometry, Tag, true> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& p, Value const&, Indexable const& i)
    {
        return !spatial_predicate_call<Tag>::apply(i, p.geometry);
    }
};

// negated spatial predicate - contains
template <typename Geometry>
struct predicate_check<predicates::spatial_predicate<Geometry, predicates::contains_tag, true>, bounds_tag>
{
    typedef predicates::spatial_predicate<Geometry, predicates::contains_tag, true> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& , Value const&, Indexable const& )
    {
        return true;
    }
};

// negated spatial predicate - covers
template <typename Geometry>
struct predicate_check<predicates::spatial_predicate<Geometry, predicates::covers_tag, true>, bounds_tag>
{
    typedef predicates::spatial_predicate<Geometry, predicates::covers_tag, true> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& , Value const&, Indexable const& )
    {
        return true;
    }
};

// negated spatial predicate - intersects
template <typename Geometry>
struct predicate_check<predicates::spatial_predicate<Geometry, predicates::intersects_tag, true>, bounds_tag>
{
    typedef predicates::spatial_predicate<Geometry, predicates::intersects_tag, true> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& p, Value const&, Indexable const& i)
    {
        return !spatial_predicate_call<predicates::covered_by_tag>::apply(i, p.geometry);
    }
};

// negated spatial predicate - overlaps
template <typename Geometry>
struct predicate_check<predicates::spatial_predicate<Geometry, predicates::overlaps_tag, true>, bounds_tag>
{
    typedef predicates::spatial_predicate<Geometry, predicates::overlaps_tag, true> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& , Value const&, Indexable const& )
    {
        return true;
    }
};

// negated spatial predicate - touches
template <typename Geometry>
struct predicate_check<predicates::spatial_predicate<Geometry, predicates::touches_tag, true>, bounds_tag>
{
    typedef predicates::spatial_predicate<Geometry, predicates::touches_tag, true> Pred;

    template <typename Value, typename Indexable>
    static inline bool apply(Pred const& p, Value const&, Indexable const& i)
    {
        return !spatial_predicate_call<predicates::intersects_tag>::apply(i, p.geometry);
    }
};

// ------------------------------------------------------------------ //

template <typename DistancePredicates>
struct predicate_check<predicates::nearest<DistancePredicates>, bounds_tag>
{
    template <typename Value, typename Box>
    static inline bool apply(predicates::nearest<DistancePredicates> const&, Value const&, Box const&)
    {
        return true;
    }
};

template <typename Linestring>
struct predicate_check<predicates::path<Linestring>, bounds_tag>
{
    template <typename Value, typename Box>
    static inline bool apply(predicates::path<Linestring> const&, Value const&, Box const&)
    {
        return true;
    }
};

// ------------------------------------------------------------------ //
// predicates_length
// ------------------------------------------------------------------ //

template <typename T>
struct predicates_length
{
    static const unsigned value = 1;
};

//template <typename F, typename S>
//struct predicates_length< std::pair<F, S> >
//{
//    static const unsigned value = 2;
//};

//template <typename T0, typename T1, typename T2, typename T3, typename T4, typename T5, typename T6, typename T7, typename T8, typename T9>
//struct predicates_length< boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> >
//{
//    static const unsigned value = boost::tuples::length< boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> >::value;
//};

template <typename Head, typename Tail>
struct predicates_length< boost::tuples::cons<Head, Tail> >
{
    static const unsigned value = boost::tuples::length< boost::tuples::cons<Head, Tail> >::value;
};

// ------------------------------------------------------------------ //
// predicates_element
// ------------------------------------------------------------------ //

template <unsigned I, typename T>
struct predicates_element
{
    BOOST_MPL_ASSERT_MSG((I < 1), INVALID_INDEX, (predicates_element));
    typedef T type;
    static type const& get(T const& p) { return p; }
};

//template <unsigned I, typename F, typename S>
//struct predicates_element< I, std::pair<F, S> >
//{
//    BOOST_MPL_ASSERT_MSG((I < 2), INVALID_INDEX, (predicates_element));
//
//    typedef F type;
//    static type const& get(std::pair<F, S> const& p) { return p.first; }
//};
//
//template <typename F, typename S>
//struct predicates_element< 1, std::pair<F, S> >
//{
//    typedef S type;
//    static type const& get(std::pair<F, S> const& p) { return p.second; }
//};
//
//template <unsigned I, typename T0, typename T1, typename T2, typename T3, typename T4, typename T5, typename T6, typename T7, typename T8, typename T9>
//struct predicates_element< I, boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> >
//{
//    typedef boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> predicate_type;
//
//    typedef typename boost::tuples::element<I, predicate_type>::type type;
//    static type const& get(predicate_type const& p) { return boost::get<I>(p); }
//};

template <unsigned I, typename Head, typename Tail>
struct predicates_element< I, boost::tuples::cons<Head, Tail> >
{
    typedef boost::tuples::cons<Head, Tail> predicate_type;

    typedef typename boost::tuples::element<I, predicate_type>::type type;
    static type const& get(predicate_type const& p) { return boost::get<I>(p); }
};

// ------------------------------------------------------------------ //
// predicates_check
// ------------------------------------------------------------------ //

//template <typename PairPredicates, typename Tag, unsigned First, unsigned Last>
//struct predicates_check_pair {};
//
//template <typename PairPredicates, typename Tag, unsigned I>
//struct predicates_check_pair<PairPredicates, Tag, I, I>
//{
//    template <typename Value, typename Indexable>
//    static inline bool apply(PairPredicates const& , Value const& , Indexable const& )
//    {
//        return true;
//    }
//};
//
//template <typename PairPredicates, typename Tag>
//struct predicates_check_pair<PairPredicates, Tag, 0, 1>
//{
//    template <typename Value, typename Indexable>
//    static inline bool apply(PairPredicates const& p, Value const& v, Indexable const& i)
//    {
//        return predicate_check<typename PairPredicates::first_type, Tag>::apply(p.first, v, i);
//    }
//};
//
//template <typename PairPredicates, typename Tag>
//struct predicates_check_pair<PairPredicates, Tag, 1, 2>
//{
//    template <typename Value, typename Indexable>
//    static inline bool apply(PairPredicates const& p, Value const& v, Indexable const& i)
//    {
//        return predicate_check<typename PairPredicates::second_type, Tag>::apply(p.second, v, i);
//    }
//};
//
//template <typename PairPredicates, typename Tag>
//struct predicates_check_pair<PairPredicates, Tag, 0, 2>
//{
//    template <typename Value, typename Indexable>
//    static inline bool apply(PairPredicates const& p, Value const& v, Indexable const& i)
//    {
//        return predicate_check<typename PairPredicates::first_type, Tag>::apply(p.first, v, i)
//            && predicate_check<typename PairPredicates::second_type, Tag>::apply(p.second, v, i);
//    }
//};

template <typename TuplePredicates, typename Tag, unsigned First, unsigned Last>
struct predicates_check_tuple
{
    template <typename Value, typename Indexable>
    static inline bool apply(TuplePredicates const& p, Value const& v, Indexable const& i)
    {
        return
        predicate_check<
            typename boost::tuples::element<First, TuplePredicates>::type,
            Tag
        >::apply(boost::get<First>(p), v, i) &&
        predicates_check_tuple<TuplePredicates, Tag, First+1, Last>::apply(p, v, i);
    }
};

template <typename TuplePredicates, typename Tag, unsigned First>
struct predicates_check_tuple<TuplePredicates, Tag, First, First>
{
    template <typename Value, typename Indexable>
    static inline bool apply(TuplePredicates const& , Value const& , Indexable const& )
    {
        return true;
    }
};

template <typename Predicate, typename Tag, unsigned First, unsigned Last>
struct predicates_check_impl
{
    static const bool check = First < 1 && Last <= 1 && First <= Last;
    BOOST_MPL_ASSERT_MSG((check), INVALID_INDEXES, (predicates_check_impl));

    template <typename Value, typename Indexable>
    static inline bool apply(Predicate const& p, Value const& v, Indexable const& i)
    {
        return predicate_check<Predicate, Tag>::apply(p, v, i);
    }
};

//template <typename Predicate1, typename Predicate2, typename Tag, size_t First, size_t Last>
//struct predicates_check_impl<std::pair<Predicate1, Predicate2>, Tag, First, Last>
//{
//    BOOST_MPL_ASSERT_MSG((First < 2 && Last <= 2 && First <= Last), INVALID_INDEXES, (predicates_check_impl));
//
//    template <typename Value, typename Indexable>
//    static inline bool apply(std::pair<Predicate1, Predicate2> const& p, Value const& v, Indexable const& i)
//    {
//        return predicate_check<Predicate1, Tag>::apply(p.first, v, i)
//            && predicate_check<Predicate2, Tag>::apply(p.second, v, i);
//    }
//};
//
//template <
//    typename T0, typename T1, typename T2, typename T3, typename T4,
//    typename T5, typename T6, typename T7, typename T8, typename T9,
//    typename Tag, unsigned First, unsigned Last
//>
//struct predicates_check_impl<
//    boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9>,
//    Tag, First, Last
//>
//{
//    typedef boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> predicates_type;
//
//    static const unsigned pred_len = boost::tuples::length<predicates_type>::value;
//    BOOST_MPL_ASSERT_MSG((First < pred_len && Last <= pred_len && First <= Last), INVALID_INDEXES, (predicates_check_impl));
//
//    template <typename Value, typename Indexable>
//    static inline bool apply(predicates_type const& p, Value const& v, Indexable const& i)
//    {
//        return predicates_check_tuple<
//            predicates_type,
//            Tag, First, Last
//        >::apply(p, v, i);
//    }
//};

template <typename Head, typename Tail, typename Tag, unsigned First, unsigned Last>
struct predicates_check_impl<
    boost::tuples::cons<Head, Tail>,
    Tag, First, Last
>
{
    typedef boost::tuples::cons<Head, Tail> predicates_type;

    static const unsigned pred_len = boost::tuples::length<predicates_type>::value;
    static const bool check = First < pred_len && Last <= pred_len && First <= Last;
    BOOST_MPL_ASSERT_MSG((check), INVALID_INDEXES, (predicates_check_impl));

    template <typename Value, typename Indexable>
    static inline bool apply(predicates_type const& p, Value const& v, Indexable const& i)
    {
        return predicates_check_tuple<
            predicates_type,
            Tag, First, Last
        >::apply(p, v, i);
    }
};

template <typename Tag, unsigned First, unsigned Last, typename Predicates, typename Value, typename Indexable>
inline bool predicates_check(Predicates const& p, Value const& v, Indexable const& i)
{
    return detail::predicates_check_impl<Predicates, Tag, First, Last>
        ::apply(p, v, i);
}

// ------------------------------------------------------------------ //
// nearest predicate helpers
// ------------------------------------------------------------------ //

// predicates_is_nearest

template <typename P>
struct predicates_is_distance
{
    static const unsigned value = 0;
};

template <typename DistancePredicates>
struct predicates_is_distance< predicates::nearest<DistancePredicates> >
{
    static const unsigned value = 1;
};

template <typename Linestring>
struct predicates_is_distance< predicates::path<Linestring> >
{
    static const unsigned value = 1;
};

// predicates_count_nearest

template <typename T>
struct predicates_count_distance
{
    static const unsigned value = predicates_is_distance<T>::value;
};

//template <typename F, typename S>
//struct predicates_count_distance< std::pair<F, S> >
//{
//    static const unsigned value = predicates_is_distance<F>::value
//                                + predicates_is_distance<S>::value;
//};

template <typename Tuple, unsigned N>
struct predicates_count_distance_tuple
{
    static const unsigned value =
        predicates_is_distance<typename boost::tuples::element<N-1, Tuple>::type>::value
        + predicates_count_distance_tuple<Tuple, N-1>::value;
};

template <typename Tuple>
struct predicates_count_distance_tuple<Tuple, 1>
{
    static const unsigned value =
        predicates_is_distance<typename boost::tuples::element<0, Tuple>::type>::value;
};

//template <typename T0, typename T1, typename T2, typename T3, typename T4, typename T5, typename T6, typename T7, typename T8, typename T9>
//struct predicates_count_distance< boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> >
//{
//    static const unsigned value = predicates_count_distance_tuple<
//        boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9>,
//        boost::tuples::length< boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> >::value
//    >::value;
//};

template <typename Head, typename Tail>
struct predicates_count_distance< boost::tuples::cons<Head, Tail> >
{
    static const unsigned value = predicates_count_distance_tuple<
        boost::tuples::cons<Head, Tail>,
        boost::tuples::length< boost::tuples::cons<Head, Tail> >::value
    >::value;
};

// predicates_find_nearest

template <typename T>
struct predicates_find_distance
{
    static const unsigned value = predicates_is_distance<T>::value ? 0 : 1;
};

//template <typename F, typename S>
//struct predicates_find_distance< std::pair<F, S> >
//{
//    static const unsigned value = predicates_is_distance<F>::value ? 0 :
//                                    (predicates_is_distance<S>::value ? 1 : 2);
//};

template <typename Tuple, unsigned N>
struct predicates_find_distance_tuple
{
    static const bool is_found = predicates_find_distance_tuple<Tuple, N-1>::is_found
                                || predicates_is_distance<typename boost::tuples::element<N-1, Tuple>::type>::value;

    static const unsigned value = predicates_find_distance_tuple<Tuple, N-1>::is_found ?
        predicates_find_distance_tuple<Tuple, N-1>::value :
        (predicates_is_distance<typename boost::tuples::element<N-1, Tuple>::type>::value ?
            N-1 : boost::tuples::length<Tuple>::value);
};

template <typename Tuple>
struct predicates_find_distance_tuple<Tuple, 1>
{
    static const bool is_found = predicates_is_distance<typename boost::tuples::element<0, Tuple>::type>::value;
    static const unsigned value = is_found ? 0 : boost::tuples::length<Tuple>::value;
};

//template <typename T0, typename T1, typename T2, typename T3, typename T4, typename T5, typename T6, typename T7, typename T8, typename T9>
//struct predicates_find_distance< boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> >
//{
//    static const unsigned value = predicates_find_distance_tuple<
//        boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9>,
//        boost::tuples::length< boost::tuple<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> >::value
//    >::value;
//};

template <typename Head, typename Tail>
struct predicates_find_distance< boost::tuples::cons<Head, Tail> >
{
    static const unsigned value = predicates_find_distance_tuple<
        boost::tuples::cons<Head, Tail>,
        boost::tuples::length< boost::tuples::cons<Head, Tail> >::value
    >::value;
};

}}}} // namespace boost::geometry::index::detail

#endif // BOOST_GEOMETRY_INDEX_DETAIL_PREDICATES_HPP
