// Copyright 2014 Renato Tegon Forti, Antony Polukhin.
// Copyright 2015 Antony Polukhin.
//
// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt
// or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_DLL_DETAIL_X_INFO_INTERFACE_HPP
#define BOOST_DLL_DETAIL_X_INFO_INTERFACE_HPP

#include <boost/config.hpp>
#ifdef BOOST_HAS_PRAGMA_ONCE
# pragma once
#endif

#include <string>
#include <vector>

namespace boost { namespace dll { namespace detail {

class x_info_interface {
public:
    virtual std::vector<std::string> sections() = 0;
    virtual std::vector<std::string> symbols() = 0;
    virtual std::vector<std::string> symbols(const char* section_name) = 0;

    virtual ~x_info_interface() BOOST_NOEXCEPT {}
};

}}} // namespace boost::dll::detail

#endif // BOOST_DLL_DETAIL_X_INFO_INTERFACE_HPP
