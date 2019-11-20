//  GetLastError.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_GETLASTERROR_HPP
#define BOOST_DETAIL_WINAPI_GETLASTERROR_HPP

#include <boost/detail/winapi/get_last_error.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if defined(__GNUC__) && (((__GNUC__*100)+__GNUC_MINOR__) > 403)
#pragma message "This header is deprecated, use boost/detail/winapi/get_last_error.hpp instead."
#elif defined(_MSC_VER)
#pragma message("This header is deprecated, use boost/detail/winapi/get_last_error.hpp instead.")
#endif

#endif // BOOST_DETAIL_WINAPI_GETLASTERROR_HPP
