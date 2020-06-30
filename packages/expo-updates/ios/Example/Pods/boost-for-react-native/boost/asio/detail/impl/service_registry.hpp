//
// detail/impl/service_registry.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_DETAIL_IMPL_SERVICE_REGISTRY_HPP
#define BOOST_ASIO_DETAIL_IMPL_SERVICE_REGISTRY_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

template <typename Service, typename Arg>
service_registry::service_registry(
    boost::asio::io_service& o, Service*, Arg arg)
  : owner_(o),
    first_service_(new Service(o, arg))
{
  boost::asio::io_service::service::key key;
  init_key(key, Service::id);
  first_service_->key_ = key;
  first_service_->next_ = 0;
}

template <typename Service>
Service& service_registry::first_service()
{
  return *static_cast<Service*>(first_service_);
}

template <typename Service>
Service& service_registry::use_service()
{
  boost::asio::io_service::service::key key;
  init_key(key, Service::id);
  factory_type factory = &service_registry::create<Service>;
  return *static_cast<Service*>(do_use_service(key, factory));
}

template <typename Service>
void service_registry::add_service(Service* new_service)
{
  boost::asio::io_service::service::key key;
  init_key(key, Service::id);
  return do_add_service(key, new_service);
}

template <typename Service>
bool service_registry::has_service() const
{
  boost::asio::io_service::service::key key;
  init_key(key, Service::id);
  return do_has_service(key);
}

#if !defined(BOOST_ASIO_NO_TYPEID)
template <typename Service>
void service_registry::init_key(boost::asio::io_service::service::key& key,
    const boost::asio::detail::service_id<Service>& /*id*/)
{
  key.type_info_ = &typeid(typeid_wrapper<Service>);
  key.id_ = 0;
}
#endif // !defined(BOOST_ASIO_NO_TYPEID)

template <typename Service>
boost::asio::io_service::service* service_registry::create(
    boost::asio::io_service& owner)
{
  return new Service(owner);
}

} // namespace detail
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_DETAIL_IMPL_SERVICE_REGISTRY_HPP
