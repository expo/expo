package host.exp.exponent.storage;

import androidx.annotation.NonNull;

import org.jetbrains.annotations.NotNull;

import expo.modules.updates.manifest.raw.RawManifest;

public class ExponentDBObject {
    @NonNull
    public String manifestUrl;
    @NonNull public RawManifest manifest;
    @NonNull public String bundleUrl;

    public ExponentDBObject(@NotNull String manifestUrl, @NotNull RawManifest manifest, @NotNull String bundleUrl) {
        this.manifestUrl = manifestUrl;
        this.manifest = manifest;
        this.bundleUrl = bundleUrl;
    }
}
