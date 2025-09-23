#include <stdio.h>
#include <syslog.h>

// Forward declare the Swift function
extern void screenshot_dylib_init(void);

// C function to write to syslog that Swift can call
void c_syslog(const char* message) {
    syslog(LOG_ERR, "%s", message);
}

__attribute__((constructor))
static void customConstructor(int argc, const char **argv)
 {
     printf("ScreenshotDylib!\n");
     syslog(LOG_ERR, "ScreenshotDylib Dylib injection successful in %s\n", argv[0]);

     // Call Swift initialization directly
     screenshot_dylib_init();
     syslog(LOG_ERR, "Returned from Swift screenshot_dylib_init");
}
