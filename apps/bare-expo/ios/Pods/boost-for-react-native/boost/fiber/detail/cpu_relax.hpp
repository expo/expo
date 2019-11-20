
//          Copyright Oliver Kowalke 2016.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_DETAIL_CPU_RELAX_H
#define BOOST_FIBERS_DETAIL_CPU_RELAX_H

#include <thread>

#include <boost/config.hpp>
#include <boost/predef.h> 

#include <boost/fiber/detail/config.hpp>

#if BOOST_COMP_MSVC
# include <Windows.h>
#endif

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace fibers {
namespace detail {

#if BOOST_ARCH_ARM
# if BOOST_COMP_MSVC
#  define cpu_relax() YieldProcessor();
# else
#  define cpu_relax() asm volatile ("yield" ::: "memory");
# endif
#elif BOOST_ARCH_MIPS
# define cpu_relax() asm volatile ("pause" ::: "memory");
#elif BOOST_ARCH_PPC
# define cpu_relax() asm volatile ("or 27,27,27" ::: "memory");
#elif BOOST_ARCH_X86
# if BOOST_COMP_MSVC
#  define cpu_relax() YieldProcessor();
# else
#  define cpu_relax() asm volatile ("pause" ::: "memory");
# endif
#else
# warning "architecture does not support yield/pause mnemonic"
# define cpu_relax() std::this_thread::yield();
#endif

}}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_DETAIL_CPU_RELAX_H
