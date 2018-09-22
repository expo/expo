
//          Copyright Oliver Kowalke 2009.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_CONTEXT_FCONTEXT_H
#define BOOST_CONTEXT_FCONTEXT_H

#if defined(__PGI)
#include <stdint.h>
#endif

#if defined(_WIN32_WCE)
typedef int intptr_t;
#endif

#include <boost/config.hpp>
#include <boost/cstdint.hpp>

#include <boost/context/detail/config.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
# include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace context {

typedef void*   fcontext_t;

extern "C" BOOST_CONTEXT_DECL
intptr_t BOOST_CONTEXT_CALLDECL jump_fcontext( fcontext_t * ofc, fcontext_t nfc,
                                               intptr_t vp, bool preserve_fpu = true);
extern "C" BOOST_CONTEXT_DECL
fcontext_t BOOST_CONTEXT_CALLDECL make_fcontext( void * sp, std::size_t size, void (* fn)( intptr_t) );

}}

#ifdef BOOST_HAS_ABI_HEADERS
# include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_CONTEXT_FCONTEXT_H

