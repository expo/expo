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
  *   FILE         icu.hpp
  *   VERSION      see <boost/version.hpp>
  *   DESCRIPTION: Unicode regular expressions on top of the ICU Library.
  */

#ifndef BOOST_REGEX_ICU_HPP
#define BOOST_REGEX_ICU_HPP

#include <unicode/utypes.h>
#include <unicode/uchar.h>
#include <unicode/coll.h>
#include <boost/regex.hpp>
#include <boost/regex/pending/unicode_iterator.hpp>
#include <boost/mpl/int_fwd.hpp>
#include <bitset>

#ifdef BOOST_MSVC
#pragma warning (push)
#pragma warning (disable: 4251)
#endif

namespace boost{

namespace BOOST_REGEX_DETAIL_NS{

// 
// Implementation details:
//
class BOOST_REGEX_DECL icu_regex_traits_implementation
{
   typedef UChar32                      char_type;
   typedef std::size_t                  size_type;
   typedef std::vector<char_type>       string_type;
   typedef U_NAMESPACE_QUALIFIER Locale locale_type;
   typedef boost::uint_least32_t        char_class_type;
public:
   icu_regex_traits_implementation(const U_NAMESPACE_QUALIFIER Locale& l)
      : m_locale(l)
   {
      UErrorCode success = U_ZERO_ERROR;
      m_collator.reset(U_NAMESPACE_QUALIFIER Collator::createInstance(l, success));
      if(U_SUCCESS(success) == 0)
         init_error();
      m_collator->setStrength(U_NAMESPACE_QUALIFIER Collator::IDENTICAL);
      success = U_ZERO_ERROR;
      m_primary_collator.reset(U_NAMESPACE_QUALIFIER Collator::createInstance(l, success));
      if(U_SUCCESS(success) == 0)
         init_error();
      m_primary_collator->setStrength(U_NAMESPACE_QUALIFIER Collator::PRIMARY);
   }
   U_NAMESPACE_QUALIFIER Locale getloc()const
   {
      return m_locale;
   }
   string_type do_transform(const char_type* p1, const char_type* p2, const U_NAMESPACE_QUALIFIER Collator* pcoll) const;
   string_type transform(const char_type* p1, const char_type* p2) const
   {
      return do_transform(p1, p2, m_collator.get());
   }
   string_type transform_primary(const char_type* p1, const char_type* p2) const
   {
      return do_transform(p1, p2, m_primary_collator.get());
   }
private:
   void init_error()
   {
      std::runtime_error e("Could not initialize ICU resources");
      boost::throw_exception(e);
   }
   U_NAMESPACE_QUALIFIER Locale m_locale;                                  // The ICU locale that we're using
   boost::scoped_ptr< U_NAMESPACE_QUALIFIER Collator> m_collator;          // The full collation object
   boost::scoped_ptr< U_NAMESPACE_QUALIFIER Collator> m_primary_collator;  // The primary collation object
};

inline boost::shared_ptr<icu_regex_traits_implementation> get_icu_regex_traits_implementation(const U_NAMESPACE_QUALIFIER Locale& loc)
{
   return boost::shared_ptr<icu_regex_traits_implementation>(new icu_regex_traits_implementation(loc));
}

}

class BOOST_REGEX_DECL icu_regex_traits
{
public:
   typedef UChar32                      char_type;
   typedef std::size_t                  size_type;
   typedef std::vector<char_type>       string_type;
   typedef U_NAMESPACE_QUALIFIER Locale locale_type;
#ifdef BOOST_NO_INT64_T
   typedef std::bitset<64>              char_class_type;
#else
   typedef boost::uint64_t              char_class_type;
#endif

   struct boost_extensions_tag{};

   icu_regex_traits()
      : m_pimpl(BOOST_REGEX_DETAIL_NS::get_icu_regex_traits_implementation(U_NAMESPACE_QUALIFIER Locale()))
   {
   }
   static size_type length(const char_type* p);

