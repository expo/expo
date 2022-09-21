package expo.modules.interfaces.filesystem;

import java.io.File;
import java.util.Objects;

public final class ScopedDirectories {
    private final File cacheDir;
    private final File filesDir;

    public ScopedDirectories(File cacheDir, File filesDir) {
        this.cacheDir = cacheDir;
        this.filesDir = filesDir;
    }

    public File getCacheDir() {
        return cacheDir;
    }

    public File getFilesDir() {
        return filesDir;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) return true;
        if (obj == null || obj.getClass() != this.getClass()) return false;
        var that = (ScopedDirectories) obj;
        return Objects.equals(this.cacheDir, that.cacheDir) &&
                Objects.equals(this.filesDir, that.filesDir);
    }

    @Override
    public int hashCode() {
        return Objects.hash(cacheDir, filesDir);
    }

    @Override
    public String toString() {
        return "ScopedDirectories[" +
                "cacheDir=" + cacheDir + ", " +
                "filesDir=" + filesDir + ']';
    }
}