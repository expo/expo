/*
(c) 2015 NumScale SAS
(c) 2015 LRI UMR 8623 CNRS/University Paris Sud XI

(c) 2015 Glen Joseph Fernandes
<glenjofe -at- gmail.com>

Distributed under the Boost Software
License, Version 1.0.
http://boost.org/LICENSE_1_0.txt
*/
#ifndef BOOST_ALIGN_DETAIL_ASSUME_ALIGNED_MSVC_HPP
#define BOOST_ALIGN_DETAIL_ASSUME_ALIGNED_MSVC_HPP

#include <cstddef>

#define BOOST_ALIGN_ASSUME_ALIGNED(p, n) \
__assume(((std::size_t)(p) & ((n) - 1)) == 0)

#endif
