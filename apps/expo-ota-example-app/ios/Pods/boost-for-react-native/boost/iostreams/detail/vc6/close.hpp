// (C) Copyright 2008 CodeRage, LLC (turkanis at coderage dot com)
// (C) Copyright 2005-2007 Jonathan Turkanis
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt.)

// See http://www.boost.org/libs/iostreams for documentation.

namespace boost { namespace iostreams {

namespace detail {

template<typename T>
struct close_impl;

} // End namespace detail.

template<typename T>
void close(T& t) { detail::close_all(t); }

template<typename T>
void close(T& t, BOOST_IOS::openmode which)
{
    typedef typename detail::unwrapped_type<T>::type unwrapped;
    detail::close_impl<T>::inner<unwrapped>::close(detail::unwrap(t), which);
}

template<typename T, typename Sink>
void close(T& t, Sink& snk, BOOST_IOS::openmode which)
{
    typedef typename detail::unwrapped_type<T>::type unwrapped;
    detail::close_impl<T>::inner<unwrapped>::close(detail::unwrap(t), snk, which);
}

namespace detail {

//------------------Definition of close_impl----------------------------------//

template<typename T>
struct close_tag {
    typedef typename category_of<T>::type category;
    typedef typename
            mpl::eval_if<
                is_convertible<category, closable_tag>,
                mpl::if_<
                    mpl::or_<
                        is_convertible<category, two_sequence>,
                        is_convertible<category, dual_use>
                    >,
                    two_sequence,
                    closable_tag
                >,
                mpl::identity<any_tag>
            >::type type;
};

template<typename T>
struct close_impl
    : mpl::if_<
          is_custom<T>,
          operations<T>,
          close_impl<BOOST_DEDUCED_TYPENAME close_tag<T>::type>
      >::type
    { };

template<>
struct close_impl<any_tag> {
    template<typename T>
    struct inner {
        static void close(T& t, BOOST_IOS::openmode which)
        {
            if (which == BOOST_IOS::out)
                iostreams::flush(t);
        }

        template<typename Sink>
        static void close(T& t, Sink& snk, BOOST_IOS::openmode which)
        {
            if (which == BOOST_IOS::out) {
                non_blocking_adapter<Sink> nb(snk);
                iostreams::flush(t, nb);
            }
        }
    };
};

template<>
struct close_impl<closable_tag> {
    template<typename T>
    struct inner {
        static void close(T& t, BOOST_IOS::openmode which)
        {
            typedef typename category_of<T>::type category;
            const bool in =  is_convertible<category, input>::value &&
                            !is_convertible<category, output>::value;
            if (in == (which == BOOST_IOS::in))
                t.close();
        }
        template<typename Sink>
        static void close(T& t, Sink& snk, BOOST_IOS::openmode which)
        {
            typedef typename category_of<T>::type category;
            const bool in =  is_convertible<category, input>::value &&
                            !is_convertible<category, output>::value;
            if (in == (which == BOOST_IOS::in)) {
                non_blocking_adapter<Sink> nb(snk);
                t.close(nb);
            }
        }
    };
};

template<>
struct close_impl<two_sequence> {
    template<typename T>
    struct inner {
        static void close(T& t, BOOST_IOS::openmode which) { t.close(which); }

        template<typename Sink>
        static void close(T& t, Sink& snk, BOOST_IOS::openmode which)
        {
            non_blocking_adapter<Sink> nb(snk);
            t.close(nb, which);
        }
    };
};

} // End namespace detail.

} } // End namespaces iostreams, boost.