   ::boost::regex_constants::syntax_type syntax_type(char_type c)const
   {
      return ((c < 0x7f) && (c > 0)) ? BOOST_REGEX_DETAIL_NS::get_default_syntax_type(static_cast<char>(c)) : regex_constants::syntax_char;
   }
   ::boost::regex_constants::escape_syntax_type escape_syntax_type(char_type c) const
   {
      return ((c < 0x7f) && (c > 0)) ? BOOST_REGEX_DETAIL_NS::get_default_escape_syntax_type(static_cast<char>(c)) : regex_constants::syntax_char;
   }
   char_type translate(char_type c) const
   {
      return c;
   }
   char_type translate_nocase(char_type c) const
   {
      return ::u_tolower(c);
   }
   char_type translate(char_type c, bool icase) const
   {
      return icase ? translate_nocase(c) : translate(c);
   }
   char_type tolower(char_type c) const
   {
      return ::u_tolower(c);
   }
   char_type toupper(char_type c) const
   {
      return ::u_toupper(c);
   }
   string_type transform(const char_type* p1, const char_type* p2) const
   {
      return m_pimpl->transform(p1, p2);
   }
   string_type transform_primary(const char_type* p1, const char_type* p2) const
   {
      return m_pimpl->transform_primary(p1, p2);
   }
   char_class_type lookup_classname(const char_type* p1, const char_type* p2) const;
   string_type lookup_collatename(const char_type* p1, const char_type* p2) const;
   bool isctype(char_type c, char_class_type f) const;
   boost::intmax_t toi(const char_type*& p1, const char_type* p2, int radix)const
   {
      return BOOST_REGEX_DETAIL_NS::global_toi(p1, p2, radix, *this);
   }
   int value(char_type c, int radix)const
   {
      return u_digit(c, static_cast< ::int8_t>(radix));
   }
   locale_type imbue(locale_type l)
   {
      locale_type result(m_pimpl->getloc());
      m_pimpl = BOOST_REGEX_DETAIL_NS::get_icu_regex_traits_implementation(l);
      return result;
   }
   locale_type getloc()const
   {
      return locale_type();
   }
   std::string error_string(::boost::regex_constants::error_type n) const
   {
      return BOOST_REGEX_DETAIL_NS::get_default_error_string(n);
   }
private:
   icu_regex_traits(const icu_regex_traits&);
   icu_regex_traits& operator=(const icu_regex_traits&);

   //
   // define the bitmasks offsets we need for additional character properties:
   //
   enum{
      offset_blank = U_CHAR_CATEGORY_COUNT,
      offset_space = U_CHAR_CATEGORY_COUNT+1,
      offset_xdigit = U_CHAR_CATEGORY_COUNT+2,
      offset_underscore = U_CHAR_CATEGORY_COUNT+3,
      offset_unicode = U_CHAR_CATEGORY_COUNT+4,
      offset_any = U_CHAR_CATEGORY_COUNT+5,
      offset_ascii = U_CHAR_CATEGORY_COUNT+6,
      offset_horizontal = U_CHAR_CATEGORY_COUNT+7,
      offset_vertical = U_CHAR_CATEGORY_COUNT+8
   };

   //
   // and now the masks:
   //
   static const char_class_type mask_blank;
   static const char_class_type mask_space;
   static const char_class_type mask_xdigit;
   static const char_class_type mask_underscore;
   static const char_class_type mask_unicode;
   static const char_class_type mask_any;
   static const char_class_type mask_ascii;
   static const char_class_type mask_horizontal;
   static const char_class_type mask_vertical;

   static char_class_type lookup_icu_mask(const ::UChar32* p1, const ::UChar32* p2);

   boost::shared_ptr< ::boost::BOOST_REGEX_DETAIL_NS::icu_regex_traits_implementation> m_pimpl;
};

} // namespace boost

//
// template instances:
//
#define BOOST_REGEX_CHAR_T UChar32
#undef BOOST_REGEX_TRAITS_T
#define BOOST_REGEX_TRAITS_T , icu_regex_traits
#define BOOST_REGEX_ICU_INSTANCES
#ifdef BOOST_REGEX_ICU_INSTANTIATE
#  define BOOST_REGEX_INSTANTIATE
#endif
#include <boost/regex/v4/instances.hpp>
#undef BOOST_REGEX_CHAR_T
#undef BOOST_REGEX_TRAITS_T
#undef BOOST_REGEX_ICU_INSTANCES
#ifdef BOOST_REGEX_INSTANTIATE
#  undef BOOST_REGEX_INSTANTIATE
#endif

