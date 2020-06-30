// Boost.Geometry Index
//
// Copyright (c) 2011-2015 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_INDEXABLE_HPP
#define BOOST_GEOMETRY_INDEX_INDEXABLE_HPP

#include <boost/mpl/assert.hpp>

#include <boost/geometry/index/detail/is_indexable.hpp>

namespace boost { namespace geometry { namespace index { namespace detail {

/*!
\brief The function object extracting Indexable from Value.

It translates Value object to Indexable object. The default version handles Values which are Indexables.
This template is also specialized for std::pair<Indexable, T2>, boost::tuple<Indexable, ...>
and std::tuple<Indexable, ...>.

\tparam Value       The Value type which may be translated directly to the Indexable.
\tparam IsIndexable If true, the const reference to Value is returned.
*/
template <typename Value, bool IsIndexable = is_indexable<Value>::value>
struct indexable
{
    BOOST_MPL_ASSERT_MSG(
        (detail::is_indexable<Value>::value),
        NOT_VALID_INDEXABLE_TYPE,
        (Value)
    );

    /*! \brief The type of result returned by function object. */
    typedef Value const& result_type;

    /*!
    \brief Return indexable extracted from the value.
    
    \param v The value.
    \return The indexable.
    */
    inline result_type operator()(Value const& v) const
    {
        return v;
    }
};

/*!
\brief The function object extracting Indexable from Value.

This specialization translates from std::pair<Indexable, T2>.

\tparam Indexable       The Indexable type.
\tparam T2              The second type.
*/
template <typename Indexable, typename T2>
struct indexable<std::pair<Indexable, T2>, false>
{
    BOOST_MPL_ASSERT_MSG(
        (detail::is_indexable<Indexable>::value),
        NOT_VALID_INDEXABLE_TYPE,
        (Indexable)
    );

    /*! \brief The type of result returned by function object. */
    typedef Indexable const& result_type;

    /*!
    \brief Return indexable extracted from the value.
    
    \param v The value.
    \return The indexable.
    */
    inline result_type operator()(std::pair<Indexable, T2> const& v) const
    {
        return v.first;
    }
};

/*!
\brief The function object extracting Indexable from Value.

This specialization translates from boost::tuple<Indexable, ...>.

\tparam Indexable   The Indexable type.
*/
template <typename Indexable, typename T1, typename T2, typename T3, typename T4,
          typename T5, typename T6, typename T7, typename T8, typename T9>
struct indexable<boost::tuple<Indexable, T1, T2, T3, T4, T5, T6, T7, T8, T9>, false>
{
    typedef boost::tuple<Indexable, T1, T2, T3, T4, T5, T6, T7, T8, T9> value_type;

    BOOST_MPL_ASSERT_MSG(
        (detail::is_indexable<Indexable>::value),
        NOT_VALID_INDEXABLE_TYPE,
        (Indexable)
        );

    /*! \brief The type of result returned by function object. */
    typedef Indexable const& result_type;

    /*!
    \brief Return indexable extracted from the value.
    
    \param v The value.
    \return The indexable.
    */
    inline result_type operator()(value_type const& v) const
    {
        return boost::get<0>(v);
    }
};

}}}} // namespace boost::geometry::index::detail

#if !defined(BOOST_NO_CXX11_HDR_TUPLE) && !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

#include <tuple>

namespace boost { namespace geometry { namespace index { namespace detail {

/*!
\brief The function object extracting Indexable from Value.

This specialization translates from std::tuple<Indexable, Args...>.
It's defined if the compiler supports tuples and variadic templates.

\tparam Indexable   The Indexable type.
*/
template <typename Indexable, typename ...Args>
struct indexable<std::tuple<Indexable, Args...>, false>
{
    typedef std::tuple<Indexable, Args...> value_type;

    BOOST_MPL_ASSERT_MSG(
        (detail::is_indexable<Indexable>::value),
        NOT_VALID_INDEXABLE_TYPE,
        (Indexable)
        );

    /*! \brief The type of result returned by function object. */
    typedef Indexable const& result_type;

    /*!
    \brief Return indexable extracted from the value.
    
    \param v The value.
    \return The indexable.
    */
    result_type operator()(value_type const& v) const
    {
        return std::get<0>(v);
    }
};

}}}} // namespace boost::geometry::index::detail

#endif // !defined(BOOST_NO_CXX11_HDR_TUPLE) && !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

namespace boost { namespace geometry { namespace index {

/*!
\brief The function object extracting Indexable from Value.

It translates Value object to Indexable object. By default, it can handle Values which are Indexables,
std::pair<Indexable, T2>, boost::tuple<Indexable, ...> and std::tuple<Indexable, ...> if STD tuples
and variadic templates are supported.

\tparam Value       The Value type which may be translated directly to the Indexable.
*/
template <typename Value>
struct indexable
    : detail::indexable<Value>
{
    /*! \brief The type of result returned by function object. It should be const Indexable reference. */
    typedef typename detail::indexable<Value>::result_type result_type;

    /*!
    \brief Return indexable extracted from the value.
    
    \param v The value.
    \return The indexable.
    */
    inline result_type operator()(Value const& v) const
    {
        return detail::indexable<Value>::operator()(v);
    }
};

}}} // namespace boost::geometry::index

#endif // BOOST_GEOMETRY_INDEX_INDEXABLE_HPP
