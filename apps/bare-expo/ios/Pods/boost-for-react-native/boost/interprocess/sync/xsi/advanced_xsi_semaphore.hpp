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

#ifndef BOOST_INTERPROCESS_SYNC_XSI_ADVANCED_XSI_SEMAPHORE_HPP
#define BOOST_INTERPROCESS_SYNC_XSI_ADVANCED_XSI_SEMAPHORE_HPP

#if defined(_MSC_VER)
#  pragma once
#endif

#include <sys/ipc.h>
#include <sys/sem.h>
#include <errno.h>

namespace boost {
namespace interprocess {
namespace xsi {

// Create a semaphore with a specified initial value.
// If the semaphore already exists, we don't initialize it (of course).
// We return the semaphore ID if all OK, else -1.

inline bool advanced_sem_open_or_create(::key_t key, int initval, int &semid, int perm)
{
   semid = -1;
   int id, semval;
   union semun {
      int         val;
      ::semid_ds *buf;
      ushort     *array;
   } semctl_arg;

   if (key == IPC_PRIVATE)
      return false; //not intended for private semaphores

   else if (key == (::key_t) -1)
      return false; //probably an ftok() error by caller

   again:
   if ((id = ::semget(key, 3, (perm & 0x01FF) | IPC_CREAT)) < 0)
      return false;   //permission problem or tables full

   // When the semaphore is created, we know that the value of all
   // 3 members is 0.
   // Get a lock on the semaphore by waiting for [2] to equal 0,
   // then increment it.
   //
   // There is a race condition here.  There is a possibility that
   // between the semget() above and the ::semop() below, another
   // process can call our sem_close() function which can remove
   // the semaphore if that process is the last one using it.
   // Therefore, we handle the error condition of an invalid
   // semaphore ID specially below, and if it does happen, we just
   // go back and create it again.
   struct sembuf op_lock[2] = {
      {2, 0, 0},        // wait for [2] (lock) to equal 0
      {2, 1, SEM_UNDO}  // then increment [2] to 1 - this locks it
                        // UNDO to release the lock if processes exits
                        // before explicitly unlocking
   };

   if (::semop(id, &op_lock[0], 2) < 0) {
      if (errno == EINVAL)
         goto again;
   }

   // Get the value of the process counter.  If it equals 0,
   // then no one has initialized the semaphore yet.
   if ((semval = ::semctl(id, 1, GETVAL, 0)) < 0)
      return false;

   if (semval == 0) {
      // We could initialize by doing a SETALL, but that
      // would clear the adjust value that we set when we
      // locked the semaphore above.  Instead, we'll do 2
      // system calls to initialize [0] and [1].
      semctl_arg.val = initval;
      if (::semctl(id, 0, SETVAL, semctl_arg) < 0)
         return false;

      semctl_arg.val = 1;
      if (::semctl(id, 1, SETVAL, semctl_arg) < 0)
         return false;
   }

   // Decrement the process counter and then release the lock.
   struct sembuf op_unlock[1] = {
      2, -1, 0/*SEM_UNDO*/ // decrement [2] (lock) back to 0
   };

   if (::semop(id, &op_unlock[0], 1) < 0)
      return false;

   semid = id;
   return true;
}

// Open a semaphore that must already exist.
// This function should be used, instead of sem_create(), if the caller
// knows that the semaphore must already exist.  For example a client
// from a client-server pair would use this, if its the server's
// responsibility to create the semaphore.
// We return the semaphore ID if all OK, else -1.
/*
inline bool advanced_sem_open(key_t key, int &semid)
{
   semid = -1;
   if (key == IPC_PRIVATE)
      return false; // not intended for private semaphores

   else if (key == (::key_t) -1)
      return false;  // probably an ftok() error by caller

   if ((semid = ::semget(key, 3, 0)) < 0)
      return false;     // doesn't exist, or tables full

   // Decrement the process counter.  We don't need a lock
   struct sembuf op_open[1] = {
      1, -1, SEM_UNDO   // decrement [1] (proc counter) with undo on exit
   };

   if (::semop(id, &op_open[0], 1) < 0)
      return false;

   return true;
}
*/
/****************************************************************************
 * Remove a semaphore.
 * This call is intended to be called by a server, for example,
 * when it is being shut down, as we do an IPC_RMID on the semaphore,
 * regardless whether other processes may be using it or not.
 * Most other processes should use sem_close() below.
 */

inline bool advanced_sem_rm(int id)
{
   if (::semctl(id, 0, IPC_RMID, 0) < 0)
      return false;
   return true;
}


/****************************************************************************
 * General semaphore operation.  Increment or decrement by a user-specified
 * amount (positive or negative; amount can't be zero).
 */

inline bool advanced_sem_op(int id, int value, bool undo = true)
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

#endif //BOOST_INTERPROCESS_SYNC_XSI_ADVANCED_XSI_SEMAPHORE_HPP
