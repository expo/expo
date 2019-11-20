//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : contains definition for setcolor iostream manipulator
// ***************************************************************************

#ifndef BOOST_TEST_UTILS_SETCOLOR_HPP
#define BOOST_TEST_UTILS_SETCOLOR_HPP

// Boost.Test
#include <boost/test/detail/config.hpp>

// STL
#include <iostream>
#include <cstdio>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace unit_test {
namespace utils {

// ************************************************************************** //
// **************                    term_attr                 ************** //
// ************************************************************************** //

struct term_attr { enum _ {
    NORMAL    = 0,
    BRIGHT    = 1,
    DIM       = 2,
    UNDERLINE = 4,
    BLINK     = 5,
    REVERSE   = 7,
    CROSSOUT  = 9
}; };

// ************************************************************************** //
// **************                   term_color                 ************** //
// ************************************************************************** //

struct term_color { enum _ {
    BLACK    = 0,
    RED      = 1,
    GREEN    = 2,
    YELLOW   = 3,
    BLUE     = 4,
    MAGENTA  = 5,
    CYAN     = 6,
    WHITE    = 7,
    ORIGINAL = 9
}; };

// ************************************************************************** //
// **************                    setcolor                  ************** //
// ************************************************************************** //

class setcolor {
public:
    // Constructor
    explicit    setcolor( term_attr::_  attr = term_attr::NORMAL,
                          term_color::_ fg   = term_color::ORIGINAL,
                          term_color::_ bg   = term_color::ORIGINAL )
    {
        m_command_size = std::sprintf( m_control_command, "%c[%d;%d;%dm", 0x1B, attr, fg + 30, bg + 40 );
    }

    friend std::ostream&
    operator<<( std::ostream& os, setcolor const& sc )
    {
        return os.write( sc.m_control_command, sc.m_command_size );
    }

private:
    // Data members
    char        m_control_command[13];
    int         m_command_size;
};

// ************************************************************************** //
// **************                 scope_setcolor               ************** //
// ************************************************************************** //

struct scope_setcolor {
    scope_setcolor() : m_os( 0 ) {}
    explicit    scope_setcolor( std::ostream& os,
                                term_attr::_  attr = term_attr::NORMAL,
                                term_color::_ fg   = term_color::ORIGINAL,
                                term_color::_ bg   = term_color::ORIGINAL )
    : m_os( &os )
    {
        os << setcolor( attr, fg, bg );
    }
    ~scope_setcolor()
    {
        if( m_os )
            *m_os << setcolor();
    }
private:
    // Data members
    std::ostream* m_os;
};

#define BOOST_TEST_SCOPE_SETCOLOR( is_color_output, os, attr, color )   \
    utils::scope_setcolor const& sc = is_color_output                   \
           ? utils::scope_setcolor( os, utils::attr, utils::color )     \
           : utils::scope_setcolor();                                   \
    ut_detail::ignore_unused_variable_warning( sc )                     \
/**/

} // namespace utils
} // namespace unit_test
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_UTILS_SETCOLOR_HPP
