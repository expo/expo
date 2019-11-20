// Boost.TypeErasure library
//
// Copyright 2011 Steven Watanabe
//
// Distributed under the Boost Software License Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
// $Id$

#ifndef BOOST_TYPE_ERASURE_PARAM_HPP_INCLUDED
#define BOOST_TYPE_ERASURE_PARAM_HPP_INCLUDED

#include <boost/config.hpp>
#include <boost/utility/enable_if.hpp>
#include <boost/type_traits/is_same.hpp>
#include <boost/type_traits/add_const.hpp>
#include <boost/type_traits/remove_cv.hpp>
#include <boost/type_traits/remove_reference.hpp>
#include <boost/mpl/bool.hpp>
#include <boost/mpl/if.hpp>
#include <boost/type_erasure/detail/access.hpp>
#include <boost/type_erasure/detail/storage.hpp>
#include <boost/type_erasure/is_placeholder.hpp>
#include <boost/type_erasure/concept_of.hpp>

namespace boost {
namespace type_erasure {
    
template<class Concept, class T>
class any;
    
template<class Concept>
class binding;

namespace detail {

struct access;

}

namespace detail {

template<class From, class To>
struct placeholder_conversion : boost::mpl::false_ {};
template<class T>
struct placeholder_conversion<T, T> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<T, T&> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<T, const T&> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<const T, T> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<const T, const T&> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<T&, T> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<T&, T&> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<T&, const T&> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<const T&, T> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<const T&, const T&> : boost::mpl::true_ {};

#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
template<class T>
struct placeholder_conversion<T&&, T> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<T&&, const T&> : boost::mpl::true_ {};
template<class T>
struct placeholder_conversion<T&&, T&&> : boost::mpl::true_ {};
#endif

}

#ifdef __clang__
#if !__has_feature(cxx_reference_qualified_functions)
/** INTERNAL ONLY */
#define BOOST_NO_FUNCTION_REFERENCE_QUALIFIERS
#endif
#else
/** INTERNAL ONLY */
#define BOOST_NO_FUNCTION_REFERENCE_QUALIFIERS
#endif

/**
 * \brief A wrapper to help with overload resolution for functions
 * operating on an @ref any.
 *
 * The template arguments are interpreted in
 * the same way as @ref any.
 *
 * A parameter of type @ref param can be initialized
 * with an @ref any that has the same @c Concept
 * and base placeholder when there exists a corresponding
 * standard conversion for the placeholder.
 * A conversion sequence from @ref any<C, P> to @ref param<C, P1> is
 * a better conversion sequence than @ref any<C, P> to @ref param<C, P2>
 * iff the corresponding placeholder standard conversion
 * sequence from P to P1 is a better conversion sequence than
 * P to P2.
 *
 * \note Overloading based on cv-qualifiers and rvalue-ness is
 * only supported in C++11.  In C++03, all conversion sequences
 * from @ref any to @ref param have the same rank.
 *
 * Example:
 *
 * \code
 * void f(param<C, _a&>);
 * void f(param<C, const _a&>);
 * void g(param<C, const _a&>);
 * void g(param<C, _a&&>);
 *
 * any<C, _a> a;
 * f(any<C, _a>()); // calls void f(param<C, const _a&>);
 * f(a);            // calls void f(param<C, _a&>); (ambiguous in C++03)
 * g(any<C, _a>()); // calls void g(param<C, _a&&>); (ambiguous in C++03)
 * g(a);            // calls void g(param<C, const _a&>);
 * \endcode
 *
 */
template<class Concept, class T>
class param {
public:

    friend struct boost::type_erasure::detail::access;

    /** INTERNAL ONLY */
    typedef void _boost_type_erasure_is_any;
    /** INTERNAL ONLY */
    typedef param _boost_type_erasure_derived_type;

