package versioned.host.exp.exponent.modules.api.reanimated;

public class AndroidErrorHandler {

    public static void raise(String message) {
        throw new RuntimeException(message);
    }
    
}