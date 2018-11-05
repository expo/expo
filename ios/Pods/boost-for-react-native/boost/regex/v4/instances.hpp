/*
 *
 * Copyright (c) 1998-2002
 * John Maddock
 *
 * Use, modification and distribution are subject to the
 * Boost Software License, Version 1.0. (See accompanying file
 * LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
 *
 */

 /*
  *   LOCATION:    see http://www.boost.org for most recent version.
  *   FILE         instances.cpp
  *   VERSION      see <boost/version.hpp>
  *   DESCRIPTION: Defines those template instances that are placed in the
  *                library rather than in the users object files.
  */

//
// note no include guard, we may include this multiple times:
//
#ifndef BOOST_REGEX_NO_EXTERNAL_TEMPLATES

namespace boost{

//
// this header can be included multiple times, each time with
// a different character type, BOOST_REGEX_CHAR_T must be defined
// first:
//
#ifndef BOOST_REGEX_CHAR_T
#  error "BOOST_REGEX_CHAR_T not defined"
#endif

#ifndef BOOST_REGEX_TRAITS_T
#  define BOOST_REGEX_TRAITS_T , boost::regex_traits<BOOST_REGEX_CHAR_T >
#endif

//
// what follows is compiler specific:
//

#if  defined(__BORLANDC__) && (__BORLANDC__ < 0x600)

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

#  ifndef BOOST_REGEX_INSTANTIATE
#     pragma option push -Jgx
#  endif

template class BOOST_REGEX_DECL basic_regex< BOOST_REGEX_CHAR_T BOOST_REGEX_TRAITS_T >;
template class BOOST_REGEX_DECL match_results< const BOOST_REGEX_CHAR_T* >;
#ifndef BOOST_NO_STD_ALLOCATOR
template class BOOST_REGEX_DECL ::boost::BOOST_REGEX_DETAIL_NS::perl_matcher<BOOST_REGEX_CHAR_T const *, match_results< const BOOST_REGEX_CHAR_T* >::allocator_type BOOST_REGEX_TRAITS_T >;
#endif

#  ifndef BOOST_REGEX_INSTANTIATE
#     pragma option pop
#  endif

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#elif defined(BOOST_MSVC) || defined(__ICL)

#  ifndef BOOST_REGEX_INSTANTIATE
#     ifdef __GNUC__
#        define template __extension__ extern template
#     else
#        if BOOST_MSVC > 1310
#           define BOOST_REGEX_TEMPLATE_DECL
#        endif
#        define template extern template
#     endif
#  endif

#ifndef BOOST_REGEX_TEMPLATE_DECL
#  define BOOST_REGEX_TEMPLATE_DECL BOOST_REGEX_DECL
#endif

#  ifdef BOOST_MSVC
#     pragma warning(push)
#     pragma warning(disable : 4251 4231)
#     if BOOST_MSVC < 1600
#     pragma warning(disable : 4660)
#     endif
#  endif

template class BOOST_REGEX_TEMPLATE_DECL basic_regex< BOOST_REGEX_CHAR_T BOOST_REGEX_TRAITS_T >;

template class BOOST_REGEX_TEMPLATE_DECL match_results< const BOOST_REGEX_CHAR_T* >;
#ifndef BOOST_NO_STD_ALLOCATOR
template class BOOST_REGEX_TEMPLATE_DECL ::boost::BOOST_REGEX_DETAIL_NS::perl_matcher<BOOST_REGEX_CHAR_T const *, match_results< const BOOST_REGEX_CHAR_T* >::allocator_type BOOST_REGEX_TRAITS_T >;
#endif
#if !(defined(BOOST_DINKUMWARE_STDLIB) && (BOOST_DINKUMWARE_STDLIB <= 1))\
   && !(defined(BOOST_INTEL_CXX_VERSION) && (BOOST_INTEL_CXX_VERSION <= 800))\
   && !(defined(__SGI_STL_PORT) || defined(_STLPORT_VERSION))\
   && !defined(BOOST_REGEX_ICU_INSTANCES)
template class BOOST_REGEX_TEMPLATE_DECL match_results< std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator >;
#ifndef BOOST_NO_STD_ALLOCATOR
template class BOOST_REGEX_TEMPLATE_DECL ::boost::BOOST_REGEX_DETAIL_NS::perl_matcher< std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator, match_results< std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator >::allocator_type, boost::regex_traits<BOOST_REGEX_CHAR_T > >;
#endif
#endif


#  ifdef BOOST_MSVC
#     pragma warning(pop)
#  endif

#  ifdef template
#     undef template
#  endif

#undef BOOST_REGEX_TEMPLATE_DECL

#elif (defined(__GNUC__) && (__GNUC__ >= 3)) || !defined(BOOST_NO_CXX11_EXTERN_TEMPLATE)

#ifdef __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wkeyword-macro"
#endif

#  ifndef BOOST_REGEX_INSTANTIATE
#     ifdef __GNUC__
#        define template __extension__ extern template
#     else
#        define template extern template
#     endif
#  endif

#if !defined(BOOST_NO_STD_LOCALE) && !defined(BOOST_REGEX_ICU_INSTANCES)
namespace BOOST_REGEX_DETAIL_NS{
template BOOST_REGEX_DECL
std::locale cpp_regex_traits_base<BOOST_REGEX_CHAR_T>::imbue(const std::locale& l);

template BOOST_REGEX_DECL
cpp_regex_traits_implementation<BOOST_REGEX_CHAR_T>::string_type 
   cpp_regex_traits_implementation<BOOST_REGEX_CHAR_T>::transform_primary(const BOOST_REGEX_CHAR_T* p1, const BOOST_REGEX_CHAR_T* p2) const;
template BOOST_REGEX_DECL
cpp_regex_traits_implementation<BOOST_REGEX_CHAR_T>::string_type 
   cpp_regex_traits_implementation<BOOST_REGEX_CHAR_T>::transform(const BOOST_REGEX_CHAR_T* p1, const BOOST_REGEX_CHAR_T* p2) const;
template BOOST_REGEX_DECL
cpp_regex_traits_implementation<BOOST_REGEX_CHAR_T>::string_type 
   cpp_regex_traits_implementation<BOOST_REGEX_CHAR_T>::lookup_collatename(const BOOST_REGEX_CHAR_T* p1, const BOOST_REGEX_CHAR_T* p2) const;
template BOOST_REGEX_DECL
void cpp_regex_traits_implementation<BOOST_REGEX_CHAR_T>::init();
template BOOST_REGEX_DECL
cpp_regex_traits_implementation<BOOST_REGEX_CHAR_T>::char_class_type 
   cpp_regex_traits_implementation<BOOST_REGEX_CHAR_T>::lookup_classname_imp(const BOOST_REGEX_CHAR_T* p1, const BOOST_REGEX_CHAR_T* p2) const;
#ifdef BOOST_REGEX_BUGGY_CTYPE_FACET
template BOOST_REGEX_DECL
bool cpp_regex_traits_implementation<BOOST_REGEX_CHAR_T>::isctype(const BOOST_REGEX_CHAR_T c, char_class_type mask) const;
#endif
} // namespace
template BOOST_REGEX_DECL
boost::intmax_t cpp_regex_traits<BOOST_REGEX_CHAR_T>::toi(const BOOST_REGEX_CHAR_T*& first, const BOOST_REGEX_CHAR_T* last, int radix)const;
template BOOST_REGEX_DECL
std::string cpp_regex_traits<BOOST_REGEX_CHAR_T>::catalog_name(const std::string& name);
template BOOST_REGEX_DECL
std::string& cpp_regex_traits<BOOST_REGEX_CHAR_T>::get_catalog_name_inst();
template BOOST_REGEX_DECL
std::string cpp_regex_traits<BOOST_REGEX_CHAR_T>::get_catalog_name();
#ifdef BOOST_HAS_THREADS
template BOOST_REGEX_DECL
static_mutex& cpp_regex_traits<BOOST_REGEX_CHAR_T>::get_mutex_inst();
#endif
#endif

template BOOST_REGEX_DECL basic_regex<BOOST_REGEX_CHAR_T BOOST_REGEX_TRAITS_T >& 
   basic_regex<BOOST_REGEX_CHAR_T BOOST_REGEX_TRAITS_T >::do_assign(
      const BOOST_REGEX_CHAR_T* p1, 
      const BOOST_REGEX_CHAR_T* p2, 
      flag_type f);
template BOOST_REGEX_DECL basic_regex<BOOST_REGEX_CHAR_T BOOST_REGEX_TRAITS_T >::locale_type BOOST_REGEX_CALL 
   basic_regex<BOOST_REGEX_CHAR_T BOOST_REGEX_TRAITS_T >::imbue(locale_type l);

template BOOST_REGEX_DECL void BOOST_REGEX_CALL 
   match_results<const BOOST_REGEX_CHAR_T*>::maybe_assign(
      const match_results<const BOOST_REGEX_CHAR_T*>& m);

namespace BOOST_REGEX_DETAIL_NS{
template BOOST_REGEX_DECL void perl_matcher<BOOST_REGEX_CHAR_T const *, match_results< const BOOST_REGEX_CHAR_T* >::allocator_type BOOST_REGEX_TRAITS_T >::construct_init(
      const basic_regex<BOOST_REGEX_CHAR_T BOOST_REGEX_TRAITS_T >& e, match_flag_type f);
template BOOST_REGEX_DECL bool perl_matcher<BOOST_REGEX_CHAR_T const *, match_results< const BOOST_REGEX_CHAR_T* >::allocator_type BOOST_REGEX_TRAITS_T >::match();
template BOOST_REGEX_DECL bool perl_matcher<BOOST_REGEX_CHAR_T const *, match_results< const BOOST_REGEX_CHAR_T* >::allocator_type BOOST_REGEX_TRAITS_T >::find();
} // namespace

#if (defined(__GLIBCPP__) || defined(__GLIBCXX__)) \
   && !defined(BOOST_REGEX_ICU_INSTANCES)\
   && !defined(__SGI_STL_PORT)\
   && !defined(_STLPORT_VERSION)
// std:basic_string<>::const_iterator instances as well:
template BOOST_REGEX_DECL void BOOST_REGEX_CALL 
   match_results<std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator>::maybe_assign(
      const match_results<std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator>& m);

namespace BOOST_REGEX_DETAIL_NS{
template BOOST_REGEX_DECL void perl_matcher<std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator, match_results< std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator >::allocator_type, boost::regex_traits<BOOST_REGEX_CHAR_T > >::construct_init(
      const basic_regex<BOOST_REGEX_CHAR_T>& e, match_flag_type f);
template BOOST_REGEX_DECL bool perl_matcher<std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator, match_results< std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator >::allocator_type, boost::regex_traits<BOOST_REGEX_CHAR_T > >::match();
template BOOST_REGEX_DECL bool perl_matcher<std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator, match_results< std::basic_string<BOOST_REGEX_CHAR_T>::const_iterator >::allocator_type, boost::regex_traits<BOOST_REGEX_CHAR_T > >::find();
} // namespace
#endif

#  ifdef template
#     undef template
#  endif

#ifdef __clang__
#pragma clang diagnostic pop
#endif
#endif

} // namespace boost

#endif // BOOST_REGEX_NO_EXTERNAL_TEMPLATES





