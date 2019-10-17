// Boost name_generator.hpp header file  ----------------------------------------------//

// Copyright 2010 Andy Tompkins.
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_UUID_NAME_GENERATOR_HPP
#define BOOST_UUID_NAME_GENERATOR_HPP

#include <boost/uuid/uuid.hpp>
#include <boost/uuid/sha1.hpp>
#include <boost/assert.hpp>
#include <string>
#include <cstring> // for strlen, wcslen

#ifdef BOOST_NO_STDC_NAMESPACE
namespace std {
    using ::strlen;
    using ::wcslen;
} //namespace std
#endif //BOOST_NO_STDC_NAMESPACE

namespace boost {
namespace uuids {

// generate a name-based uuid
// TODO: add in common namesspace uuids
class name_generator {
public:
    typedef uuid result_type;

    explicit name_generator(uuid const& namespace_uuid_)
        : namespace_uuid(namespace_uuid_)
    {}

    uuid operator()(const char* name) {
        reset();
        process_characters(name, std::strlen(name));
        return sha_to_uuid();
    }

    uuid operator()(const wchar_t* name) {
        reset();
        process_characters(name, std::wcslen(name));
        return sha_to_uuid();
    }

    template <typename ch, typename char_traits, typename alloc>
    uuid operator()(std::basic_string<ch, char_traits, alloc> const& name) {
        reset();
        process_characters(name.c_str(), name.length());
        return sha_to_uuid();
    }
    
    uuid operator()(void const* buffer, std::size_t byte_count) {
        reset();
        sha.process_bytes(buffer, byte_count);
        return sha_to_uuid();
    };

private:
    // we convert all characters to uint32_t so that each
    // character is 4 bytes reguardless of sizeof(char) or
    // sizeof(wchar_t).  We want the name string on any
    // platform / compiler to generate the same uuid
    // except for char
    template <typename char_type>
    void process_characters(char_type const*const characters, size_t count) {
        BOOST_ASSERT(sizeof(uint32_t) >= sizeof(char_type));

        for (size_t i=0; i<count; i++) {
            uint32_t c = characters[i];
            sha.process_byte(static_cast<unsigned char>((c >>  0) & 0xFF));
            sha.process_byte(static_cast<unsigned char>((c >>  8) & 0xFF));
            sha.process_byte(static_cast<unsigned char>((c >> 16) & 0xFF));
            sha.process_byte(static_cast<unsigned char>((c >> 24) & 0xFF));
        }
    }
    
    void process_characters(char const*const characters, size_t count) {
        sha.process_bytes(characters, count);
    }

    void reset()
    {
        sha.reset();
        sha.process_bytes(namespace_uuid.begin(), namespace_uuid.size());
    }
    
    uuid sha_to_uuid()
    {
        unsigned int digest[5];

        sha.get_digest(digest);

        uuid u;
        for (int i=0; i<4; ++i) {
            *(u.begin() + i*4+0) = static_cast<uint8_t>((digest[i] >> 24) & 0xFF);
            *(u.begin() + i*4+1) = static_cast<uint8_t>((digest[i] >> 16) & 0xFF);
            *(u.begin() + i*4+2) = static_cast<uint8_t>((digest[i] >> 8) & 0xFF);
            *(u.begin() + i*4+3) = static_cast<uint8_t>((digest[i] >> 0) & 0xFF);
        }

        // set variant
        // must be 0b10xxxxxx
        *(u.begin()+8) &= 0xBF;
        *(u.begin()+8) |= 0x80;

        // set version
        // must be 0b0101xxxx
        *(u.begin()+6) &= 0x5F; //0b01011111
        *(u.begin()+6) |= 0x50; //0b01010000

        return u;
    }

private:
    uuid namespace_uuid;
    detail::sha1 sha;
};

}} // namespace boost::uuids

#endif // BOOST_UUID_NAME_GENERATOR_HPP