namespace boost{

// types:
typedef basic_regex< ::UChar32, icu_regex_traits> u32regex;
typedef match_results<const ::UChar32*> u32match;
typedef match_results<const ::UChar*> u16match;

//
// Construction of 32-bit regex types from UTF-8 and UTF-16 primitives:
//
namespace BOOST_REGEX_DETAIL_NS{

#if !defined(BOOST_NO_MEMBER_TEMPLATES) && !defined(__IBMCPP__)
template <class InputIterator>
inline u32regex do_make_u32regex(InputIterator i, 
                              InputIterator j, 
                              boost::regex_constants::syntax_option_type opt, 
                              const boost::mpl::int_<1>*)
{
   typedef boost::u8_to_u32_iterator<InputIterator, UChar32> conv_type;
   return u32regex(conv_type(i, i, j), conv_type(j, i, j), opt);
}

template <class InputIterator>
inline u32regex do_make_u32regex(InputIterator i, 
                              InputIterator j, 
                              boost::regex_constants::syntax_option_type opt, 
                              const boost::mpl::int_<2>*)
{
   typedef boost::u16_to_u32_iterator<InputIterator, UChar32> conv_type;
   return u32regex(conv_type(i, i, j), conv_type(j, i, j), opt);
}

template <class InputIterator>
inline u32regex do_make_u32regex(InputIterator i, 
                              InputIterator j, 
                              boost::regex_constants::syntax_option_type opt, 
                              const boost::mpl::int_<4>*)
{
   return u32regex(i, j, opt);
}
#else
template <class InputIterator>
inline u32regex do_make_u32regex(InputIterator i, 
                              InputIterator j, 
                              boost::regex_constants::syntax_option_type opt, 
                              const boost::mpl::int_<1>*)
{
   typedef boost::u8_to_u32_iterator<InputIterator, UChar32> conv_type;
   typedef std::vector<UChar32> vector_type;
   vector_type v;
   conv_type a(i, i, j), b(j, i, j);
   while(a != b)
   {
      v.push_back(*a);
      ++a;
   }
   if(v.size())
      return u32regex(&*v.begin(), v.size(), opt);
   return u32regex(static_cast<UChar32 const*>(0), static_cast<u32regex::size_type>(0), opt);
}

template <class InputIterator>
inline u32regex do_make_u32regex(InputIterator i, 
                              InputIterator j, 
                              boost::regex_constants::syntax_option_type opt, 
                              const boost::mpl::int_<2>*)
{
   typedef boost::u16_to_u32_iterator<InputIterator, UChar32> conv_type;
   typedef std::vector<UChar32> vector_type;
   vector_type v;
   conv_type a(i, i, j), b(j, i, j);
   while(a != b)
   {
      v.push_back(*a);
      ++a;
   }
   if(v.size())
      return u32regex(&*v.begin(), v.size(), opt);
   return u32regex(static_cast<UChar32 const*>(0), static_cast<u32regex::size_type>(0), opt);
}

template <class InputIterator>
inline u32regex do_make_u32regex(InputIterator i, 
                              InputIterator j, 
                              boost::regex_constants::syntax_option_type opt, 
                              const boost::mpl::int_<4>*)
{
   typedef std::vector<UChar32> vector_type;
   vector_type v;
   while(i != j)
   {
      v.push_back((UChar32)(*i));
      ++i;
   }
   if(v.size())
      return u32regex(&*v.begin(), v.size(), opt);
   return u32regex(static_cast<UChar32 const*>(0), static_cast<u32regex::size_type>(0), opt);
}
#endif
}

//
// Construction from an iterator pair:
//
template <class InputIterator>
inline u32regex make_u32regex(InputIterator i, 
                              InputIterator j, 
                              boost::regex_constants::syntax_option_type opt)
{
   return BOOST_REGEX_DETAIL_NS::do_make_u32regex(i, j, opt, static_cast<boost::mpl::int_<sizeof(*i)> const*>(0));
}
//
// construction from UTF-8 nul-terminated strings:
//
inline u32regex make_u32regex(const char* p, boost::regex_constants::syntax_option_type opt = boost::regex_constants::perl)
{
   return BOOST_REGEX_DETAIL_NS::do_make_u32regex(p, p + std::strlen(p), opt, static_cast<boost::mpl::int_<1> const*>(0));
}
inline u32regex make_u32regex(const unsigned char* p, boost::regex_constants::syntax_option_type opt = boost::regex_constants::perl)
{
   return BOOST_REGEX_DETAIL_NS::do_make_u32regex(p, p + std::strlen(reinterpret_cast<const char*>(p)), opt, static_cast<boost::mpl::int_<1> const*>(0));
}
//
// construction from UTF-16 nul-terminated strings:
//
#ifndef BOOST_NO_WREGEX
inline u32regex make_u32regex(const wchar_t* p, boost::regex_constants::syntax_option_type opt = boost::regex_constants::perl)
{
   return BOOST_REGEX_DETAIL_NS::do_make_u32regex(p, p + std::wcslen(p), opt, static_cast<boost::mpl::int_<sizeof(wchar_t)> const*>(0));
}
#endif
#if !defined(U_WCHAR_IS_UTF16) && (U_SIZEOF_WCHAR_T != 2)
inline u32regex make_u32regex(const UChar* p, boost::regex_constants::syntax_option_type opt = boost::regex_constants::perl)
{
   return BOOST_REGEX_DETAIL_NS::do_make_u32regex(p, p + u_strlen(p), opt, static_cast<boost::mpl::int_<2> const*>(0));
}
#endif
//
// construction from basic_string class-template:
//
template<class C, class T, class A>
inline u32regex make_u32regex(const std::basic_string<C, T, A>& s, boost::regex_constants::syntax_option_type opt = boost::regex_constants::perl)
{
   return BOOST_REGEX_DETAIL_NS::do_make_u32regex(s.begin(), s.end(), opt, static_cast<boost::mpl::int_<sizeof(C)> const*>(0));
}
//
// Construction from ICU string type:
//
inline u32regex make_u32regex(const U_NAMESPACE_QUALIFIER UnicodeString& s, boost::regex_constants::syntax_option_type opt = boost::regex_constants::perl)
{
   return BOOST_REGEX_DETAIL_NS::do_make_u32regex(s.getBuffer(), s.getBuffer() + s.length(), opt, static_cast<boost::mpl::int_<2> const*>(0));
}

//
// regex_match overloads that widen the character type as appropriate:
//
namespace BOOST_REGEX_DETAIL_NS{
template<class MR1, class MR2>
void copy_results(MR1& out, MR2 const& in)
{
   // copy results from an adapted MR2 match_results:
   out.set_size(in.size(), in.prefix().first.base(), in.suffix().second.base());
   out.set_base(in.base().base());
   for(int i = 0; i < (int)in.size(); ++i)
   {
      if(in[i].matched || !i)
      {
         out.set_first(in[i].first.base(), i);
         out.set_second(in[i].second.base(), i, in[i].matched);
      }
   }
#ifdef BOOST_REGEX_MATCH_EXTRA
   // Copy full capture info as well:
   for(int i = 0; i < (int)in.size(); ++i)
   {
      if(in[i].captures().size())
      {
         out[i].get_captures().assign(in[i].captures().size(), typename MR1::value_type());
         for(int j = 0; j < out[i].captures().size(); ++j)
         {
            out[i].get_captures()[j].first = in[i].captures()[j].first.base();
            out[i].get_captures()[j].second = in[i].captures()[j].second.base();
            out[i].get_captures()[j].matched = in[i].captures()[j].matched;
         }
      }
   }
#endif
}

template <class BidiIterator, class Allocator>
inline bool do_regex_match(BidiIterator first, BidiIterator last, 
                 match_results<BidiIterator, Allocator>& m, 
                 const u32regex& e, 
                 match_flag_type flags,
                 boost::mpl::int_<4> const*)
{
   return ::boost::regex_match(first, last, m, e, flags);
}
template <class BidiIterator, class Allocator>
bool do_regex_match(BidiIterator first, BidiIterator last, 
                 match_results<BidiIterator, Allocator>& m, 
                 const u32regex& e, 
                 match_flag_type flags,
                 boost::mpl::int_<2> const*)
{
   typedef u16_to_u32_iterator<BidiIterator, UChar32> conv_type;
   typedef match_results<conv_type>                   match_type;
   //typedef typename match_type::allocator_type        alloc_type;
   match_type what;
   bool result = ::boost::regex_match(conv_type(first, first, last), conv_type(last, first, last), what, e, flags);
   // copy results across to m:
   if(result) copy_results(m, what);
   return result;
}
template <class BidiIterator, class Allocator>
bool do_regex_match(BidiIterator first, BidiIterator last, 
                 match_results<BidiIterator, Allocator>& m, 
                 const u32regex& e, 
                 match_flag_type flags,
                 boost::mpl::int_<1> const*)
{
   typedef u8_to_u32_iterator<BidiIterator, UChar32>  conv_type;
   typedef match_results<conv_type>                   match_type;
   //typedef typename match_type::allocator_type        alloc_type;
   match_type what;
   bool result = ::boost::regex_match(conv_type(first, first, last), conv_type(last, first, last), what, e, flags);
   // copy results across to m:
   if(result) copy_results(m, what);
   return result;
}
} // namespace BOOST_REGEX_DETAIL_NS

template <class BidiIterator, class Allocator>
inline bool u32regex_match(BidiIterator first, BidiIterator last, 
                 match_results<BidiIterator, Allocator>& m, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_match(first, last, m, e, flags, static_cast<mpl::int_<sizeof(*first)> const*>(0));
}
inline bool u32regex_match(const UChar* p, 
                 match_results<const UChar*>& m, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_match(p, p+u_strlen(p), m, e, flags, static_cast<mpl::int_<2> const*>(0));
}
#if !defined(U_WCHAR_IS_UTF16) && (U_SIZEOF_WCHAR_T != 2) && !defined(BOOST_NO_WREGEX)
inline bool u32regex_match(const wchar_t* p, 
                 match_results<const wchar_t*>& m, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_match(p, p+std::wcslen(p), m, e, flags, static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}
#endif
inline bool u32regex_match(const char* p, 
                 match_results<const char*>& m, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_match(p, p+std::strlen(p), m, e, flags, static_cast<mpl::int_<1> const*>(0));
}
inline bool u32regex_match(const unsigned char* p, 
                 match_results<const unsigned char*>& m, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_match(p, p+std::strlen((const char*)p), m, e, flags, static_cast<mpl::int_<1> const*>(0));
}
inline bool u32regex_match(const std::string& s, 
                        match_results<std::string::const_iterator>& m, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_match(s.begin(), s.end(), m, e, flags, static_cast<mpl::int_<1> const*>(0));
}
#ifndef BOOST_NO_STD_WSTRING
inline bool u32regex_match(const std::wstring& s, 
                        match_results<std::wstring::const_iterator>& m, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_match(s.begin(), s.end(), m, e, flags, static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}
#endif
inline bool u32regex_match(const U_NAMESPACE_QUALIFIER UnicodeString& s, 
                        match_results<const UChar*>& m, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_match(s.getBuffer(), s.getBuffer() + s.length(), m, e, flags, static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}
//
// regex_match overloads that do not return what matched:
//
template <class BidiIterator>
inline bool u32regex_match(BidiIterator first, BidiIterator last, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   match_results<BidiIterator> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_match(first, last, m, e, flags, static_cast<mpl::int_<sizeof(*first)> const*>(0));
}
inline bool u32regex_match(const UChar* p, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   match_results<const UChar*> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_match(p, p+u_strlen(p), m, e, flags, static_cast<mpl::int_<2> const*>(0));
}
#if !defined(U_WCHAR_IS_UTF16) && (U_SIZEOF_WCHAR_T != 2) && !defined(BOOST_NO_WREGEX)
inline bool u32regex_match(const wchar_t* p, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   match_results<const wchar_t*> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_match(p, p+std::wcslen(p), m, e, flags, static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}
#endif
inline bool u32regex_match(const char* p, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   match_results<const char*> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_match(p, p+std::strlen(p), m, e, flags, static_cast<mpl::int_<1> const*>(0));
}
inline bool u32regex_match(const unsigned char* p, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   match_results<const unsigned char*> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_match(p, p+std::strlen((const char*)p), m, e, flags, static_cast<mpl::int_<1> const*>(0));
}
inline bool u32regex_match(const std::string& s, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   match_results<std::string::const_iterator> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_match(s.begin(), s.end(), m, e, flags, static_cast<mpl::int_<1> const*>(0));
}
#ifndef BOOST_NO_STD_WSTRING
inline bool u32regex_match(const std::wstring& s, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   match_results<std::wstring::const_iterator> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_match(s.begin(), s.end(), m, e, flags, static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}
#endif
inline bool u32regex_match(const U_NAMESPACE_QUALIFIER UnicodeString& s, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   match_results<const UChar*> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_match(s.getBuffer(), s.getBuffer() + s.length(), m, e, flags, static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}

//
// regex_search overloads that widen the character type as appropriate:
//
namespace BOOST_REGEX_DETAIL_NS{
template <class BidiIterator, class Allocator>
inline bool do_regex_search(BidiIterator first, BidiIterator last, 
                 match_results<BidiIterator, Allocator>& m, 
                 const u32regex& e, 
                 match_flag_type flags,
                 BidiIterator base,
                 boost::mpl::int_<4> const*)
{
   return ::boost::regex_search(first, last, m, e, flags, base);
}
template <class BidiIterator, class Allocator>
bool do_regex_search(BidiIterator first, BidiIterator last, 
                 match_results<BidiIterator, Allocator>& m, 
                 const u32regex& e, 
                 match_flag_type flags,
                 BidiIterator base,
                 boost::mpl::int_<2> const*)
{
   typedef u16_to_u32_iterator<BidiIterator, UChar32> conv_type;
   typedef match_results<conv_type>                   match_type;
   //typedef typename match_type::allocator_type        alloc_type;
   match_type what;
   bool result = ::boost::regex_search(conv_type(first, first, last), conv_type(last, first, last), what, e, flags, conv_type(base));
   // copy results across to m:
   if(result) copy_results(m, what);
   return result;
}
template <class BidiIterator, class Allocator>
bool do_regex_search(BidiIterator first, BidiIterator last, 
                 match_results<BidiIterator, Allocator>& m, 
                 const u32regex& e, 
                 match_flag_type flags,
                 BidiIterator base,
                 boost::mpl::int_<1> const*)
{
   typedef u8_to_u32_iterator<BidiIterator, UChar32>  conv_type;
   typedef match_results<conv_type>                   match_type;
   //typedef typename match_type::allocator_type        alloc_type;
   match_type what;
   bool result = ::boost::regex_search(conv_type(first, first, last), conv_type(last, first, last), what, e, flags, conv_type(base));
   // copy results across to m:
   if(result) copy_results(m, what);
   return result;
}
}

template <class BidiIterator, class Allocator>
inline bool u32regex_search(BidiIterator first, BidiIterator last, 
                 match_results<BidiIterator, Allocator>& m, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_search(first, last, m, e, flags, first, static_cast<mpl::int_<sizeof(*first)> const*>(0));
}
template <class BidiIterator, class Allocator>
inline bool u32regex_search(BidiIterator first, BidiIterator last, 
                 match_results<BidiIterator, Allocator>& m, 
                 const u32regex& e, 
                 match_flag_type flags,
                 BidiIterator base)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_search(first, last, m, e, flags, base, static_cast<mpl::int_<sizeof(*first)> const*>(0));
}
inline bool u32regex_search(const UChar* p, 
                 match_results<const UChar*>& m, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_search(p, p+u_strlen(p), m, e, flags, p, static_cast<mpl::int_<2> const*>(0));
}
#if !defined(U_WCHAR_IS_UTF16) && (U_SIZEOF_WCHAR_T != 2) && !defined(BOOST_NO_WREGEX)
inline bool u32regex_search(const wchar_t* p, 
                 match_results<const wchar_t*>& m, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_search(p, p+std::wcslen(p), m, e, flags, p, static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}
#endif
inline bool u32regex_search(const char* p, 
                 match_results<const char*>& m, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_search(p, p+std::strlen(p), m, e, flags, p, static_cast<mpl::int_<1> const*>(0));
}
inline bool u32regex_search(const unsigned char* p, 
                 match_results<const unsigned char*>& m, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_search(p, p+std::strlen((const char*)p), m, e, flags, p, static_cast<mpl::int_<1> const*>(0));
}
inline bool u32regex_search(const std::string& s, 
                        match_results<std::string::const_iterator>& m, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_search(s.begin(), s.end(), m, e, flags, s.begin(), static_cast<mpl::int_<1> const*>(0));
}
#ifndef BOOST_NO_STD_WSTRING
inline bool u32regex_search(const std::wstring& s, 
                        match_results<std::wstring::const_iterator>& m, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_search(s.begin(), s.end(), m, e, flags, s.begin(), static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}
#endif
inline bool u32regex_search(const U_NAMESPACE_QUALIFIER UnicodeString& s, 
                        match_results<const UChar*>& m, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::do_regex_search(s.getBuffer(), s.getBuffer() + s.length(), m, e, flags, s.getBuffer(), static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}
template <class BidiIterator>
inline bool u32regex_search(BidiIterator first, BidiIterator last, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   match_results<BidiIterator> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_search(first, last, m, e, flags, first, static_cast<mpl::int_<sizeof(*first)> const*>(0));
}
inline bool u32regex_search(const UChar* p, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   match_results<const UChar*> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_search(p, p+u_strlen(p), m, e, flags, p, static_cast<mpl::int_<2> const*>(0));
}
#if !defined(U_WCHAR_IS_UTF16) && (U_SIZEOF_WCHAR_T != 2) && !defined(BOOST_NO_WREGEX)
inline bool u32regex_search(const wchar_t* p, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   match_results<const wchar_t*> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_search(p, p+std::wcslen(p), m, e, flags, p, static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}
#endif
inline bool u32regex_search(const char* p, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   match_results<const char*> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_search(p, p+std::strlen(p), m, e, flags, p, static_cast<mpl::int_<1> const*>(0));
}
inline bool u32regex_search(const unsigned char* p, 
                 const u32regex& e, 
                 match_flag_type flags = match_default)
{
   match_results<const unsigned char*> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_search(p, p+std::strlen((const char*)p), m, e, flags, p, static_cast<mpl::int_<1> const*>(0));
}
inline bool u32regex_search(const std::string& s, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   match_results<std::string::const_iterator> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_search(s.begin(), s.end(), m, e, flags, s.begin(), static_cast<mpl::int_<1> const*>(0));
}
#ifndef BOOST_NO_STD_WSTRING
inline bool u32regex_search(const std::wstring& s, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   match_results<std::wstring::const_iterator> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_search(s.begin(), s.end(), m, e, flags, s.begin(), static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}
#endif
inline bool u32regex_search(const U_NAMESPACE_QUALIFIER UnicodeString& s, 
                        const u32regex& e, 
                        match_flag_type flags = match_default)
{
   match_results<const UChar*> m;
   return BOOST_REGEX_DETAIL_NS::do_regex_search(s.getBuffer(), s.getBuffer() + s.length(), m, e, flags, s.getBuffer(), static_cast<mpl::int_<sizeof(wchar_t)> const*>(0));
}

//
// overloads for regex_replace with utf-8 and utf-16 data types:
//
namespace BOOST_REGEX_DETAIL_NS{
template <class I>
inline std::pair< boost::u8_to_u32_iterator<I>, boost::u8_to_u32_iterator<I> >
   make_utf32_seq(I i, I j, mpl::int_<1> const*)
{
   return std::pair< boost::u8_to_u32_iterator<I>, boost::u8_to_u32_iterator<I> >(boost::u8_to_u32_iterator<I>(i, i, j), boost::u8_to_u32_iterator<I>(j, i, j));
}
template <class I>
inline std::pair< boost::u16_to_u32_iterator<I>, boost::u16_to_u32_iterator<I> >
   make_utf32_seq(I i, I j, mpl::int_<2> const*)
{
   return std::pair< boost::u16_to_u32_iterator<I>, boost::u16_to_u32_iterator<I> >(boost::u16_to_u32_iterator<I>(i, i, j), boost::u16_to_u32_iterator<I>(j, i, j));
}
template <class I>
inline std::pair< I, I >
   make_utf32_seq(I i, I j, mpl::int_<4> const*)
{
   return std::pair< I, I >(i, j);
}
template <class charT>
inline std::pair< boost::u8_to_u32_iterator<const charT*>, boost::u8_to_u32_iterator<const charT*> >
   make_utf32_seq(const charT* p, mpl::int_<1> const*)
{
   std::size_t len = std::strlen((const char*)p);
   return std::pair< boost::u8_to_u32_iterator<const charT*>, boost::u8_to_u32_iterator<const charT*> >(boost::u8_to_u32_iterator<const charT*>(p, p, p+len), boost::u8_to_u32_iterator<const charT*>(p+len, p, p+len));
}
template <class charT>
inline std::pair< boost::u16_to_u32_iterator<const charT*>, boost::u16_to_u32_iterator<const charT*> >
   make_utf32_seq(const charT* p, mpl::int_<2> const*)
{
   std::size_t len = u_strlen((const UChar*)p);
   return std::pair< boost::u16_to_u32_iterator<const charT*>, boost::u16_to_u32_iterator<const charT*> >(boost::u16_to_u32_iterator<const charT*>(p, p, p + len), boost::u16_to_u32_iterator<const charT*>(p+len, p, p + len));
}
template <class charT>
inline std::pair< const charT*, const charT* >
   make_utf32_seq(const charT* p, mpl::int_<4> const*)
{
   return std::pair< const charT*, const charT* >(p, p+icu_regex_traits::length((UChar32 const*)p));
}
template <class OutputIterator>
inline OutputIterator make_utf32_out(OutputIterator o, mpl::int_<4> const*)
{
   return o;
}
template <class OutputIterator>
inline utf16_output_iterator<OutputIterator> make_utf32_out(OutputIterator o, mpl::int_<2> const*)
{
   return o;
}
template <class OutputIterator>
inline utf8_output_iterator<OutputIterator> make_utf32_out(OutputIterator o, mpl::int_<1> const*)
{
   return o;
}

template <class OutputIterator, class I1, class I2>
OutputIterator do_regex_replace(OutputIterator out,
                                 std::pair<I1, I1> const& in,
                                 const u32regex& e, 
                                 const std::pair<I2, I2>& fmt, 
                                 match_flag_type flags
                                 )
{
   // unfortunately we have to copy the format string in order to pass in onward:
   std::vector<UChar32> f;
#ifndef BOOST_NO_TEMPLATED_ITERATOR_CONSTRUCTORS
   f.assign(fmt.first, fmt.second);
#else
   f.clear();
   I2 pos = fmt.first;
   while(pos != fmt.second)
      f.push_back(*pos++);
#endif
   
   regex_iterator<I1, UChar32, icu_regex_traits> i(in.first, in.second, e, flags);
   regex_iterator<I1, UChar32, icu_regex_traits> j;
   if(i == j)
   {
      if(!(flags & regex_constants::format_no_copy))
         out = BOOST_REGEX_DETAIL_NS::copy(in.first, in.second, out);
   }
   else
   {
      I1 last_m = in.first;
      while(i != j)
      {
         if(!(flags & regex_constants::format_no_copy))
            out = BOOST_REGEX_DETAIL_NS::copy(i->prefix().first, i->prefix().second, out); 
         if(f.size())
            out = ::boost::BOOST_REGEX_DETAIL_NS::regex_format_imp(out, *i, &*f.begin(), &*f.begin() + f.size(), flags, e.get_traits());
         else
            out = ::boost::BOOST_REGEX_DETAIL_NS::regex_format_imp(out, *i, static_cast<UChar32 const*>(0), static_cast<UChar32 const*>(0), flags, e.get_traits());
         last_m = (*i)[0].second;
         if(flags & regex_constants::format_first_only)
            break;
         ++i;
      }
      if(!(flags & regex_constants::format_no_copy))
         out = BOOST_REGEX_DETAIL_NS::copy(last_m, in.second, out);
   }
   return out;
}
template <class BaseIterator>
inline const BaseIterator& extract_output_base(const BaseIterator& b)
{
   return b;
}
template <class BaseIterator>
inline BaseIterator extract_output_base(const utf8_output_iterator<BaseIterator>& b)
{
   return b.base();
}
template <class BaseIterator>
inline BaseIterator extract_output_base(const utf16_output_iterator<BaseIterator>& b)
{
   return b.base();
}
}  // BOOST_REGEX_DETAIL_NS

template <class OutputIterator, class BidirectionalIterator, class charT>
inline OutputIterator u32regex_replace(OutputIterator out,
                         BidirectionalIterator first,
                         BidirectionalIterator last,
                         const u32regex& e, 
                         const charT* fmt, 
                         match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::extract_output_base
    (
      BOOST_REGEX_DETAIL_NS::do_regex_replace(
         BOOST_REGEX_DETAIL_NS::make_utf32_out(out, static_cast<mpl::int_<sizeof(*first)> const*>(0)),
         BOOST_REGEX_DETAIL_NS::make_utf32_seq(first, last, static_cast<mpl::int_<sizeof(*first)> const*>(0)),
         e,
         BOOST_REGEX_DETAIL_NS::make_utf32_seq(fmt, static_cast<mpl::int_<sizeof(*fmt)> const*>(0)),
         flags)
      );
}

template <class OutputIterator, class Iterator, class charT>
inline OutputIterator u32regex_replace(OutputIterator out,
                         Iterator first,
                         Iterator last,
                         const u32regex& e, 
                         const std::basic_string<charT>& fmt,
                         match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::extract_output_base
    (
      BOOST_REGEX_DETAIL_NS::do_regex_replace(
         BOOST_REGEX_DETAIL_NS::make_utf32_out(out, static_cast<mpl::int_<sizeof(*first)> const*>(0)),
         BOOST_REGEX_DETAIL_NS::make_utf32_seq(first, last, static_cast<mpl::int_<sizeof(*first)> const*>(0)),
         e,
         BOOST_REGEX_DETAIL_NS::make_utf32_seq(fmt.begin(), fmt.end(), static_cast<mpl::int_<sizeof(charT)> const*>(0)),
         flags)
      );
}

template <class OutputIterator, class Iterator>
inline OutputIterator u32regex_replace(OutputIterator out,
                         Iterator first,
                         Iterator last,
                         const u32regex& e, 
                         const U_NAMESPACE_QUALIFIER UnicodeString& fmt,
                         match_flag_type flags = match_default)
{
   return BOOST_REGEX_DETAIL_NS::extract_output_base
   (
      BOOST_REGEX_DETAIL_NS::do_regex_replace(
         BOOST_REGEX_DETAIL_NS::make_utf32_out(out, static_cast<mpl::int_<sizeof(*first)> const*>(0)),
         BOOST_REGEX_DETAIL_NS::make_utf32_seq(first, last, static_cast<mpl::int_<sizeof(*first)> const*>(0)),
         e,
         BOOST_REGEX_DETAIL_NS::make_utf32_seq(fmt.getBuffer(), fmt.getBuffer() + fmt.length(), static_cast<mpl::int_<2> const*>(0)),
         flags)
      );
}

template <class charT>
std::basic_string<charT> u32regex_replace(const std::basic_string<charT>& s,
                         const u32regex& e, 
                         const charT* fmt,
                         match_flag_type flags = match_default)
{
   std::basic_string<charT> result;
   BOOST_REGEX_DETAIL_NS::string_out_iterator<std::basic_string<charT> > i(result);
   u32regex_replace(i, s.begin(), s.end(), e, fmt, flags);
   return result;
}

template <class charT>
std::basic_string<charT> u32regex_replace(const std::basic_string<charT>& s,
                         const u32regex& e, 
                         const std::basic_string<charT>& fmt,
                         match_flag_type flags = match_default)
{
   std::basic_string<charT> result;
   BOOST_REGEX_DETAIL_NS::string_out_iterator<std::basic_string<charT> > i(result);
   u32regex_replace(i, s.begin(), s.end(), e, fmt.c_str(), flags);
   return result;
}

namespace BOOST_REGEX_DETAIL_NS{

class unicode_string_out_iterator
{
   U_NAMESPACE_QUALIFIER UnicodeString* out;
public:
   unicode_string_out_iterator(U_NAMESPACE_QUALIFIER UnicodeString& s) : out(&s) {}
   unicode_string_out_iterator& operator++() { return *this; }
   unicode_string_out_iterator& operator++(int) { return *this; }
   unicode_string_out_iterator& operator*() { return *this; }
   unicode_string_out_iterator& operator=(UChar v) 
   { 
      *out += v; 
      return *this; 
   }
   typedef std::ptrdiff_t difference_type;
   typedef UChar value_type;
   typedef value_type* pointer;
   typedef value_type& reference;
   typedef std::output_iterator_tag iterator_category;
};

}

inline U_NAMESPACE_QUALIFIER UnicodeString u32regex_replace(const U_NAMESPACE_QUALIFIER UnicodeString& s,
                         const u32regex& e, 
                         const UChar* fmt,
                         match_flag_type flags = match_default)
{
   U_NAMESPACE_QUALIFIER UnicodeString result;
   BOOST_REGEX_DETAIL_NS::unicode_string_out_iterator i(result);
   u32regex_replace(i, s.getBuffer(), s.getBuffer()+s.length(), e, fmt, flags);
   return result;
}

inline U_NAMESPACE_QUALIFIER UnicodeString u32regex_replace(const U_NAMESPACE_QUALIFIER UnicodeString& s,
                         const u32regex& e, 
                         const U_NAMESPACE_QUALIFIER UnicodeString& fmt,
                         match_flag_type flags = match_default)
{
   U_NAMESPACE_QUALIFIER UnicodeString result;
   BOOST_REGEX_DETAIL_NS::unicode_string_out_iterator i(result);
   BOOST_REGEX_DETAIL_NS::do_regex_replace(
         BOOST_REGEX_DETAIL_NS::make_utf32_out(i, static_cast<mpl::int_<2> const*>(0)),
         BOOST_REGEX_DETAIL_NS::make_utf32_seq(s.getBuffer(), s.getBuffer()+s.length(), static_cast<mpl::int_<2> const*>(0)),
         e,
         BOOST_REGEX_DETAIL_NS::make_utf32_seq(fmt.getBuffer(), fmt.getBuffer() + fmt.length(), static_cast<mpl::int_<2> const*>(0)),
         flags);
   return result;
}

} // namespace boost.

#ifdef BOOST_MSVC
#pragma warning (pop)
#endif

#include <boost/regex/v4/u32regex_iterator.hpp>
#include <boost/regex/v4/u32regex_token_iterator.hpp>

#endif
