export default function checkInit(instance) {
  if (!instance.stripeInitialized) {
    throw new Error(`You should call init first.\nRead more https://github.com/tipsi/tipsi-stripe#usage`)
  }
}
