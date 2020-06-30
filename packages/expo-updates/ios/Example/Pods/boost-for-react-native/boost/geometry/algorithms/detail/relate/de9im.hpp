// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2013, 2014, 2015.
// Modifications copyright (c) 2013-2015 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_DE9IM_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_DE9IM_HPP

#include <boost/mpl/is_sequence.hpp>
#include <boost/mpl/push_back.hpp>
#include <boost/mpl/vector.hpp>
#include <boost/mpl/vector_c.hpp>
#include <boost/static_assert.hpp>
#include <boost/tuple/tuple.hpp>

#include <boost/geometry/algorithms/detail/relate/result.hpp>
#include <boost/geometry/algorithms/not_implemented.hpp>
#include <boost/geometry/core/topological_dimension.hpp>
#include <boost/geometry/core/tag.hpp>

// TEMP - move this header to geometry/detail
#include <boost/geometry/index/detail/tuples.hpp>

namespace boost { namespace geometry
{
    
namespace de9im
{

/*!
\brief DE-9IM model intersection matrix.
\ingroup de9im
\details This matrix can be used to express spatial relations as defined in
         Dimensionally Extended 9-Intersection Model.

\qbk{[heading See also]}
\qbk{* [link geometry.reference.algorithms.relation relation]}
 */
class matrix
    : public detail::relate::matrix<3, 3>
{
#ifdef DOXYGEN_INVOKED
public:
    /*!
    \brief Initializes all of the matrix elements to F
     */
    matrix();
    /*!
    \brief Subscript operator
    \param index The index of the element
    \return The element
     */
    char operator[](std::size_t index) const;
    /*!
    \brief Returns the iterator to the first element
    \return const RandomAccessIterator
     */
    const_iterator begin() const;
    /*!
    \brief Returns the iterator past the last element
    \return const RandomAccessIterator
     */
    const_iterator end() const;
    /*!
    \brief Returns the number of elements
    \return 9
     */
    static std::size_t size();
    /*!
    \brief Returns raw pointer to elements
    \return const pointer to array of elements
     */
    inline const char * data() const;
    /*!
    \brief Returns std::string containing elements
    \return string containing elements
     */
    inline std::string str() const;
#endif
};

/*!
\brief DE-9IM model intersection mask.
\ingroup de9im
\details This mask can be used to check spatial relations as defined in
         Dimensionally Extended 9-Intersection Model.

\qbk{[heading See also]}
\qbk{* [link geometry.reference.algorithms.relate relate]}
 */
class mask
    : public detail::relate::mask<3, 3>
{
    typedef detail::relate::mask<3, 3> base_type;

public:
    /*!
    \brief The constructor.
    \param code The mask pattern.
    */
    inline explicit mask(const char* code)
        : base_type(code)
    {}
    
    /*!
    \brief The constructor.
    \param code The mask pattern.
    */
    inline explicit mask(std::string const& code)
        : base_type(code.c_str(), code.size())
    {}
};

// static_mask

/*!
\brief DE-9IM model intersection mask (static version).
\ingroup de9im
\details This mask can be used to check spatial relations as defined in
         Dimensionally Extended 9-Intersection Model.
\tparam II Interior/Interior intersection mask element
\tparam IB Interior/Boundary intersection mask element
\tparam IE Interior/Exterior intersection mask element
\tparam BI Boundary/Interior intersection mask element
\tparam BB Boundary/Boundary intersection mask element
\tparam BE Boundary/Exterior intersection mask element
\tparam EI Exterior/Interior intersection mask element
\tparam EB Exterior/Boundary intersection mask element
\tparam EE Exterior/Exterior intersection mask element

\qbk{[heading See also]}
\qbk{* [link geometry.reference.algorithms.relate relate]}
 */
template
<
    char II = '*', char IB = '*', char IE = '*',
    char BI = '*', char BB = '*', char BE = '*',
    char EI = '*', char EB = '*', char EE = '*'
>
class static_mask
    : public detail::relate::static_mask
        <
            boost::mpl::vector_c
                <
                    char, II, IB, IE, BI, BB, BE, EI, EB, EE
                >,
            3, 3
        >
{};

} // namespace de9im

namespace detail { namespace de9im
{

// a small helper util for ORing static masks

template
<
    typename Seq,
    typename T,
    bool IsSeq = boost::mpl::is_sequence<Seq>::value
>
struct push_back
{
    typedef typename boost::mpl::push_back
        <
            Seq,
            T
        >::type type;
};

template <typename Seq, typename T>
struct push_back<Seq, T, false>
{};

}} // namespace detail::de9im

namespace de9im
{

inline
boost::tuples::cons
    <
        mask,
        boost::tuples::cons<mask, boost::tuples::null_type>
    >
operator||(mask const& m1, mask const& m2)
{
    namespace bt = boost::tuples;

    return bt::cons<mask, bt::cons<mask, bt::null_type> >
        ( m1, bt::cons<mask, bt::null_type>(m2, bt::null_type()) );
}

template <typename Tail>
inline
typename index::detail::tuples::push_back
    <
        boost::tuples::cons<mask, Tail>,
        mask
    >::type
operator||(boost::tuples::cons<mask, Tail> const& t, mask const& m)
{
    namespace bt = boost::tuples;

    return index::detail::tuples::push_back
            <
                bt::cons<mask, Tail>,
                mask
            >::apply(t, m);
}

template
<
    char II1, char IB1, char IE1,
    char BI1, char BB1, char BE1,
    char EI1, char EB1, char EE1,
    char II2, char IB2, char IE2,
    char BI2, char BB2, char BE2,
    char EI2, char EB2, char EE2
>
inline
boost::mpl::vector<
    static_mask<II1, IB1, IE1, BI1, BB1, BE1, EI1, EB1, EE1>,
    static_mask<II2, IB2, IE2, BI2, BB2, BE2, EI2, EB2, EE2>
>
operator||(static_mask<II1, IB1, IE1, BI1, BB1, BE1, EI1, EB1, EE1> const& ,
           static_mask<II2, IB2, IE2, BI2, BB2, BE2, EI2, EB2, EE2> const& )
{
    return boost::mpl::vector
            <
                static_mask<II1, IB1, IE1, BI1, BB1, BE1, EI1, EB1, EE1>,
                static_mask<II2, IB2, IE2, BI2, BB2, BE2, EI2, EB2, EE2>
            >();
}

template
<
    typename Seq,
    char II, char IB, char IE,
    char BI, char BB, char BE,
    char EI, char EB, char EE
>
inline
typename detail::de9im::push_back
    <
        Seq,
        static_mask<II, IB, IE, BI, BB, BE, EI, EB, EE>
    >::type
operator||(Seq const& ,
           static_mask<II, IB, IE, BI, BB, BE, EI, EB, EE> const& )
{
    return typename detail::de9im::push_back
            <
                Seq,
                static_mask<II, IB, IE, BI, BB, BE, EI, EB, EE>
            >::type();
}

} // namespace de9im


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace de9im
{

// PREDEFINED MASKS

// TODO:
// 1. specialize for simplified masks if available
// e.g. for TOUCHES use 1 mask for A/A
// 2. Think about dimensions > 2 e.g. should TOUCHES be true
// if the interior of the Areal overlaps the boundary of the Volumetric
// like it's true for Linear/Areal

// EQUALS
template <typename Geometry1, typename Geometry2>
struct static_mask_equals_type
{
    typedef geometry::de9im::static_mask<'T', '*', 'F', '*', '*', 'F', 'F', 'F', '*'> type; // wikipedia
    //typedef geometry::de9im::static_mask<'T', 'F', 'F', 'F', 'T', 'F', 'F', 'F', 'T'> type; // OGC
};

// DISJOINT
template <typename Geometry1, typename Geometry2>
struct static_mask_disjoint_type
{
    typedef geometry::de9im::static_mask<'F', 'F', '*', 'F', 'F', '*', '*', '*', '*'> type;
};

// TOUCHES - NOT P/P
template
<
    typename Geometry1,
    typename Geometry2,
    std::size_t Dim1 = geometry::topological_dimension<Geometry1>::value,
    std::size_t Dim2 = geometry::topological_dimension<Geometry2>::value
>
struct static_mask_touches_impl
{
    typedef boost::mpl::vector
        <
            geometry::de9im::static_mask<'F', 'T', '*', '*', '*', '*', '*', '*', '*'>,
            geometry::de9im::static_mask<'F', '*', '*', 'T', '*', '*', '*', '*', '*'>,
            geometry::de9im::static_mask<'F', '*', '*', '*', 'T', '*', '*', '*', '*'>
        > type;
};
// According to OGC, doesn't apply to P/P
// Using the above mask the result would be always false
template <typename Geometry1, typename Geometry2>
struct static_mask_touches_impl<Geometry1, Geometry2, 0, 0>
    : not_implemented<typename geometry::tag<Geometry1>::type,
                      typename geometry::tag<Geometry2>::type>
{};

template <typename Geometry1, typename Geometry2>
struct static_mask_touches_type
    : static_mask_touches_impl<Geometry1, Geometry2>
{};

// WITHIN
template <typename Geometry1, typename Geometry2>
struct static_mask_within_type
{
    typedef geometry::de9im::static_mask<'T', '*', 'F', '*', '*', 'F', '*', '*', '*'> type;
};

// COVERED_BY (non OGC)
template <typename Geometry1, typename Geometry2>
struct static_mask_covered_by_type
{
    typedef boost::mpl::vector
        <
            geometry::de9im::static_mask<'T', '*', 'F', '*', '*', 'F', '*', '*', '*'>,
            geometry::de9im::static_mask<'*', 'T', 'F', '*', '*', 'F', '*', '*', '*'>,
            geometry::de9im::static_mask<'*', '*', 'F', 'T', '*', 'F', '*', '*', '*'>,
            geometry::de9im::static_mask<'*', '*', 'F', '*', 'T', 'F', '*', '*', '*'>
        > type;
};

// CROSSES
// dim(G1) < dim(G2) - P/L P/A L/A
template
<
    typename Geometry1,
    typename Geometry2,
    std::size_t Dim1 = geometry::topological_dimension<Geometry1>::value,
    std::size_t Dim2 = geometry::topological_dimension<Geometry2>::value,
    bool D1LessD2 = (Dim1 < Dim2)
>
struct static_mask_crosses_impl
{
    typedef geometry::de9im::static_mask<'T', '*', 'T', '*', '*', '*', '*', '*', '*'> type;
};
// TODO: I'm not sure if this one below should be available!
// dim(G1) > dim(G2) - L/P A/P A/L
template
<
    typename Geometry1, typename Geometry2, std::size_t Dim1, std::size_t Dim2
>
struct static_mask_crosses_impl<Geometry1, Geometry2, Dim1, Dim2, false>
{
    typedef geometry::de9im::static_mask<'T', '*', '*', '*', '*', '*', 'T', '*', '*'> type;
};
// dim(G1) == dim(G2) - P/P A/A
template
<
    typename Geometry1, typename Geometry2, std::size_t Dim
>
struct static_mask_crosses_impl<Geometry1, Geometry2, Dim, Dim, false>
    : not_implemented
        <
            typename geometry::tag<Geometry1>::type,
            typename geometry::tag<Geometry2>::type
        >
{};
// dim(G1) == 1 && dim(G2) == 1 - L/L
template <typename Geometry1, typename Geometry2>
struct static_mask_crosses_impl<Geometry1, Geometry2, 1, 1, false>
{
    typedef geometry::de9im::static_mask<'0', '*', '*', '*', '*', '*', '*', '*', '*'> type;
};

template <typename Geometry1, typename Geometry2>
struct static_mask_crosses_type
    : static_mask_crosses_impl<Geometry1, Geometry2>
{};

// OVERLAPS

// dim(G1) != dim(G2) - NOT P/P, L/L, A/A
template
<
    typename Geometry1,
    typename Geometry2,
    std::size_t Dim1 = geometry::topological_dimension<Geometry1>::value,
    std::size_t Dim2 = geometry::topological_dimension<Geometry2>::value
>
struct static_mask_overlaps_impl
    : not_implemented
        <
            typename geometry::tag<Geometry1>::type,
            typename geometry::tag<Geometry2>::type
        >
{};
// dim(G1) == D && dim(G2) == D - P/P A/A
template <typename Geometry1, typename Geometry2, std::size_t Dim>
struct static_mask_overlaps_impl<Geometry1, Geometry2, Dim, Dim>
{
    typedef geometry::de9im::static_mask<'T', '*', 'T', '*', '*', '*', 'T', '*', '*'> type;
};
// dim(G1) == 1 && dim(G2) == 1 - L/L
template <typename Geometry1, typename Geometry2>
struct static_mask_overlaps_impl<Geometry1, Geometry2, 1, 1>
{
    typedef geometry::de9im::static_mask<'1', '*', 'T', '*', '*', '*', 'T', '*', '*'> type;
};

template <typename Geometry1, typename Geometry2>
struct static_mask_overlaps_type
    : static_mask_overlaps_impl<Geometry1, Geometry2>
{};

}} // namespace detail::de9im
#endif // DOXYGEN_NO_DETAIL


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_DE9IM_HPP