    template<class U>
    param(any<Concept, U>& a
#ifndef BOOST_TYPE_ERASURE_DOXYGEN
        , typename boost::enable_if<
            ::boost::type_erasure::detail::placeholder_conversion<U, T>
        >::type* = 0
#endif
        )
      : _impl(a)
    {}
    template<class U>
    param(const any<Concept, U>& a
#ifndef BOOST_TYPE_ERASURE_DOXYGEN
        , typename boost::enable_if<
            ::boost::type_erasure::detail::placeholder_conversion<
                typename ::boost::add_const<U>::type,
                T
            >
        >::type* = 0
#endif
        )
      : _impl(a)
    {}
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
    template<class U>
    param(any<Concept, U>&& a
#ifndef BOOST_TYPE_ERASURE_DOXYGEN
        , typename boost::enable_if<
            ::boost::type_erasure::detail::placeholder_conversion<
                U&&,
                T
            >
        >::type* = 0
#endif
        )
      : _impl(std::move(a))
    {}
#endif

    /** Returns the stored @ref any. */
    any<Concept, T> get() const { return _impl; }
private:
    any<Concept, T> _impl;
};

#ifndef BOOST_NO_FUNCTION_REFERENCE_QUALIFIERS

template<class Concept, class T>
class param<Concept, const T&> {
public:

    friend struct boost::type_erasure::detail::access;

    /** INTERNAL ONLY */
    typedef void _boost_type_erasure_is_any;
    /** INTERNAL ONLY */
    typedef param _boost_type_erasure_derived_type;

    param(const ::boost::type_erasure::detail::storage& data,
          const ::boost::type_erasure::binding<Concept>& table)
      : _impl(data, table)
    {}
    template<class U>
    param(U& u, typename boost::enable_if< ::boost::is_same<U, const any<Concept, T> > >::type* = 0) : _impl(u) {}
    any<Concept, const T&> get() const { return _impl; }
protected:
    any<Concept, const T&> _impl;
};

template<class Concept, class T>
class param<Concept, T&> : public param<Concept, const T&> {
public:

    friend struct boost::type_erasure::detail::access;

    /** INTERNAL ONLY */
    typedef void _boost_type_erasure_is_any;
    /** INTERNAL ONLY */
    typedef param _boost_type_erasure_derived_type;

    param(const ::boost::type_erasure::detail::storage& data,
          const ::boost::type_erasure::binding<Concept>& table)
      : param<Concept, const T&>(data, table)
    {}
    any<Concept, T&> get() const
    {
        return any<Concept, T&>(
            ::boost::type_erasure::detail::access::data(this->_impl),
            ::boost::type_erasure::detail::access::table(this->_impl));
    }
};

#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES

template<class Concept, class T>
class param<Concept, T&&> : public param<Concept, const T&> {
public:

    friend struct boost::type_erasure::detail::access;

    /** INTERNAL ONLY */
    typedef void _boost_type_erasure_is_any;
    /** INTERNAL ONLY */
    typedef param _boost_type_erasure_derived_type;

    param(const ::boost::type_erasure::detail::storage& data,
          const ::boost::type_erasure::binding<Concept>& table)
      : param<Concept, const T&>(data, table)
    {}
    any<Concept, T&&> get() const
    {
        return any<Concept, T&&>(
            ::boost::type_erasure::detail::access::data(this->_impl),
            ::boost::type_erasure::detail::access::table(this->_impl));
    }
};

#endif

#endif

/**
 * \brief Metafunction that creates a @ref param.
 *
 * If @c T is a (cv/reference qualifed) placeholder,
 * returns @ref param<@ref concept_of "concept_of<Any>::type", T>,
 * otherwise, returns T.  This metafunction is intended
 * to be used for function arguments in specializations of
 * @ref concept_interface.
 *
 * \see derived, rebind_any
 */
template<class Any, class T>
struct as_param {
#ifdef BOOST_TYPE_ERASURE_DOXYGEN
    typedef detail::unspecified type;
#else
    typedef typename ::boost::mpl::if_<
        ::boost::type_erasure::is_placeholder<
            typename ::boost::remove_cv<
                typename ::boost::remove_reference<T>::type>::type>,
        param<typename ::boost::type_erasure::concept_of<Any>::type, T>,
        T
    >::type type;
#endif
};

}
}

#endif
