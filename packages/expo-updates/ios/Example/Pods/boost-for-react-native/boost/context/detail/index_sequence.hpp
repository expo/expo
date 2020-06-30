
//          Copyright Oliver Kowalke 2014.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_CONTEXT_DETAIL_INDEX_SEQUENCE_H
#define BOOST_CONTEXT_DETAIL_INDEX_SEQUENCE_H

#include <cstddef>

#include <boost/config.hpp>

#include <boost/context/detail/config.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
# include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace context {
namespace detail {

#if ! defined(BOOST_CONTEXT_NO_CXX14_INTEGER_SEQUENCE)
template< std::size_t ... I >
using index_sequence = std::index_sequence< I ... >;
template< std::size_t I >
using make_index_sequence = std::make_index_sequence< I >;
template< typename ... T >
using index_sequence_for = std::index_sequence_for< T ... >;
#else
//http://stackoverflow.com/questions/17424477/implementation-c14-make-integer-sequence

template< std::size_t ... I >
struct index_sequence {
    using type = index_sequence;
    using value_type = std::size_t;
    static constexpr std::size_t size() {
        return sizeof ... (I);
    }
};

template< typename Seq1, typename Seq2 >
struct concat_sequence;

template< std::size_t ... I1, std::size_t ... I2 >
struct concat_sequence< index_sequence< I1 ... >, index_sequence< I2 ... > > : public index_sequence< I1 ..., (sizeof ... (I1)+I2) ... > {
};

template< std::size_t I >
struct make_index_sequence : public concat_sequence< typename make_index_sequence< I/2 >::type,
                                                     typename make_index_sequence< I-I/2 >::type > {
};

template<>
struct make_index_sequence< 0 > : public index_sequence<> {
};
template<>
struct make_index_sequence< 1 > : public index_sequence< 0 > {
};

template< typename ... T >
using index_sequence_for = make_index_sequence< sizeof ... (T) >;
#endif

}}}

#ifdef BOOST_HAS_ABI_HEADERS
#include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_CONTEXT_DETAIL_INDEX_SEQUENCE_H
