
//          Copyright Oliver Kowalke 2009.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_CONTEXT_DETAIL_FCONTEXT_I386H
#define BOOST_CONTEXT_DETAIL_FCONTEXT_I386H

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

#define BOOST_CONTEXT_CALLDECL __cdecl

struct stack_t
{
    void    *   sp;
    std::size_t size;
    void    *   limit;

    stack_t() :
        sp( 0), size( 0), limit( 0)
    {}
};

struct fp_t
{
    boost::uint32_t     fc_freg[2];

    fp_t() :
        fc_freg()
    {}
};

struct fcontext_t
{
    boost::uint32_t     fc_greg[6];
    stack_t             fc_stack;
    void            *   fc_excpt_lst;
    void            *   fc_local_storage;
    fp_t                fc_fp;
    boost::uint32_t     fc_dealloc;

    fcontext_t() :
        fc_greg(),
        fc_stack(),
        fc_excpt_lst( 0),
        fc_local_storage( 0),
        fc_fp(),
        fc_dealloc( 0)
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

#endif // BOOST_CONTEXT_DETAIL_FCONTEXT_I386_H
