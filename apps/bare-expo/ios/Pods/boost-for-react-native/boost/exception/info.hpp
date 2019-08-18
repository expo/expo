//Copyright (c) 2006-2010 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_8D22C4CA9CC811DCAA9133D256D89593
#define UUID_8D22C4CA9CC811DCAA9133D256D89593
#if (__GNUC__*100+__GNUC_MINOR__>301) && !defined(BOOST_EXCEPTION_ENABLE_WARNINGS)
#pragma GCC system_header
#endif
#if defined(_MSC_VER) && !defined(BOOST_EXCEPTION_ENABLE_WARNINGS)
#pragma warning(push,1)
#endif

#include <boost/exception/exception.hpp>
#include <boost/exception/to_string_stub.hpp>
#include <boost/exception/detail/error_info_impl.hpp>
#include <boost/exception/detail/shared_ptr.hpp>
#include <boost/config.hpp>
#include <map>

namespace
boost
    {
    template <class Tag,class T>
    inline
    std::string
    error_info_name( error_info<Tag,T> const & x )
        {
        return tag_type_name<Tag>();
        }

    template <class Tag,class T>
    inline
    std::string
    to_string( error_info<Tag,T> const & x )
        {
        return '[' + error_info_name(x) + "] = " + to_string_stub(x.value()) + '\n';
        }

    template <class Tag,class T>
    inline
    error_info<Tag,T>::
    error_info( value_type const & value ):
        value_(value)
        {
        }

#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
    template <class Tag,class T>
    inline
    error_info<Tag,T>::
    error_info( error_info const & x ):
        value_(x.value_)
        {
        }
    template <class Tag,class T>
    inline
    error_info<Tag,T>::
    error_info( value_type && value ) BOOST_NOEXCEPT_IF(BOOST_NOEXCEPT_EXPR(value_type(std::move(value)))):
        value_(std::move(value))
        {
        }
    template <class Tag,class T>
    inline
    error_info<Tag,T>::
    error_info( error_info && x ) BOOST_NOEXCEPT_IF(BOOST_NOEXCEPT_EXPR(value_type(std::move(x.value_)))):
        value_(std::move(x.value_))
        {
        }
#endif

    template <class Tag,class T>
    inline
    error_info<Tag,T>::
    ~error_info() throw()
        {
        }

    template <class Tag,class T>
    inline
    std::string
    error_info<Tag,T>::
    name_value_string() const
        {
        return to_string_stub(*this);
        }

    namespace
    exception_detail
        {
        class
        error_info_container_impl:
            public error_info_container
            {
            public:

            error_info_container_impl():
                count_(0)
                {
                }

            ~error_info_container_impl() throw()
                {
                }

            void
            set( shared_ptr<error_info_base> const & x, type_info_ const & typeid_ )
                {
                BOOST_ASSERT(x);
                info_[typeid_] = x;
                diagnostic_info_str_.clear();
                }

            shared_ptr<error_info_base>
            get( type_info_ const & ti ) const
                {
                error_info_map::const_iterator i=info_.find(ti);
                if( info_.end()!=i )
                    {
                    shared_ptr<error_info_base> const & p = i->second;
#ifndef BOOST_NO_RTTI
                    BOOST_ASSERT( *BOOST_EXCEPTION_DYNAMIC_TYPEID(*p).type_==*ti.type_ );
#endif
                    return p;
                    }
                return shared_ptr<error_info_base>();
                }

            char const *
            diagnostic_information( char const * header ) const
                {
                if( header )
                    {
                    std::ostringstream tmp;
                    tmp << header;
                    for( error_info_map::const_iterator i=info_.begin(),end=info_.end(); i!=end; ++i )
                        {
                        error_info_base const & x = *i->second;
                        tmp << x.name_value_string();
                        }
                    tmp.str().swap(diagnostic_info_str_);
                    }
                return diagnostic_info_str_.c_str();
                }

            private:

            friend class boost::exception;

            typedef std::map< type_info_, shared_ptr<error_info_base> > error_info_map;
            error_info_map info_;
            mutable std::string diagnostic_info_str_;
            mutable int count_;

            error_info_container_impl( error_info_container_impl const & );
            error_info_container_impl & operator=( error_info_container const & );

            void
            add_ref() const
                {
                ++count_;
                }

            bool
            release() const
                {
                if( --count_ )
                    return false;
                else
                    {
                    delete this;
                    return true;
                    }
                }

            refcount_ptr<error_info_container>
            clone() const
                {
                refcount_ptr<error_info_container> p;
                error_info_container_impl * c=new error_info_container_impl;
                p.adopt(c);
                c->info_ = info_;
                return p;
                }
            };

        template <class E,class Tag,class T>
        inline
        E const &
        set_info( E const & x, error_info<Tag,T> const & v )
            {
            typedef error_info<Tag,T> error_info_tag_t;
            shared_ptr<error_info_tag_t> p( new error_info_tag_t(v) );
            exception_detail::error_info_container * c=x.data_.get();
            if( !c )
                x.data_.adopt(c=new exception_detail::error_info_container_impl);
            c->set(p,BOOST_EXCEPTION_STATIC_TYPEID(error_info_tag_t));
            return x;
            }

#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
        template <class E,class Tag,class T>
        E const & set_info( E const &, error_info<Tag,T> && );
        template <class T>
        struct set_info_rv;
        template <class Tag,class T>
        struct
        set_info_rv<error_info<Tag,T> >
            {
            template <class E,class Tag1,class T1>
            friend E const & set_info( E const &, error_info<Tag1,T1> && );
            template <class E>
            static
            E const &
            set( E const & x, error_info<Tag,T> && v )
                {
                typedef error_info<Tag,T> error_info_tag_t;
                shared_ptr<error_info_tag_t> p( new error_info_tag_t(std::move(v)) );
                exception_detail::error_info_container * c=x.data_.get();
                if( !c )
                    x.data_.adopt(c=new exception_detail::error_info_container_impl);
                c->set(p,BOOST_EXCEPTION_STATIC_TYPEID(error_info_tag_t));
                return x;
                }
            };
        template <>
        struct
        set_info_rv<throw_function>
            {
            template <class E,class Tag1,class T1>
            friend E const & set_info( E const &, error_info<Tag1,T1> && );
            template <class E>
            static
            E const &
            set( E const & x, throw_function && y )
                {
                x.throw_function_=y.v_;
                return x;
                }
            };
        template <>
        struct
        set_info_rv<throw_file>
            {
            template <class E,class Tag1,class T1>
            friend E const & set_info( E const &, error_info<Tag1,T1> && );
            template <class E>
            static
            E const &
            set( E const & x, throw_file && y )
                {
                x.throw_file_=y.v_;
                return x;
                }
            };
        template <>
        struct
        set_info_rv<throw_line>
            {
            template <class E,class Tag1,class T1>
            friend E const & set_info( E const &, error_info<Tag1,T1> && );
            template <class E>
            static
            E const &
            set( E const & x, throw_line && y )
                {
                x.throw_line_=y.v_;
                return x;
                }
            };
        template <class E,class Tag,class T>
        inline
        E const &
        set_info( E const & x, error_info<Tag,T> && v )
            {
            return set_info_rv<error_info<Tag,T> >::template set<E>(x,std::move(v));
            }
#endif

        template <class T>
        struct
        derives_boost_exception
            {
            enum e { value = (sizeof(dispatch_boost_exception((T*)0))==sizeof(large_size)) };
            };
        }

    template <class E,class Tag,class T>
    inline
    typename enable_if<exception_detail::derives_boost_exception<E>,E const &>::type
    operator<<( E const & x, error_info<Tag,T> const & v )
        {
        return exception_detail::set_info(x,v);
        }

#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
    template <class E,class Tag,class T>
    inline
    typename enable_if<exception_detail::derives_boost_exception<E>,E const &>::type
    operator<<( E const & x, error_info<Tag,T> && v )
        {
        return exception_detail::set_info(x,std::move(v));
        }
#endif
    }

#if defined(_MSC_VER) && !defined(BOOST_EXCEPTION_ENABLE_WARNINGS)
#pragma warning(pop)
#endif
#endif
