//  (C) Copyright Gennadiy Rozental 2004-2008.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at 
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : 
// ***************************************************************************

#ifndef BOOST_ISTREAM_LINE_ITERATOR_HPP_071894GER
#define BOOST_ISTREAM_LINE_ITERATOR_HPP_071894GER

// Boost
#include <boost/test/utils/basic_cstring/basic_cstring.hpp>
#include <boost/test/utils/iterator/input_iterator_facade.hpp>

// STL
#include <iosfwd>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {

namespace unit_test {

// ************************************************************************** //
// **************         basic_istream_line_iterator          ************** //
// ************************************************************************** //

// !! Should we support policy based delimitation

template<typename CharT>
class basic_istream_line_iterator
: public input_iterator_facade<basic_istream_line_iterator<CharT>,
                               std::basic_string<CharT>,
                               basic_cstring<CharT const> > {
    typedef input_iterator_facade<basic_istream_line_iterator<CharT>,
                                  std::basic_string<CharT>,
                                  basic_cstring<CharT const> > base;
#ifdef BOOST_CLASSIC_IOSTREAMS
    typedef std::istream              istream_type;
#else
    typedef std::basic_istream<CharT> istream_type;
#endif
public:
    // Constructors
    basic_istream_line_iterator() {}
    basic_istream_line_iterator( istream_type& input, CharT delimeter )
    : m_input_stream( &input ), m_delimeter( delimeter )
    {
        this->init();
    }
    explicit basic_istream_line_iterator( istream_type& input )
    : m_input_stream( &input ) 
    , m_delimeter( input.widen( '\n' ) )
    {
        this->init();
    }

private:
    friend class input_iterator_core_access;

    // increment implementation
    bool                     get()
    {
        return !!std::getline( *m_input_stream, this->m_value, m_delimeter );
    }

    // Data members
    istream_type* m_input_stream;
    CharT         m_delimeter;
};

typedef basic_istream_line_iterator<char>       istream_line_iterator;
typedef basic_istream_line_iterator<wchar_t>    wistream_line_iterator;

} // namespace unit_test

} // namespace boost

//____________________________________________________________________________//

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_ISTREAM_LINE_ITERATOR_HPP_071894GER

