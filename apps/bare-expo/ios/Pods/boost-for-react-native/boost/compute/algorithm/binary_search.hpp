//---------------------------------------------------------------------------//
// Copyright (c) 2013 Kyle Lutz <kyle.r.lutz@gmail.com>
//
// Distributed under the Boost Software License, Version 1.0
// See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt
//
// See http://boostorg.github.com/compute for more information.
//---------------------------------------------------------------------------//

#ifndef BOOST_COMPUTE_ALGORITHM_BINARY_SEARCH_HPP
#define BOOST_COMPUTE_ALGORITHM_BINARY_SEARCH_HPP

#include <boost/compute/system.hpp>
#include <boost/compute/command_queue.hpp>
#include <boost/compute/algorithm/lower_bound.hpp>

namespace boost {
namespace compute {

/// Returns \c true if \p value is in the sorted range [\p first,
/// \p last).
template<class InputIterator, class T>
inline bool binary_search(InputIterator first,
                          InputIterator last,
                          const T &value,
                          command_queue &queue = system::default_queue())
{
    InputIterator position = lower_bound(first, last, value, queue);

    return position != last && position.read(queue) == value;
}

} // end compute namespace
} // end boost namespace

#endif // BOOST_COMPUTE_ALGORITHM_BINARY_SEARCH_HPP
