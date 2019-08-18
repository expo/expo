
//          Copyright Oliver Kowalke 2009.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_CONTEXT_DETAIL_FCONTEXT_I386H
#define BOOST_CONTEXT_DETAIL_FCONTEXT_I386H

#include <cstddef>

#include <boost/config.hpp>
#include <boost/cstdint.hpp>

#include <boost/context/detail/config.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
# include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace context {

extern "C" {

#define BOOST_CONTEXT_CALLDECL __attribute__((cdecl))

struct stack_t
{
    void            *   sp;
    std::size_t         size;

    stack_t() :
        sp( 0), size( 0)
    {}
};

struct fcontext_t
{
    boost::uint32_t     fc_greg[6];
    stack_t             fc_stack;
    boost::uint32_t     fc_freg[2];

    fcontext_t() :
        fc_greg(),
        fc_stack(),
        fc_freg()
    {}
};

}

}}

#ifdef BOOST_HAS_ABI_HEADERS
# include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_CONTEXT_DETAIL_FCONTEXT_I386_H
