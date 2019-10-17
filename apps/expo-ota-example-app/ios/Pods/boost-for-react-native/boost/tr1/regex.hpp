//  (C) Copyright John Maddock 2005.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_TR1_REGEX_HPP_INCLUDED
#  define BOOST_TR1_REGEX_HPP_INCLUDED
#  include <boost/tr1/detail/config.hpp>

#ifdef BOOST_HAS_TR1_REGEX

#  if defined(BOOST_HAS_INCLUDE_NEXT) && !defined(BOOST_TR1_DISABLE_INCLUDE_NEXT)
#     include_next BOOST_TR1_HEADER(regex)
#  else
#     include <boost/tr1/detail/config_all.hpp>
#     include BOOST_TR1_STD_HEADER(BOOST_TR1_PATH(regex))
#  endif

#else

#include <boost/regex.hpp>

namespace std{ namespace tr1{

// [7.5] Regex constants
namespace regex_constants {

using ::boost::regex_constants::syntax_option_type;
using ::boost::regex_constants::icase;
using ::boost::regex_constants::nosubs;
using ::boost::regex_constants::optimize;
using ::boost::regex_constants::collate;
using ::boost::regex_constants::ECMAScript;
using ::boost::regex_constants::basic;
using ::boost::regex_constants::extended;
using ::boost::regex_constants::awk;
using ::boost::regex_constants::grep;
using ::boost::regex_constants::egrep;

using ::boost::regex_constants::match_flag_type;
using ::boost::regex_constants::match_default;
using ::boost::regex_constants::match_not_bol;
using ::boost::regex_constants::match_not_eol;
using ::boost::regex_constants::match_not_bow;
using ::boost::regex_constants::match_not_eow;
using ::boost::regex_constants::match_any;
using ::boost::regex_constants::match_not_null;
using ::boost::regex_constants::match_continuous;
using ::boost::regex_constants::match_prev_avail;
using ::boost::regex_constants::format_default;
using ::boost::regex_constants::format_sed;
using ::boost::regex_constants::format_no_copy;
using ::boost::regex_constants::format_first_only;

using ::boost::regex_constants::error_type;
using ::boost::regex_constants::error_collate;
using ::boost::regex_constants::error_ctype;
using ::boost::regex_constants::error_escape;
using ::boost::regex_constants::error_backref;
using ::boost::regex_constants::error_brack;
using ::boost::regex_constants::error_paren;
using ::boost::regex_constants::error_brace;
using ::boost::regex_constants::error_badbrace;
using ::boost::regex_constants::error_range;
using ::boost::regex_constants::error_space;
using ::boost::regex_constants::error_badrepeat;
using ::boost::regex_constants::error_complexity;
using ::boost::regex_constants::error_stack;

} // namespace regex_constants

// [7.6] Class regex_error
using ::boost::regex_error;

// [7.7] Class template regex_traits
using ::boost::regex_traits;

// [7.8] Class template basic_regex
using ::boost::basic_regex;
using ::boost::regex;
#ifndef BOOST_NO_WREGEX
using ::boost::wregex;
#endif

#if !BOOST_WORKAROUND(__BORLANDC__, < 0x0582)
// [7.8.6] basic_regex swap
using ::boost::swap;
#endif

// [7.9] Class template sub_match
using ::boost::sub_match;

using ::boost::csub_match;
#ifndef BOOST_NO_WREGEX
using ::boost::wcsub_match;
#endif
using ::boost::ssub_match;
#ifndef BOOST_NO_WREGEX
using ::boost::wssub_match;
#endif

// [7.10] Class template match_results
using ::boost::match_results;
using ::boost::cmatch;
#ifndef BOOST_NO_WREGEX
using ::boost::wcmatch;
#endif
using ::boost::smatch;
#ifndef BOOST_NO_WREGEX
using ::boost::wsmatch;
#endif

using ::boost::regex_match;

// [7.11.3] Function template regex_search
using ::boost::regex_search;

// [7.11.4] Function template regex_replace
using ::boost::regex_replace;

// [7.12.1] Class template regex_iterator
using ::boost::regex_iterator;
using ::boost::cregex_iterator;
#ifndef BOOST_NO_WREGEX
using ::boost::wcregex_iterator;
#endif
using ::boost::sregex_iterator;
#ifndef BOOST_NO_WREGEX
using ::boost::wsregex_iterator;
#endif

// [7.12.2] Class template regex_token_iterator
using ::boost::regex_token_iterator;
using ::boost::cregex_token_iterator;
#ifndef BOOST_NO_WREGEX
using ::boost::wcregex_token_iterator;
#endif
using ::boost::sregex_token_iterator;
#ifndef BOOST_NO_WREGEX
using ::boost::wsregex_token_iterator;
#endif

} } // namespaces

#endif

#endif
