
//          Copyright Oliver Kowalke 2009.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_CONTEXT_DETAIL_FCONTEXT_X86_64_H
#define BOOST_CONTEXT_DETAIL_FCONTEXT_X86_64_H

#if defined(_MSC_VER) && (_MSC_VER >= 1020)
# pragma once
#endif

#include <cstddef>

#include <boost/config.hpp>
#include <boost/cstdint.hpp>

#include <boost/context/detail/config.hpp>

#if defined(BOOST_MSVC)
#pragma warning(push)
#pragma warning(disable:4351)
#endif

#ifdef BOOST_HAS_ABI_HEADERS
# include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace context {

extern "C" {

#define BOOST_CONTEXT_CALLDECL

struct stack_t
{
    void    *   sp;
    std::size_t size;
    void    *   limit;

    stack_t() :
        sp( 0), size( 0), limit( 0)
    {}
};

struct fcontext_t
{
    boost::uint64_t     fc_greg[10];
    stack_t             fc_stack;
    void            *   fc_local_storage;
    boost::uint64_t     fc_fp[24];
    boost::uint64_t     fc_dealloc;

    fcontext_t() :
        fc_greg(),
        fc_stack(),
        fc_local_storage( 0),
        fc_fp(),
        fc_dealloc()
    {}
};

}

}}

#ifdef BOOST_HAS_ABI_HEADERS
# include BOOST_ABI_SUFFIX
#endif

#if defined(BOOST_MSVC)
#pragma warning(pop)
#endif

#endif // BOOST_CONTEXT_DETAIL_FCONTEXT_X86_64_H
