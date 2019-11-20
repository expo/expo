// (C) Copyright 2008 CodeRage, LLC (turkanis at coderage dot com)
// (C) Copyright 2005-2007 Jonathan Turkanis
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt.)

// See http://www.boost.org/libs/iostreams for documentation.

namespace boost { namespace iostreams {

namespace detail {

template<typename T> 
struct read_device_impl;

template<typename T> 
struct read_filter_impl;

} // End namespace detail.

template<typename T>
typename int_type_of<T>::type get(T& t)
{
    typedef typename detail::unwrapped_type<T>::type unwrapped;
    return detail::read_device_impl<T>::inner<unwrapped>::get(detail::unwrap(t));
}

template<typename T>
inline std::streamsize
read(T& t, typename char_type_of<T>::type* s, std::streamsize n)
{
    typedef typename detail::unwrapped_type<T>::type unwrapped;
    return detail::read_device_impl<T>::inner<unwrapped>::read(detail::unwrap(t), s, n);
}

template<typename T, typename Source>
std::streamsize
read(T& t, Source& src, typename char_type_of<T>::type* s, std::streamsize n)
{
    typedef typename detail::unwrapped_type<T>::type unwrapped;
    return detail::read_filter_impl<T>::inner<unwrapped>::read(detail::unwrap(t), src, s, n);
}

template<typename T>
bool putback(T& t, typename char_type_of<T>::type c)
{
    typedef typename detail::unwrapped_type<T>::type unwrapped;
    return detail::read_device_impl<T>::inner<unwrapped>::putback(detail::unwrap(t), c);
}

//----------------------------------------------------------------------------//

namespace detail {

// Helper function for adding -1 as EOF indicator.
inline std::streamsize check_eof(std::streamsize n) { return n != 0 ? n : -1; }

// Helper templates for reading from streambufs.
template<bool IsLinked>
struct true_eof_impl;

template<>
struct true_eof_impl<true> {
    template<typename T>
    static bool true_eof(T& t) { return t.true_eof(); }
};

template<>
struct true_eof_impl<false> {
    template<typename T>
    static bool true_eof(T& t) { return true; }
};

template<typename T>
inline bool true_eof(T& t)
{
    const bool linked = is_linked<T>::value;
    return true_eof_impl<linked>::true_eof(t);
}
                    
//------------------Definition of read_device_impl----------------------------//

template<typename T>
struct read_device_impl
    : mpl::if_<
          detail::is_custom<T>,
          operations<T>,
          read_device_impl<
              BOOST_DEDUCED_TYPENAME
              detail::dispatch<
                  T, istream_tag, streambuf_tag, input
              >::type
          >
      >::type
    { };

template<>
struct read_device_impl<istream_tag> {
    template<typename T>
    struct inner {
        static typename int_type_of<T>::type get(T& t)
        { return t.get(); }

        static std::streamsize
        read(T& t, typename char_type_of<T>::type* s, std::streamsize n)
        { return check_eof(t.rdbuf()->sgetn(s, n)); }

        static bool putback(T& t, typename char_type_of<T>::type c)
        {
            typedef typename char_type_of<T>::type          char_type;
            typedef BOOST_IOSTREAMS_CHAR_TRAITS(char_type)  traits_type;
            return !traits_type::eq_int_type( t.rdbuf()->sputbackc(c),
                                              traits_type::eof() );
        }
    };
};

template<>
struct read_device_impl<streambuf_tag> {
    template<typename T>
    struct inner {
        static typename int_type_of<T>::type
        get(T& t)
        {
            typedef typename char_type_of<T>::type  char_type;
            typedef char_traits<char_type>          traits_type;
            typename int_type_of<T>::type c;
            return !traits_type::is_eof(c = t.sbumpc()) ||
                    detail::true_eof(t)
                        ?
                    c : traits_type::would_block();
        }

        static std::streamsize
        read(T& t, typename char_type_of<T>::type* s, std::streamsize n)
        {
            std::streamsize amt;
            return (amt = t.sgetn(s, n)) != 0 ?
                amt :
                detail::true_eof(t) ?
                    -1 :
                    0;
        }

        static bool putback(T& t, typename char_type_of<T>::type c)
        {
            typedef typename char_type_of<T>::type  char_type;
            typedef char_traits<char_type>          traits_type;
            return !traits_type::is_eof(t.sputbackc(c));
        }
    };
};

template<>
struct read_device_impl<input> {
    template<typename T>
    struct inner {
        static typename int_type_of<T>::type
        get(T& t)
        {
            typedef typename char_type_of<T>::type  char_type;
            typedef char_traits<char_type>          traits_type;
            char_type c;
            std::streamsize amt;
            return (amt = t.read(&c, 1)) == 1 ?
                traits_type::to_int_type(c) :
                amt == -1 ?
                    traits_type::eof() :
                    traits_type::would_block();
        }

        template<typename T>
        static std::streamsize
        read(T& t, typename char_type_of<T>::type* s, std::streamsize n)
        { return t.read(s, n); }

        template<typename T>
        static bool putback(T& t, typename char_type_of<T>::type c)
        {   // T must be Peekable.
            return t.putback(c);
        }
    };
};

//------------------Definition of read_filter_impl----------------------------//

template<typename T>
struct read_filter_impl
    : mpl::if_<
          detail::is_custom<T>,
          operations<T>,
          read_filter_impl<
              BOOST_DEDUCED_TYPENAME
              detail::dispatch<
                  T, multichar_tag, any_tag
              >::type
          >
      >::type
    { };

template<>
struct read_filter_impl<multichar_tag> {
    template<typename T>
    struct inner {
        template<typename Source>
        static std::streamsize read
            ( T& t, Source& src, typename char_type_of<T>::type* s,   
              std::streamsize n )
        { return t.read(src, s, n); }
    };
};

template<>
struct read_filter_impl<any_tag> {
    template<typename T>
    struct inner {
        template<typename Source>
        static std::streamsize read
            ( T& t, Source& src, typename char_type_of<T>::type* s, 
              std::streamsize n )
        {
            typedef typename char_type_of<T>::type  char_type;
            typedef char_traits<char_type>          traits_type;
            for (std::streamsize off = 0; off < n; ++off) {
                typename traits_type::int_type c = t.get(src);
                if (traits_type::is_eof(c))
                    return check_eof(off);
                if (traits_type::would_block(c))
                    return off;
                s[off] = traits_type::to_char_type(c);
            }
            return n;
        }
    };
};

} // End namespace detail.

} } // End namespaces iostreams, boost.
