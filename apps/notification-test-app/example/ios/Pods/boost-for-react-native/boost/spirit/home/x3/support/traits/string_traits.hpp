/*=============================================================================
    Copyright (c) 2001-2014 Joel de Guzman
    Copyright (c) 2001-2011 Hartmut Kaiser
    Copyright (c)      2010 Bryce Lelbach

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
================================================_==============================*/
#if !defined(BOOST_SPIRIT_X3_STRING_TRAITS_OCTOBER_2008_1252PM)
#define BOOST_SPIRIT_X3_STRING_TRAITS_OCTOBER_2008_1252PM

#include <string>
#include <boost/mpl/bool.hpp>
#include <boost/mpl/identity.hpp>

namespace boost { namespace spirit { namespace x3 { namespace traits
{
    ///////////////////////////////////////////////////////////////////////////
    // Determine if T is a character type
    ///////////////////////////////////////////////////////////////////////////
    template <typename T>
    struct is_char : mpl::false_ {};

    template <typename T>
    struct is_char<T const> : is_char<T> {};

    template <>
    struct is_char<char> : mpl::true_ {};

    template <>
    struct is_char<wchar_t> : mpl::true_ {};

    ///////////////////////////////////////////////////////////////////////////
    // Determine if T is a string
    ///////////////////////////////////////////////////////////////////////////
    template <typename T>
    struct is_string : mpl::false_ {};

    template <typename T>
    struct is_string<T const> : is_string<T> {};

    template <>
    struct is_string<char const*> : mpl::true_ {};

    template <>
    struct is_string<wchar_t const*> : mpl::true_ {};

    template <>
    struct is_string<char*> : mpl::true_ {};

    template <>
    struct is_string<wchar_t*> : mpl::true_ {};

    template <std::size_t N>
    struct is_string<char[N]> : mpl::true_ {};

    template <std::size_t N>
    struct is_string<wchar_t[N]> : mpl::true_ {};

    template <std::size_t N>
    struct is_string<char const[N]> : mpl::true_ {};

    template <std::size_t N>
    struct is_string<wchar_t const[N]> : mpl::true_ {};

    template <std::size_t N>
    struct is_string<char(&)[N]> : mpl::true_ {};

    template <std::size_t N>
    struct is_string<wchar_t(&)[N]> : mpl::true_ {};

    template <std::size_t N>
    struct is_string<char const(&)[N]> : mpl::true_ {};

    template <std::size_t N>
    struct is_string<wchar_t const(&)[N]> : mpl::true_ {};

    template <typename T, typename Traits, typename Allocator>
    struct is_string<std::basic_string<T, Traits, Allocator> > : mpl::true_ {};

    ///////////////////////////////////////////////////////////////////////////
    // Get the underlying char type of a string
    ///////////////////////////////////////////////////////////////////////////
    template <typename T>
    struct char_type_of;

    template <typename T>
    struct char_type_of<T const> : char_type_of<T> {};

    template <>
    struct char_type_of<char> : mpl::identity<char> {};

    template <>
    struct char_type_of<wchar_t> : mpl::identity<wchar_t> {};

    template <>
    struct char_type_of<char const*> : mpl::identity<char const> {};

    template <>
    struct char_type_of<wchar_t const*> : mpl::identity<wchar_t const> {};

    template <>
    struct char_type_of<char*> : mpl::identity<char> {};

    template <>
    struct char_type_of<wchar_t*> : mpl::identity<wchar_t> {};

    template <std::size_t N>
    struct char_type_of<char[N]> : mpl::identity<char> {};

    template <std::size_t N>
    struct char_type_of<wchar_t[N]> : mpl::identity<wchar_t> {};

    template <std::size_t N>
    struct char_type_of<char const[N]> : mpl::identity<char const> {};

    template <std::size_t N>
    struct char_type_of<wchar_t const[N]> : mpl::identity<wchar_t const> {};

    template <std::size_t N>
    struct char_type_of<char(&)[N]> : mpl::identity<char> {};

