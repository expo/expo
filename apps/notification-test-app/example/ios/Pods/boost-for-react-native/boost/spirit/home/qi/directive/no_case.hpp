/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/
#if !defined(SPIRIT_NO_CASE_OCTOBER_25_2008_0424PM)
#define SPIRIT_NO_CASE_OCTOBER_25_2008_0424PM

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/spirit/home/qi/meta_compiler.hpp>
#include <boost/spirit/home/support/common_terminals.hpp>

namespace boost { namespace spirit
{
    ///////////////////////////////////////////////////////////////////////////
    // Enablers
    ///////////////////////////////////////////////////////////////////////////
    template <typename CharEncoding>
    struct use_directive<
        qi::domain, tag::char_code<tag::no_case, CharEncoding> > // enables no_case
      : mpl::true_ {};

    template <typename CharEncoding>
    struct is_modifier_directive<qi::domain, tag::char_code<tag::no_case, CharEncoding> >
      : mpl::true_ {};
}}

#endif
