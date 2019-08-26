/*=============================================================================
    Boost.Wave: A Standard compliant C++ preprocessor library

    http://www.boost.org/

    Copyright (c) 2001 Daniel C. Nuffer.
    Copyright (c) 2001-2012 Hartmut Kaiser.
    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/

#if !defined(SCANNER_HPP_F4FB01EB_E75C_4537_A146_D34B9895EF37_INCLUDED)
#define SCANNER_HPP_F4FB01EB_E75C_4537_A146_D34B9895EF37_INCLUDED

#include <boost/wave/wave_config.hpp>
#include <boost/wave/cpplexer/re2clex/aq.hpp>

// this must occur after all of the includes and before any code appears
#ifdef BOOST_HAS_ABI_HEADERS
#include BOOST_ABI_PREFIX
#endif

///////////////////////////////////////////////////////////////////////////////
namespace boost {
namespace wave {
namespace cpplexer {
namespace re2clex {

struct Scanner;
typedef unsigned char uchar;
typedef int (* ReportErrorProc)(struct Scanner const *, int errorcode,
    char const *, ...);

typedef struct Scanner {
    uchar* first;   /* start of input buffer */
    uchar* act;     /* act position of input buffer */
    uchar* last;    /* end (one past last char) of input buffer */
    uchar* bot;     /* beginning of the current buffer */
    uchar* top;     /* top of the current buffer */
    uchar* eof;     /* when we read in the last buffer, will point 1 past the
                       end of the file, otherwise 0 */
    uchar* tok;     /* points to the beginning of the current token */
    uchar* ptr;     /* used for YYMARKER - saves backtracking info */
    uchar* cur;     /* saves the cursor (maybe is redundant with tok?) */
    uchar* lim;     /* used for YYLIMIT - points to the end of the buffer */
                    /* (lim == top) except for the last buffer, it points to
                       the end of the input (lim == eof - 1) */
    std::size_t line;           /* current line being lex'ed */
    std::size_t column;         /* current token start column position */
    std::size_t curr_column;    /* current column position */
    ReportErrorProc error_proc; /* must be != 0, this function is called to
                                   report an error */
    char const *file_name;      /* name of the lex'ed file */
    aq_queue eol_offsets;
    bool enable_ms_extensions;   /* enable MS extensions */
    bool act_in_c99_mode;        /* lexer works in C99 mode */
    bool detect_pp_numbers;      /* lexer should prefer to detect pp-numbers */
    bool enable_import_keyword;  /* recognize import as a keyword */
    bool single_line_only;       /* don't report missing eol's in C++ comments */
    bool act_in_cpp0x_mode;      /* lexer works in C++11 mode */
} Scanner;

///////////////////////////////////////////////////////////////////////////////
}   // namespace re2clex
}   // namespace cpplexer
}   // namespace wave
}   // namespace boost

// the suffix header occurs after all of the code
#ifdef BOOST_HAS_ABI_HEADERS
#include BOOST_ABI_SUFFIX
#endif

#endif // !defined(SCANNER_HPP_F4FB01EB_E75C_4537_A146_D34B9895EF37_INCLUDED)
