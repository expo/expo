/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_CONFIG_HPP
#define GIL_CONFIG_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief GIL configuration file
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
///
////////////////////////////////////////////////////////////////////////////////////////

#include <boost/config.hpp>

#define GIL_VERSION "2.1.2"

#ifdef _DEBUG
#    define GIL_FORCEINLINE inline
#else
#ifdef NDEBUG
#if   defined(_MSC_VER)
#    define GIL_FORCEINLINE __forceinline
#elif defined(__GNUC__) && __GNUC__ > 3
#    define GIL_FORCEINLINE inline __attribute__ ((always_inline))
#else
#    define GIL_FORCEINLINE inline
#endif
#else
#    define GIL_FORCEINLINE inline
#endif
#endif

// Enable GIL_NONWORD_POINTER_ALIGNMENT_SUPPORTED if your platform supports dereferencing on non-word memory boundary.
// Enabling the flag results in performance improvement
#if !defined(__hpux) && !defined(sun) && !defined(__sun) && !defined(__osf__)
    #define GIL_NONWORD_POINTER_ALIGNMENT_SUPPORTED
#endif

#endif
