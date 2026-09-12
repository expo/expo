# ML Kit discovers this registrar through manifest metadata, then invokes its
# no-argument constructor. The transitive firebase-components 16.1.0 rule keeps
# the class alone, which can lose its constructor in R8 full mode.
-keep class com.google.mlkit.common.internal.CommonComponentRegistrar {
  public <init>();
}
