package com.wix.invoke.exceptions;

/**
 * Created by rotemm on 10/10/2016.
 */
public class EmptyInvocationInstructionException extends RuntimeException {

    public EmptyInvocationInstructionException() {
        super("Trying to invoke an empty instruction");
    }

}
