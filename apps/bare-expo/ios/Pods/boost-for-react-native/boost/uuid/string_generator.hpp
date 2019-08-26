// Boost string_generator.hpp header file  ----------------------------------------------//

// Copyright 2010 Andy Tompkins.
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_UUID_STRING_GENERATOR_HPP
#define BOOST_UUID_STRING_GENERATOR_HPP

#include <boost/uuid/uuid.hpp>
#include <string>
#include <cstring> // for strlen, wcslen
#include <iterator>
#include <algorithm> // for find
#include <stdexcept>
#include <boost/throw_exception.hpp>

#ifdef BOOST_NO_STDC_NAMESPACE
namespace std {
    using ::strlen;
    using ::wcslen;
} //namespace std
#endif //BOOST_NO_STDC_NAMESPACE

namespace boost {
namespace uuids {

// generate a uuid from a string
// lexical_cast works fine using uuid_io.hpp
// but this generator should accept more forms
// and be more efficient
// would like to accept the following forms:
// 0123456789abcdef0123456789abcdef
// 01234567-89ab-cdef-0123456789abcdef
// {01234567-89ab-cdef-0123456789abcdef}
// {0123456789abcdef0123456789abcdef}
// others?
struct string_generator {
    typedef uuid result_type;
    
    template <typename ch, typename char_traits, typename alloc>
    uuid operator()(std::basic_string<ch, char_traits, alloc> const& s) const {
        return operator()(s.begin(), s.end());
    }

    uuid operator()(char const*const s) const {
        return operator()(s, s+std::strlen(s));
    }

    uuid operator()(wchar_t const*const s) const {
        return operator()(s, s+std::wcslen(s));
    }

    template <typename CharIterator>
    uuid operator()(CharIterator begin, CharIterator end) const
    {
        typedef typename std::iterator_traits<CharIterator>::value_type char_type;

        // check open brace
        char_type c = get_next_char(begin, end);
        bool has_open_brace = is_open_brace(c);
        char_type open_brace_char = c;
        if (has_open_brace) {
            c = get_next_char(begin, end);
        }

        bool has_dashes = false;

        uuid u;
        int i=0;
        for (uuid::iterator it_byte=u.begin(); it_byte!=u.end(); ++it_byte, ++i) {
            if (it_byte != u.begin()) {
                c = get_next_char(begin, end);
            }
            
            if (i == 4) {
                has_dashes = is_dash(c);
                if (has_dashes) {
                    c = get_next_char(begin, end);
                }
            }
            
            if (has_dashes) {
                if (i == 6 || i == 8 || i == 10) {
                    if (is_dash(c)) {
                        c = get_next_char(begin, end);
                    } else {
                        throw_invalid();
                    }
                }
            }

            *it_byte = get_value(c);

            c = get_next_char(begin, end);
            *it_byte <<= 4;
            *it_byte |= get_value(c);
        }

        // check close brace
        if (has_open_brace) {
            c = get_next_char(begin, end);
            check_close_brace(c, open_brace_char);
        }
        
        return u;
    }
    
private:
    template <typename CharIterator>
    typename std::iterator_traits<CharIterator>::value_type
    get_next_char(CharIterator& begin, CharIterator end) const {
        if (begin == end) {
            throw_invalid();
        }
        return *begin++;
    }

    unsigned char get_value(char c) const {
        static char const*const digits_begin = "0123456789abcdefABCDEF";
        static char const*const digits_end = digits_begin + 22;

        static unsigned char const values[] =
            { 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,10,11,12,13,14,15
            , static_cast<unsigned char>(-1) };

        char const* d = std::find(digits_begin, digits_end, c);
        return values[d - digits_begin];
    }

    unsigned char get_value(wchar_t c) const {
        static wchar_t const*const digits_begin = L"0123456789abcdefABCDEF";
        static wchar_t const*const digits_end = digits_begin + 22;
        
        static unsigned char const values[] =
            { 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,10,11,12,13,14,15
            , static_cast<unsigned char>(-1) };

        wchar_t const* d = std::find(digits_begin, digits_end, c);
        return values[d - digits_begin];
    }

    bool is_dash(char c) const {
        return c == '-';
    }
    
    bool is_dash(wchar_t c) const {
        return c == L'-';
    }
    
    // return closing brace
    bool is_open_brace(char c) const {
        return (c == '{');
    }
    
    bool is_open_brace(wchar_t c) const {
        return (c == L'{');
    }
    
    void check_close_brace(char c, char open_brace) const {
        if (open_brace == '{' && c == '}') {
            //great
        } else {
            throw_invalid();
        }
    }
    
    void check_close_brace(wchar_t c, wchar_t open_brace) const {
        if (open_brace == L'{' && c == L'}') {
            // great
        } else {
            throw_invalid();
        }
    }
    
    void throw_invalid() const {
        BOOST_THROW_EXCEPTION(std::runtime_error("invalid uuid string"));
    }
};

}} // namespace boost::uuids

#endif //BOOST_UUID_STRING_GENERATOR_HPP

