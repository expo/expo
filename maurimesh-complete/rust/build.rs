use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    uniffi::generate_scaffolding("./src/lib.rs")?;
    println!("cargo:rerun-if-changed=./src/lib.rs");
    println!("cargo:rerun-if-changed=./uniffi.toml");
    Ok(())
}
