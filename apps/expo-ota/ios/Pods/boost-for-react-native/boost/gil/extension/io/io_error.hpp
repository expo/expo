/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/
/*************************************************************************************************/

#ifndef GIL_IO_ERROR_H
#define GIL_IO_ERROR_H

/// \file
/// \brief  Handle input-output errors
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n  Last updated on May 30, 2006

#include <ios>
#include "../../gil_config.hpp"
#include <boost/shared_ptr.hpp>

namespace boost { namespace gil {

inline void io_error(const char* descr) { throw std::ios_base::failure(descr); }
inline void io_error_if(bool expr, const char* descr="") { if (expr) io_error(descr); }

namespace detail {
    class file_mgr {
    protected:
        shared_ptr<FILE> _fp;

        struct null_deleter { void operator()(void const*) const {} };
        file_mgr(FILE* file) : _fp(file, null_deleter()) {}

        file_mgr(const char* filename, const char* flags) {
            FILE* fp;
            io_error_if((fp=fopen(filename,flags))==NULL, "file_mgr: failed to open file");
            _fp=shared_ptr<FILE>(fp,fclose);
        }

    public:
        FILE* get() { return _fp.get(); }
    };
}

} }  // namespace boost::gil

#endif
