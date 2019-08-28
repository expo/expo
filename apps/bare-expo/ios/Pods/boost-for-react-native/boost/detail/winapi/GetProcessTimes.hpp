//  GetProcessTimes.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_GETPROCESSTIMES_HPP
#define BOOST_DETAIL_WINAPI_GETPROCESSTIMES_HPP

#include <boost/detail/winapi/get_process_times.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if defined(__GNUC__) && (((__GNUC__*100)+__GNUC_MINOR__) > 403)
#pragma message "This header is deprecated, use boost/detail/winapi/get_process_times.hpp instead."
#elif defined(_MSC_VER)
#pragma message("This header is deprecated, use boost/detail/winapi/get_process_times.hpp instead.")
#endif

#endif // BOOST_DETAIL_WINAPI_GETPROCESSTIMES_HPP
