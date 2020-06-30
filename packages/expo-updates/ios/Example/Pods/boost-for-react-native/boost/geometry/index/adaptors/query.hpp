// Boost.Geometry Index
//
// Query range adaptor
//
// Copyright (c) 2011-2013 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_ADAPTORS_QUERY_HPP
#define BOOST_GEOMETRY_INDEX_ADAPTORS_QUERY_HPP

/*!
\defgroup adaptors Adaptors (boost::geometry::index::adaptors::)
*/

namespace boost { namespace geometry { namespace index {

namespace adaptors {

namespace detail {

template <typename Index>
class query_range
{
    BOOST_MPL_ASSERT_MSG(
        (false),
        NOT_IMPLEMENTED_FOR_THIS_INDEX,
        (query_range));

    typedef int* iterator;
    typedef const int* const_iterator;

    template <typename Predicates>
    inline query_range(
        Index const&,
        Predicates const&)
    {}

    inline iterator begin() { return 0; }
    inline iterator end() { return 0; }
    inline const_iterator begin() const { return 0; }
    inline const_iterator end() const { return 0; }
};

// TODO: awulkiew - consider removing reference from predicates

template<typename Predicates>
struct query
{
    inline explicit query(Predicates const& pred)
        : predicates(pred)
    {}

    Predicates const& predicates;
};

template<typename Index, typename Predicates>
index::adaptors::detail::query_range<Index>
operator|(
    Index const& si,
    index::adaptors::detail::query<Predicates> const& f)
{
    return index::adaptors::detail::query_range<Index>(si, f.predicates);
}

} // namespace detail

/*!
\brief The query index adaptor generator.

\ingroup adaptors

\param pred   Predicates.
*/
template <typename Predicates>
detail::query<Predicates>
queried(Predicates const& pred)
{
    return detail::query<Predicates>(pred);
}

} // namespace adaptors

}}} // namespace boost::geometry::index

#endif // BOOST_GEOMETRY_INDEX_ADAPTORS_QUERY_HPP
