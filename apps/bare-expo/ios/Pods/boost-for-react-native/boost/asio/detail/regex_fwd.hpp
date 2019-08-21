//
// detail/regex_fwd.hpp
// ~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_DETAIL_REGEX_FWD_HPP
#define BOOST_ASIO_DETAIL_REGEX_FWD_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#if defined(BOOST_ASIO_HAS_BOOST_REGEX)

#include <boost/regex_fwd.hpp>
#include <boost/regex/v4/match_flags.hpp>

namespace boost {

template <class BidiIterator>
struct sub_match;

template <class BidiIterator, class Allocator>
class match_results;

} // namespace boost

#endif // defined(BOOST_ASIO_HAS_BOOST_REGEX)

#endif // BOOST_ASIO_DETAIL_REGEX_FWD_HPP
