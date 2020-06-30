//  local_memory.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_LOCAL_MEMORY_HPP
#define BOOST_DETAIL_WINAPI_LOCAL_MEMORY_HPP

#include <boost/detail/winapi/basic_types.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
namespace boost { namespace detail { namespace winapi {
typedef HANDLE_ HLOCAL_;
}}}

extern "C" {
BOOST_SYMBOL_IMPORT boost::detail::winapi::HLOCAL_ WINAPI
LocalAlloc(
    boost::detail::winapi::UINT_ uFlags,
    boost::detail::winapi::SIZE_T_ uBytes);
BOOST_SYMBOL_IMPORT boost::detail::winapi::HLOCAL_ WINAPI
LocalReAlloc(
    boost::detail::winapi::HLOCAL_ hMem,
    boost::detail::winapi::SIZE_T_ uBytes,
    boost::detail::winapi::UINT_ uFlags);
BOOST_SYMBOL_IMPORT boost::detail::winapi::HLOCAL_ WINAPI LocalFree(boost::detail::winapi::HLOCAL_ hMem);
}
#endif

namespace boost {
namespace detail {
namespace winapi {
#if defined( BOOST_USE_WINDOWS_H )
typedef ::HLOCAL HLOCAL_;
#endif
using ::LocalAlloc;
using ::LocalReAlloc;
using ::LocalFree;
}
}
}

#endif // BOOST_DETAIL_WINAPI_LOCAL_MEMORY_HPP
