#ifndef BOOST_ARCHIVE_ADD_FACET_HPP
#define BOOST_ARCHIVE_ADD_FACET_HPP

// MS compatible compilers support #pragma once
#if defined(_MSC_VER)
# pragma once
#endif

/////////1/////////2/////////3/////////4/////////5/////////6/////////7/////////8
// add_facet.hpp

// (C) Copyright 2003 Robert Ramey - http://www.rrsd.com . 
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org for updates, documentation, and revision history.

#include <locale>
#include <boost/config.hpp>
#include <boost/detail/workaround.hpp>

// does STLport uses native STL for locales?
#if (defined(__SGI_STL_PORT)&& defined(_STLP_NO_OWN_IOSTREAMS))
// and this native STL lib is old Dinkumware (has not defined _CPPLIB_VER)
#  if (defined(_YVALS) && !defined(__IBMCPP__)) || !defined(_CPPLIB_VER)
#    define BOOST_ARCHIVE_OLD_DINKUMWARE_BENEATH_STLPORT
#  endif
#endif

namespace boost { 
namespace archive {

template<class Facet>
inline std::locale * 
add_facet(const std::locale &l, Facet * f){
    return
        #if defined BOOST_ARCHIVE_OLD_DINKUMWARE_BENEATH_STLPORT 
            // std namespace used for native locale
            new std::locale(std::_Addfac(l, f));
        #elif BOOST_WORKAROUND(BOOST_DINKUMWARE_STDLIB, == 1) // old Dinkumwar
            // std namespace used for native locale
            new std::locale(std::_Addfac(l, f));
        #else
            // standard compatible
            new std::locale(l, f);
        #endif
}

} // namespace archive
} // namespace boost

#undef BOOST_ARCHIVE_OLD_DINKUMWARE_BENEATH_STLPORT

#endif // BOOST_ARCHIVE_ADD_FACET_HPP
