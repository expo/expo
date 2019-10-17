/*
 *          Copyright Andrey Semashev 2007 - 2014.
 * Distributed under the Boost Software License, Version 1.0.
 *    (See accompanying file LICENSE_1_0.txt or copy at
 *          http://www.boost.org/LICENSE_1_0.txt)
 */
/*!
 * \file   type_info_wrapper.hpp
 * \author Andrey Semashev
 * \date   15.04.2007
 *
 * The header contains implementation of a type information wrapper.
 */

#ifndef BOOST_LOG_UTILITY_TYPE_INFO_WRAPPER_HPP_INCLUDED_
#define BOOST_LOG_UTILITY_TYPE_INFO_WRAPPER_HPP_INCLUDED_

#include <typeinfo>
#include <string>
#include <boost/core/demangle.hpp>
#include <boost/core/explicit_operator_bool.hpp>
#include <boost/log/detail/config.hpp>
#include <boost/log/detail/header.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

namespace boost {

BOOST_LOG_OPEN_NAMESPACE

/*!
 * \brief A simple <tt>std::type_info</tt> wrapper that implements value semantic for type information objects
 *
 * The type info wrapper is very useful for storing type information objects in containers,
 * as a key or value. It also provides a number of useful features, such as default construction
 * and assignment support, an empty state and extended support for human-friendly type names.
 */
class type_info_wrapper
{
private:
#ifndef BOOST_LOG_DOXYGEN_PASS
    //! An inaccessible type to indicate an uninitialized state of the wrapper
    struct BOOST_SYMBOL_VISIBLE uninitialized {};
#endif // BOOST_LOG_DOXYGEN_PASS

private:
    //! A pointer to the actual type info
    std::type_info const* info;

public:
    /*!
     * Default constructor
     *
     * \post <tt>!*this == true</tt>
     */
    type_info_wrapper() BOOST_NOEXCEPT : info(&typeid(uninitialized)) {}
    /*!
     * Copy constructor
     *
     * \post <tt>*this == that</tt>
     * \param that Source type info wrapper to copy from
     */
    type_info_wrapper(type_info_wrapper const& that) BOOST_NOEXCEPT : info(that.info) {}
    /*!
     * Conversion constructor
     *
     * \post <tt>*this == that && !!*this</tt>
     * \param that Type info object to be wrapped
     */
    type_info_wrapper(std::type_info const& that) BOOST_NOEXCEPT : info(&that) {}

    /*!
     * \return \c true if the type info wrapper was initialized with a particular type,
     *         \c false if the wrapper was default-constructed and not yet initialized
     */
    BOOST_EXPLICIT_OPERATOR_BOOL_NOEXCEPT()

    /*!
     * Stored type info getter
     *
     * \pre <tt>!!*this</tt>
     * \return Constant reference to the wrapped type info object
     */
    std::type_info const& get() const BOOST_NOEXCEPT { return *info; }

    /*!
     * Swaps two instances of the wrapper
     */
    void swap(type_info_wrapper& that) BOOST_NOEXCEPT
    {
        std::type_info const* temp = info;
        info = that.info;
        that.info = temp;
    }

    /*!
     * The method returns the contained type name string in a possibly more readable format than <tt>get().name()</tt>
     *
     * \pre <tt>!!*this</tt>
     * \return Type name string
     */
    std::string pretty_name() const
    {
        if (!this->operator!())
            return boost::core::demangle(info->name());
        else
            return "[uninitialized]";
    }

    /*!
     * \return \c false if the type info wrapper was initialized with a particular type,
     *         \c true if the wrapper was default-constructed and not yet initialized
     */
    bool operator! () const BOOST_NOEXCEPT { return (info == &typeid(uninitialized) || *info == typeid(uninitialized)); }

    /*!
     * Equality comparison
     *
     * \param that Comparand
     * \return If either this object or comparand is in empty state and the other is not, the result is \c false.
     *         If both arguments are empty, the result is \c true. If both arguments are not empty, the result
     *         is \c true if this object wraps the same type as the comparand and \c false otherwise.
     */
    bool operator== (type_info_wrapper const& that) const BOOST_NOEXCEPT
    {
        return (info == that.info || *info == *that.info);
    }
    /*!
     * Ordering operator
     *
     * \pre <tt>!!*this && !!that</tt>
     * \param that Comparand
     * \return \c true if this object wraps type info object that is ordered before
     *         the type info object in the comparand, \c false otherwise
     * \note The results of this operator are only consistent within a single run of application.
     *       The result may change for the same types after rebuilding or even restarting the application.
     */
    bool operator< (type_info_wrapper const& that) const BOOST_NOEXCEPT
    {
        return static_cast< bool >(info->before(*that.info));
    }
};

//! Inequality operator
inline bool operator!= (type_info_wrapper const& left, type_info_wrapper const& right) BOOST_NOEXCEPT
{
    return !left.operator==(right);
}

//! Ordering operator
inline bool operator<= (type_info_wrapper const& left, type_info_wrapper const& right) BOOST_NOEXCEPT
{
    return (left.operator==(right) || left.operator<(right));
}

//! Ordering operator
inline bool operator> (type_info_wrapper const& left, type_info_wrapper const& right) BOOST_NOEXCEPT
{
    return !(left.operator==(right) || left.operator<(right));
}

//! Ordering operator
inline bool operator>= (type_info_wrapper const& left, type_info_wrapper const& right) BOOST_NOEXCEPT
{
    return !left.operator<(right);
}

//! Free swap for type info wrapper
inline void swap(type_info_wrapper& left, type_info_wrapper& right) BOOST_NOEXCEPT
{
    left.swap(right);
}

//! The function for exception serialization to string
inline std::string to_string(type_info_wrapper const& ti)
{
    return ti.pretty_name();
}

BOOST_LOG_CLOSE_NAMESPACE // namespace log

} // namespace boost

#include <boost/log/detail/footer.hpp>

#endif // BOOST_LOG_UTILITY_TYPE_INFO_WRAPPER_HPP_INCLUDED_
