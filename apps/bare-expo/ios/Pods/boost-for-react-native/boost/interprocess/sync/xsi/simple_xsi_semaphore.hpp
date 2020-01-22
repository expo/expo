//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2011-2012. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/interprocess for documentation.
//
//////////////////////////////////////////////////////////////////////////////
#ifndef BOOST_INTERPROCESS_SYNC_XSI_SIMPLE_XSI_SEMAPHORE_HPP
#define BOOST_INTERPROCESS_SYNC_XSI_SIMPLE_XSI_SEMAPHORE_HPP

#if defined(_MSC_VER)
#  pragma once
#endif

/*
 * Provide an simpler and easier to understand interface to the System V
 * semaphore system calls.  There are 7 routines available to the user:
 *
 *      id = sem_create(key, initval);  # create with initial value or open
 *      id = sem_open(key);             # open (must already exist)
 *      sem_wait(id);                   # wait = P = down by 1
 *      sem_signal(id);                 # signal = V = up by 1
 *      sem_op(id, amount);             # wait   if (amount < 0)
 *                                      # signal if (amount > 0)
 *      sem_close(id);                  # close
 *      sem_rm(id);                     # remove (delete)
 *
 * We create and use a 3-member set for the requested semaphore.
 * The first member, [0], is the actual semaphore value, and the second
 * member, [1], is a counter used to know when all processes have finished
 * with the semaphore.  The counter is initialized to a large number,
 * decremented on every create or open and incremented on every close.
 * This way we can use the "adjust" feature provided by System V so that
 * any process that exit's without calling sem_close() is accounted
 * for.  It doesn't help us if the last process does this (as we have
 * no way of getting control to remove the semaphore) but it will
 * work if any process other than the last does an exit (intentional
 * or unintentional).
 * The third member, [2], of the semaphore set is used as a lock variable
 * to avoid any race conditions in the sem_create() and sem_close()
 * functions.
 */

#include <sys/ipc.h>
#include <sys/sem.h>
#include <errno.h>

namespace boost {
namespace interprocess {
namespace xsi {

// Create a semaphore with a specified initial value.
// If the semaphore already exists, we don't initialize it (of course).
// We return the semaphore ID if all OK, else -1.

inline bool simple_sem_open_or_create(::key_t key, int initval, int &semid, int perm)
{
   int id, semval;
   semid = -1;

   if (key == IPC_PRIVATE)
      return false; //not intended for private semaphores

   else if (key == (::key_t) -1)
      return false; //probably an ftok() error by caller

   again:
   if ((id = ::semget(key, 1, (perm & 0x01FF) | IPC_CREAT)) < 0)
      return false;   //permission problem or tables full

   semid = id;
   return true;
}

/****************************************************************************
 * Remove a semaphore.
 * This call is intended to be called by a server, for example,
 * when it is being shut down, as we do an IPC_RMID on the semaphore,
 * regardless whether other processes may be using it or not.
 * Most other processes should use sem_close() below.
 */

inline bool simple_sem_rm(int id)
{
   if (::semctl(id, 0, IPC_RMID, 0) < 0)
      return false;
   return true;
}


/****************************************************************************
 * General semaphore operation.  Increment or decrement by a user-specified
 * amount (positive or negative; amount can't be zero).
 */

inline bool simple_sem_op(int id, int value, bool undo = true)
{
   ::sembuf op_op[1] = {
      0, 99, 0 // decrement or increment [0] with undo on exit
               // the 99 is set to the actual amount to add
               // or subtract (positive or negative)
   };
   if(undo){
      op_op[0].sem_flg = SEM_UNDO;
   }
   if ((op_op[0].sem_op = value) == 0)
      return false;

   if (::semop(id, &op_op[0], 1) < 0)
      return false;
   return true;
}

}  //namespace xsi {
}  //namespace interprocess {
}  //namespace boost {

#endif //BOOST_INTERPROCESS_SYNC_XSI_SIMPLE_XSI_SEMAPHORE_HPP
