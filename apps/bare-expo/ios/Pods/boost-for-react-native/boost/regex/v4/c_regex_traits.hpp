/*
 *
 * Copyright (c) 2004
 * John Maddock
 *
 * Use, modification and distribution are subject to the 
 * Boost Software License, Version 1.0. (See accompanying file 
 * LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
 *
 */
 
 /*
  *   LOCATION:    see http://www.boost.org for most recent version.
  *   FILE         c_regex_traits.hpp
  *   VERSION      see <boost/version.hpp>
  *   DESCRIPTION: Declares regular expression traits class that wraps the global C locale.
  */

#ifndef BOOST_C_REGEX_TRAITS_HPP_INCLUDED
#define BOOST_C_REGEX_TRAITS_HPP_INCLUDED

#ifndef BOOST_REGEX_CONFIG_HPP
#include <boost/regex/config.hpp>
#endif
#ifndef BOOST_REGEX_WORKAROUND_HPP
#include <boost/regex/v4/regex_workaround.hpp>
#endif

#include <cctype>

#ifdef BOOST_NO_STDC_NAMESPACE
namespace std{
   using ::strlen; using ::tolower;
}
#endif

#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable: 4103)
#endif
#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif
#ifdef BOOST_MSVC
#pragma warning(pop)
#endif

namespace boost{

template <class charT>
struct c_regex_traits;

template<>
struct BOOST_REGEX_DECL c_regex_traits<char>
{
   c_regex_traits(){}
   typedef char char_type;
   typedef std::size_t size_type;
   typedef std::string string_type;
   struct locale_type{};
   typedef boost::uint32_t char_class_type;

   static size_type length(const char_type* p) 
   { 
      return (std::strlen)(p); 
   }

   char translate(char c) const 
   { 
      return c; 
   }
   char translate_nocase(char c) const 
   { 
      return static_cast<char>((std::tolower)(static_cast<unsigned char>(c))); 
   }

   static string_type BOOST_REGEX_CALL transform(const char* p1, const char* p2);
   static string_type BOOST_REGEX_CALL transform_primary(const char* p1, const char* p2);

   static char_class_type BOOST_REGEX_CALL lookup_classname(const char* p1, const char* p2);
   static string_type BOOST_REGEX_CALL lookup_collatename(const char* p1, const char* p2);

   static bool BOOST_REGEX_CALL isctype(char, char_class_type);
   static int BOOST_REGEX_CALL value(char, int);

   locale_type imbue(locale_type l)
   { return l; }
   locale_type getloc()const
   { return locale_type(); }

private:
   // this type is not copyable:
   c_regex_traits(const c_regex_traits&);
   c_regex_traits& operator=(const c_regex_traits&);
};

#ifndef BOOST_NO_WREGEX
template<>
struct BOOST_REGEX_DECL c_regex_traits<wchar_t>
{
   c_regex_traits(){}
   typedef wchar_t char_type;
   typedef std::size_t size_type;
   typedef std::wstring string_type;
   struct locale_type{};
   typedef boost::uint32_t char_class_type;

   static size_type length(const char_type* p) 
   { 
      return (std::wcslen)(p); 
   }

   wchar_t translate(wchar_t c) const 
   { 
      return c; 
   }
   wchar_t translate_nocase(wchar_t c) const 
   { 
      return (std::towlower)(c); 
   }

   static string_type BOOST_REGEX_CALL transform(const wchar_t* p1, const wchar_t* p2);
   static string_type BOOST_REGEX_CALL transform_primary(const wchar_t* p1, const wchar_t* p2);

   static char_class_type BOOST_REGEX_CALL lookup_classname(const wchar_t* p1, const wchar_t* p2);
   static string_type BOOST_REGEX_CALL lookup_collatename(const wchar_t* p1, const wchar_t* p2);

   static bool BOOST_REGEX_CALL isctype(wchar_t, char_class_type);
   static int BOOST_REGEX_CALL value(wchar_t, int);

   locale_type imbue(locale_type l)
   { return l; }
   locale_type getloc()const
   { return locale_type(); }

private:
   // this type is not copyable:
   c_regex_traits(const c_regex_traits&);
   c_regex_traits& operator=(const c_regex_traits&);
};

#ifdef BOOST_REGEX_HAS_OTHER_WCHAR_T
//
// Provide an unsigned short version as well, so the user can link to this
// no matter whether they build with /Zc:wchar_t or not (MSVC specific).
//
template<>
struct BOOST_REGEX_DECL c_regex_traits<unsigned short>
{
   c_regex_traits(){}
   typedef unsigned short char_type;
   typedef std::size_t size_type;
   typedef std::basic_string<unsigned short> string_type;
   struct locale_type{};
   typedef boost::uint32_t char_class_type;

   static size_type length(const char_type* p) 
   { 
      return (std::wcslen)((const wchar_t*)p); 
   }

   unsigned short translate(unsigned short c) const 
   { 
      return c; 
   }
   unsigned short translate_nocase(unsigned short c) const 
   { 
      return (std::towlower)((wchar_t)c); 
   }

   static string_type BOOST_REGEX_CALL transform(const unsigned short* p1, const unsigned short* p2);
   static string_type BOOST_REGEX_CALL transform_primary(const unsigned short* p1, const unsigned short* p2);

   static char_class_type BOOST_REGEX_CALL lookup_classname(const unsigned short* p1, const unsigned short* p2);
   static string_type BOOST_REGEX_CALL lookup_collatename(const unsigned short* p1, const unsigned short* p2);

   static bool BOOST_REGEX_CALL isctype(unsigned short, char_class_type);
   static int BOOST_REGEX_CALL value(unsigned short, int);

   locale_type imbue(locale_type l)
   { return l; }
   locale_type getloc()const
   { return locale_type(); }

private:
   // this type is not copyable:
   c_regex_traits(const c_regex_traits&);
   c_regex_traits& operator=(const c_regex_traits&);
};

#endif

#endif // BOOST_NO_WREGEX

}

#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable: 4103)
#endif
#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif
#ifdef BOOST_MSVC
#pragma warning(pop)
#endif

#endif