    template <std::size_t N>
    struct char_type_of<wchar_t(&)[N]> : mpl::identity<wchar_t> {};

    template <std::size_t N>
    struct char_type_of<char const(&)[N]> : mpl::identity<char const> {};

    template <std::size_t N>
    struct char_type_of<wchar_t const(&)[N]> : mpl::identity<wchar_t const> {};

    template <typename T, typename Traits, typename Allocator>
    struct char_type_of<std::basic_string<T, Traits, Allocator> >
      : mpl::identity<T> {};

    ///////////////////////////////////////////////////////////////////////////
    // Get the C string from a string
    ///////////////////////////////////////////////////////////////////////////
    template <typename String>
    struct extract_c_string;

    template <typename String>
    struct extract_c_string
    {
        typedef typename char_type_of<String>::type char_type;

        template <typename T>
        static T const* call (T* str)
        {
            return (T const*)str;
        }

        template <typename T>
        static T const* call (T const* str)
        {
            return str;
        }
    };

    // Forwarder that strips const
    template <typename T>
    struct extract_c_string<T const>
    {
        typedef typename extract_c_string<T>::char_type char_type;

        static typename extract_c_string<T>::char_type const* call (T const str)
        {
            return extract_c_string<T>::call(str);
        }
    };

    // Forwarder that strips references
    template <typename T>
    struct extract_c_string<T&>
    {
        typedef typename extract_c_string<T>::char_type char_type;

        static typename extract_c_string<T>::char_type const* call (T& str)
        {
            return extract_c_string<T>::call(str);
        }
    };

    // Forwarder that strips const references
    template <typename T>
    struct extract_c_string<T const&>
    {
        typedef typename extract_c_string<T>::char_type char_type;

        static typename extract_c_string<T>::char_type const* call (T const& str)
        {
            return extract_c_string<T>::call(str);
        }
    };

    template <typename T, typename Traits, typename Allocator>
    struct extract_c_string<std::basic_string<T, Traits, Allocator> >
    {
        typedef T char_type;

        typedef std::basic_string<T, Traits, Allocator> string;

        static T const* call (string const& str)
        {
            return str.c_str();
        }
    };

    template <typename T>
    typename extract_c_string<T*>::char_type const*
    get_c_string(T* str)
    {
        return extract_c_string<T*>::call(str);
    }

    template <typename T>
    typename extract_c_string<T const*>::char_type const*
    get_c_string(T const* str)
    {
        return extract_c_string<T const*>::call(str);
    }

    template <typename String>
    typename extract_c_string<String>::char_type const*
    get_c_string(String& str)
    {
        return extract_c_string<String>::call(str);
    }

    template <typename String>
    typename extract_c_string<String>::char_type const*
    get_c_string(String const& str)
    {
        return extract_c_string<String>::call(str);
    }

    ///////////////////////////////////////////////////////////////////////////
    // Get the begin/end iterators from a string
    ///////////////////////////////////////////////////////////////////////////

    // Implementation for C-style strings.

    template <typename T>
    inline T const* get_string_begin(T const* str) { return str; }

    template <typename T>
    inline T* get_string_begin(T* str) { return str; }

    template <typename T>
    inline T const* get_string_end(T const* str)
    {
        T const* last = str;
        while (*last)
            last++;
        return last;
    }

    template <typename T>
    inline T* get_string_end(T* str)
    {
        T* last = str;
        while (*last)
            last++;
        return last;
    }

    // Implementation for containers (includes basic_string).
    template <typename T, typename Str>
    inline typename Str::const_iterator get_string_begin(Str const& str)
    { return str.begin(); }

    template <typename T, typename Str>
    inline typename Str::iterator
    get_string_begin(Str& str)
    { return str.begin(); }

    template <typename T, typename Str>
    inline typename Str::const_iterator get_string_end(Str const& str)
    { return str.end(); }

    template <typename T, typename Str>
    inline typename Str::iterator
    get_string_end(Str& str)
    { return str.end(); }
}}}}

#endif
