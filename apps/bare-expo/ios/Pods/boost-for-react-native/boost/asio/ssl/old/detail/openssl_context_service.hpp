//
// ssl/old/detail/openssl_context_service.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2005 Voipster / Indrek dot Juhani at voipster dot com
// Copyright (c) 2005-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_SSL_OLD_DETAIL_OPENSSL_CONTEXT_SERVICE_HPP
#define BOOST_ASIO_SSL_OLD_DETAIL_OPENSSL_CONTEXT_SERVICE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <cstring>
#include <string>
#include <boost/function.hpp>
#include <boost/asio/detail/throw_error.hpp>
#include <boost/asio/error.hpp>
#include <boost/asio/io_service.hpp>
#include <boost/asio/ssl/context_base.hpp>
#include <boost/asio/ssl/detail/openssl_init.hpp>
#include <boost/asio/ssl/detail/openssl_types.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace ssl {
namespace old {
namespace detail {

class openssl_context_service
  : public boost::asio::detail::service_base<openssl_context_service>
{
public:
  // The native type of the context.
  typedef ::SSL_CTX* impl_type;

  // The type for the password callback function object.
  typedef boost::function<std::string(std::size_t,
      context_base::password_purpose)> password_callback_type;

  // Constructor.
  openssl_context_service(boost::asio::io_service& io_service)
    : boost::asio::detail::service_base<openssl_context_service>(io_service)
  {
  }

  // Destroy all user-defined handler objects owned by the service.
  void shutdown_service()
  {
  }

  // Return a null context implementation.
  static impl_type null()
  {
    return 0;
  }

  // Create a new context implementation.
  void create(impl_type& impl, context_base::method m)
  {
    switch (m)
    {
#if defined(OPENSSL_NO_SSL2)
    case context_base::sslv2:
    case context_base::sslv2_client:
    case context_base::sslv2_server:
      boost::asio::detail::throw_error(boost::asio::error::invalid_argument);
      break;
#else // defined(OPENSSL_NO_SSL2)
    case context_base::sslv2:
      impl = ::SSL_CTX_new(::SSLv2_method());
      break;
    case context_base::sslv2_client:
      impl = ::SSL_CTX_new(::SSLv2_client_method());
      break;
    case context_base::sslv2_server:
      impl = ::SSL_CTX_new(::SSLv2_server_method());
      break;
#endif // defined(OPENSSL_NO_SSL2)
#if defined(OPENSSL_NO_SSL3)
    case context_base::sslv3:
    case context_base::sslv3_client:
    case context_base::sslv3_server:
      boost::asio::detail::throw_error(boost::asio::error::invalid_argument);
      break;
#else // defined(OPENSSL_NO_SSL3)
    case context_base::sslv3:
      impl = ::SSL_CTX_new(::SSLv3_method());
      break;
    case context_base::sslv3_client:
      impl = ::SSL_CTX_new(::SSLv3_client_method());
      break;
    case context_base::sslv3_server:
      impl = ::SSL_CTX_new(::SSLv3_server_method());
      break;
#endif // defined(OPENSSL_NO_SSL3)
    case context_base::tlsv1:
      impl = ::SSL_CTX_new(::TLSv1_method());
      break;
    case context_base::tlsv1_client:
      impl = ::SSL_CTX_new(::TLSv1_client_method());
      break;
    case context_base::tlsv1_server:
      impl = ::SSL_CTX_new(::TLSv1_server_method());
      break;
    case context_base::sslv23:
      impl = ::SSL_CTX_new(::SSLv23_method());
      break;
    case context_base::sslv23_client:
      impl = ::SSL_CTX_new(::SSLv23_client_method());
      break;
    case context_base::sslv23_server:
      impl = ::SSL_CTX_new(::SSLv23_server_method());
      break;
    default:
      impl = ::SSL_CTX_new(0);
      break;
    }
  }

  // Destroy a context implementation.
  void destroy(impl_type& impl)
  {
    if (impl != null())
    {
      if (impl->default_passwd_callback_userdata)
      {
        password_callback_type* callback =
          static_cast<password_callback_type*>(
              impl->default_passwd_callback_userdata);
        delete callback;
        impl->default_passwd_callback_userdata = 0;
      }

      ::SSL_CTX_free(impl);
      impl = null();
    }
  }

  // Set options on the context.
  boost::system::error_code set_options(impl_type& impl,
      context_base::options o, boost::system::error_code& ec)
  {
    ::SSL_CTX_set_options(impl, o);

    ec = boost::system::error_code();
    return ec;
  }

  // Set peer verification mode.
  boost::system::error_code set_verify_mode(impl_type& impl,
      context_base::verify_mode v, boost::system::error_code& ec)
  {
    ::SSL_CTX_set_verify(impl, v, 0);

    ec = boost::system::error_code();
    return ec;
  }

  // Load a certification authority file for performing verification.
  boost::system::error_code load_verify_file(impl_type& impl,
      const std::string& filename, boost::system::error_code& ec)
  {
    if (::SSL_CTX_load_verify_locations(impl, filename.c_str(), 0) != 1)
    {
      ec = boost::asio::error::invalid_argument;
      return ec;
    }

    ec = boost::system::error_code();
    return ec;
  }

  // Add a directory containing certification authority files to be used for
  // performing verification.
  boost::system::error_code add_verify_path(impl_type& impl,
      const std::string& path, boost::system::error_code& ec)
  {
    if (::SSL_CTX_load_verify_locations(impl, 0, path.c_str()) != 1)
    {
      ec = boost::asio::error::invalid_argument;
      return ec;
    }

    ec = boost::system::error_code();
    return ec;
  }

  // Use a certificate from a file.
  boost::system::error_code use_certificate_file(impl_type& impl,
      const std::string& filename, context_base::file_format format,
      boost::system::error_code& ec)
  {
    int file_type;
    switch (format)
    {
    case context_base::asn1:
      file_type = SSL_FILETYPE_ASN1;
      break;
    case context_base::pem:
      file_type = SSL_FILETYPE_PEM;
      break;
    default:
      {
        ec = boost::asio::error::invalid_argument;
        return ec;
      }
    }

    if (::SSL_CTX_use_certificate_file(impl, filename.c_str(), file_type) != 1)
    {
      ec = boost::asio::error::invalid_argument;
      return ec;
    }

    ec = boost::system::error_code();
    return ec;
  }

  // Use a certificate chain from a file.
  boost::system::error_code use_certificate_chain_file(impl_type& impl,
      const std::string& filename, boost::system::error_code& ec)
  {
    if (::SSL_CTX_use_certificate_chain_file(impl, filename.c_str()) != 1)
    {
      ec = boost::asio::error::invalid_argument;
      return ec;
    }

    ec = boost::system::error_code();
    return ec;
  }

  // Use a private key from a file.
  boost::system::error_code use_private_key_file(impl_type& impl,
      const std::string& filename, context_base::file_format format,
      boost::system::error_code& ec)
  {
    int file_type;
    switch (format)
    {
    case context_base::asn1:
      file_type = SSL_FILETYPE_ASN1;
      break;
    case context_base::pem:
      file_type = SSL_FILETYPE_PEM;
      break;
    default:
      {
        ec = boost::asio::error::invalid_argument;
        return ec;
      }
    }

    if (::SSL_CTX_use_PrivateKey_file(impl, filename.c_str(), file_type) != 1)
    {
      ec = boost::asio::error::invalid_argument;
      return ec;
    }

    ec = boost::system::error_code();
    return ec;
  }

  // Use an RSA private key from a file.
  boost::system::error_code use_rsa_private_key_file(impl_type& impl,
      const std::string& filename, context_base::file_format format,
      boost::system::error_code& ec)
  {
    int file_type;
    switch (format)
    {
    case context_base::asn1:
      file_type = SSL_FILETYPE_ASN1;
      break;
    case context_base::pem:
      file_type = SSL_FILETYPE_PEM;
      break;
    default:
      {
        ec = boost::asio::error::invalid_argument;
        return ec;
      }
    }

    if (::SSL_CTX_use_RSAPrivateKey_file(
          impl, filename.c_str(), file_type) != 1)
    {
      ec = boost::asio::error::invalid_argument;
      return ec;
    }

    ec = boost::system::error_code();
    return ec;
  }

  // Use the specified file to obtain the temporary Diffie-Hellman parameters.
  boost::system::error_code use_tmp_dh_file(impl_type& impl,
      const std::string& filename, boost::system::error_code& ec)
  {
    ::BIO* bio = ::BIO_new_file(filename.c_str(), "r");
    if (!bio)
    {
      ec = boost::asio::error::invalid_argument;
      return ec;
    }

    ::DH* dh = ::PEM_read_bio_DHparams(bio, 0, 0, 0);
    if (!dh)
    {
      ::BIO_free(bio);
      ec = boost::asio::error::invalid_argument;
      return ec;
    }

    ::BIO_free(bio);
    int result = ::SSL_CTX_set_tmp_dh(impl, dh);
    ::DH_free(dh);
    if (result != 1)
    {
      ec = boost::asio::error::invalid_argument;
      return ec;
    }

    ec = boost::system::error_code();
    return ec;
  }

  static int password_callback(char* buf, int size, int purpose, void* data)
  {
    using namespace std; // For strncat and strlen.

    if (data)
    {
      password_callback_type* callback =
        static_cast<password_callback_type*>(data);
      std::string passwd = (*callback)(static_cast<std::size_t>(size),
          purpose ? context_base::for_writing : context_base::for_reading);
      *buf = '\0';
      strncat(buf, passwd.c_str(), size);
      return strlen(buf);
    }

    return 0;
  }

  // Set the password callback.
  template <typename Password_Callback>
  boost::system::error_code set_password_callback(impl_type& impl,
      Password_Callback callback, boost::system::error_code& ec)
  {
    // Allocate callback function object if not already present.
    if (impl->default_passwd_callback_userdata)
    {
      password_callback_type* callback_function =
        static_cast<password_callback_type*>(
            impl->default_passwd_callback_userdata);
      *callback_function = callback;
    }
    else
    {
      password_callback_type* callback_function =
        new password_callback_type(callback);
      impl->default_passwd_callback_userdata = callback_function;
    }

    // Set the password callback.
    SSL_CTX_set_default_passwd_cb(impl,
        &openssl_context_service::password_callback);

    ec = boost::system::error_code();
    return ec;
  }

private:
  // Ensure openssl is initialised.
  boost::asio::ssl::detail::openssl_init<> init_;
};

} // namespace detail
} // namespace old
} // namespace ssl
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_SSL_OLD_DETAIL_OPENSSL_CONTEXT_SERVICE_HPP
