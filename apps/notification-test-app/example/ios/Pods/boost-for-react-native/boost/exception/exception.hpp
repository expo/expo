//Copyright (c) 2006-2009 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_274DA366004E11DCB1DDFE2E56D89593
#define UUID_274DA366004E11DCB1DDFE2E56D89593
#if (__GNUC__*100+__GNUC_MINOR__>301) && !defined(BOOST_EXCEPTION_ENABLE_WARNINGS)
#pragma GCC system_header
#endif
#if defined(_MSC_VER) && !defined(BOOST_EXCEPTION_ENABLE_WARNINGS)
#pragma warning(push,1)
#endif

#ifdef BOOST_EXCEPTION_MINI_BOOST
#include  <memory>
namespace boost { namespace exception_detail { using std::shared_ptr; } }
#else
namespace boost { template <class T> class shared_ptr; };
namespace boost { namespace exception_detail { using boost::shared_ptr; } }
#endif

namespace
boost
    {
    namespace
    exception_detail
        {
        template <class T>
        class
        refcount_ptr
            {
            public:

            refcount_ptr():
                px_(0)
                {
                }

            ~refcount_ptr()
                {
                release();
                }

            refcount_ptr( refcount_ptr const & x ):
                px_(x.px_)
                {
                add_ref();
                }

            refcount_ptr &
            operator=( refcount_ptr const & x )
                {
                adopt(x.px_);
                return *this;
                }

            void
            adopt( T * px )
                {
                release();
                px_=px;
                add_ref();
                }

            T *
            get() const
                {
                return px_;
                }

            private:

            T * px_;

            void
            add_ref()
                {
                if( px_ )
                    px_->add_ref();
                }

            void
            release()
                {
                if( px_ && px_->release() )
                    px_=0;
                }
            };
        }

    ////////////////////////////////////////////////////////////////////////

    template <class Tag,class T>
    class error_info;

    typedef error_info<struct throw_function_,char const *> throw_function;
    typedef error_info<struct throw_file_,char const *> throw_file;
    typedef error_info<struct throw_line_,int> throw_line;

    template <>
    class
    error_info<throw_function_,char const *>
        {
        public:
        typedef char const * value_type;
        value_type v_;
        explicit
        error_info( value_type v ):
            v_(v)
            {
            }
        };

    template <>
    class
    error_info<throw_file_,char const *>
        {
        public:
        typedef char const * value_type;
        value_type v_;
        explicit
        error_info( value_type v ):
            v_(v)
            {
            }
        };

    template <>
    class
    error_info<throw_line_,int>
        {
        public:
        typedef int value_type;
        value_type v_;
        explicit
        error_info( value_type v ):
            v_(v)
            {
            }
        };

#if defined(__GNUC__)
# if (__GNUC__ == 4 && __GNUC_MINOR__ >= 1) || (__GNUC__ > 4)
#  pragma GCC visibility push (default)
# endif
#endif
    class exception;
#if defined(__GNUC__)
# if (__GNUC__ == 4 && __GNUC_MINOR__ >= 1) || (__GNUC__ > 4)
#  pragma GCC visibility pop
# endif
#endif

    namespace
    exception_detail
        {
        class error_info_base;
        struct type_info_;

        struct
        error_info_container
            {
            virtual char const * diagnostic_information( char const * ) const = 0;
            virtual shared_ptr<error_info_base> get( type_info_ const & ) const = 0;
            virtual void set( shared_ptr<error_info_base> const &, type_info_ const & ) = 0;
            virtual void add_ref() const = 0;
            virtual bool release() const = 0;
            virtual refcount_ptr<exception_detail::error_info_container> clone() const = 0;

            protected:

            ~error_info_container() throw()
                {
                }
            };

        template <class>
        struct get_info;

        template <>
        struct get_info<throw_function>;

        template <>
        struct get_info<throw_file>;

        template <>
        struct get_info<throw_line>;

        template <class>
        struct set_info_rv;

        template <>
        struct set_info_rv<throw_function>;

        template <>
        struct set_info_rv<throw_file>;

        template <>
        struct set_info_rv<throw_line>;

        char const * get_diagnostic_information( exception const &, char const * );

        void copy_boost_exception( exception *, exception const * );

        template <class E,class Tag,class T>
        E const & set_info( E const &, error_info<Tag,T> const & );

        template <class E>
        E const & set_info( E const &, throw_function const & );

        template <class E>
        E const & set_info( E const &, throw_file const & );

        template <class E>
        E const & set_info( E const &, throw_line const & );
        }

#if defined(__GNUC__)
# if (__GNUC__ == 4 && __GNUC_MINOR__ >= 1) || (__GNUC__ > 4)
#  pragma GCC visibility push (default)
# endif
#endif
    class
    exception
        {
        //<N3757>
        public:
        template <class Tag> void set( typename Tag::type const & );
        template <class Tag> typename Tag::type const * get() const;
        //</N3757>

        protected:

        exception():
            throw_function_(0),
            throw_file_(0),
            throw_line_(-1)
            {
            }

#ifdef __HP_aCC
        //On HP aCC, this protected copy constructor prevents throwing boost::exception.
        //On all other platforms, the same effect is achieved by the pure virtual destructor.
        exception( exception const & x ) throw():
            data_(x.data_),
            throw_function_(x.throw_function_),
            throw_file_(x.throw_file_),
            throw_line_(x.throw_line_)
            {
            }
#endif

        virtual ~exception() throw()
#ifndef __HP_aCC
            = 0 //Workaround for HP aCC, =0 incorrectly leads to link errors.
#endif
            ;

#if (defined(__MWERKS__) && __MWERKS__<=0x3207) || (defined(_MSC_VER) && _MSC_VER<=1310)
        public:
#else
        private:

        template <class E>
        friend E const & exception_detail::set_info( E const &, throw_function const & );

        template <class E>
        friend E const & exception_detail::set_info( E const &, throw_file const & );

        template <class E>
        friend E const & exception_detail::set_info( E const &, throw_line const & );

        template <class E,class Tag,class T>
        friend E const & exception_detail::set_info( E const &, error_info<Tag,T> const & );

        friend char const * exception_detail::get_diagnostic_information( exception const &, char const * );

        template <class>
        friend struct exception_detail::get_info;
        friend struct exception_detail::get_info<throw_function>;
        friend struct exception_detail::get_info<throw_file>;
        friend struct exception_detail::get_info<throw_line>;
        template <class>
        friend struct exception_detail::set_info_rv;
        friend struct exception_detail::set_info_rv<throw_function>;
        friend struct exception_detail::set_info_rv<throw_file>;
        friend struct exception_detail::set_info_rv<throw_line>;
        friend void exception_detail::copy_boost_exception( exception *, exception const * );
#endif
        mutable exception_detail::refcount_ptr<exception_detail::error_info_container> data_;
        mutable char const * throw_function_;
        mutable char const * throw_file_;
        mutable int throw_line_;
        };
#if defined(__GNUC__)
# if (__GNUC__ == 4 && __GNUC_MINOR__ >= 1) || (__GNUC__ > 4)
#  pragma GCC visibility pop
# endif
#endif

    inline
    exception::
    ~exception() throw()
        {
        }

    namespace
    exception_detail
        {
        template <class E>
        E const &
        set_info( E const & x, throw_function const & y )
            {
            x.throw_function_=y.v_;
            return x;
            }

        template <class E>
        E const &
        set_info( E const & x, throw_file const & y )
            {
            x.throw_file_=y.v_;
            return x;
            }

        template <class E>
        E const &
        set_info( E const & x, throw_line const & y )
            {
            x.throw_line_=y.v_;
            return x;
            }
        }

    ////////////////////////////////////////////////////////////////////////

    namespace
    exception_detail
        {
#if defined(__GNUC__)
# if (__GNUC__ == 4 && __GNUC_MINOR__ >= 1) || (__GNUC__ > 4)
#  pragma GCC visibility push (default)
# endif
#endif
        template <class T>
        struct
        error_info_injector:
            public T,
            public exception
            {
            explicit
            error_info_injector( T const & x ):
                T(x)
                {
                }

            ~error_info_injector() throw()
                {
                }
            };
#if defined(__GNUC__)
# if (__GNUC__ == 4 && __GNUC_MINOR__ >= 1) || (__GNUC__ > 4)
#  pragma GCC visibility pop
# endif
#endif

        struct large_size { char c[256]; };
        large_size dispatch_boost_exception( exception const * );

        struct small_size { };
        small_size dispatch_boost_exception( void const * );

        template <class,int>
        struct enable_error_info_helper;

        template <class T>
        struct
        enable_error_info_helper<T,sizeof(large_size)>
            {
            typedef T type;
            };

        template <class T>
        struct
        enable_error_info_helper<T,sizeof(small_size)>
            {
            typedef error_info_injector<T> type;
            };

        template <class T>
        struct
        enable_error_info_return_type
            {
            typedef typename enable_error_info_helper<T,sizeof(exception_detail::dispatch_boost_exception(static_cast<T *>(0)))>::type type;
            };
        }

    template <class T>
    inline
    typename
    exception_detail::enable_error_info_return_type<T>::type
    enable_error_info( T const & x )
        {
        typedef typename exception_detail::enable_error_info_return_type<T>::type rt;
        return rt(x);
        }

    ////////////////////////////////////////////////////////////////////////

    namespace
    exception_detail
        {
#if defined(__GNUC__)
# if (__GNUC__ == 4 && __GNUC_MINOR__ >= 1) || (__GNUC__ > 4)
#  pragma GCC visibility push (default)
# endif
#endif
        class
        clone_base
            {
            public:

            virtual clone_base const * clone() const = 0;
            virtual void rethrow() const = 0;

            virtual
            ~clone_base() throw()
                {
                }
            };
#if defined(__GNUC__)
# if (__GNUC__ == 4 && __GNUC_MINOR__ >= 1) || (__GNUC__ > 4)
#  pragma GCC visibility pop
# endif
#endif

        inline
        void
        copy_boost_exception( exception * a, exception const * b )
            {
            refcount_ptr<error_info_container> data;
            if( error_info_container * d=b->data_.get() )
                data = d->clone();
            a->throw_file_ = b->throw_file_;
            a->throw_line_ = b->throw_line_;
            a->throw_function_ = b->throw_function_;
            a->data_ = data;
            }

        inline
        void
        copy_boost_exception( void *, void const * )
            {
            }

#if defined(__GNUC__)
# if (__GNUC__ == 4 && __GNUC_MINOR__ >= 1) || (__GNUC__ > 4)
#  pragma GCC visibility push (default)
# endif
#endif
        template <class T>
        class
        clone_impl:
            public T,
            public virtual clone_base
            {
            struct clone_tag { };
            clone_impl( clone_impl const & x, clone_tag ):
                T(x)
                {
                copy_boost_exception(this,&x);
                }

            public:

            explicit
            clone_impl( T const & x ):
                T(x)
                {
                copy_boost_exception(this,&x);
                }

            ~clone_impl() throw()
                {
                }

            private:

            clone_base const *
            clone() const
                {
                return new clone_impl(*this,clone_tag());
                }

            void
            rethrow() const
                {
                throw*this;
                }
            };
        }
#if defined(__GNUC__)
# if (__GNUC__ == 4 && __GNUC_MINOR__ >= 1) || (__GNUC__ > 4)
#  pragma GCC visibility pop
# endif
#endif

    template <class T>
    inline
    exception_detail::clone_impl<T>
    enable_current_exception( T const & x )
        {
        return exception_detail::clone_impl<T>(x);
        }
    }

#if defined(_MSC_VER) && !defined(BOOST_EXCEPTION_ENABLE_WARNINGS)
#pragma warning(pop)
#endif
#endif
