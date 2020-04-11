const blake2 = require("blake2.wasm");
const { parentPort } = require("worker_threads");

const { powThrehold } = require("./hash");

// 4,194,304 hashes checked.
const pow = async (hash, nonce, count) => {
  for (let i = 1; i <= count; ++i) {
    for (let j = 1; j <= 256; ++j) {
      for (let k = 1; k <= 256; ++k) {
        const h = blake2.Blake2b(8);
        h.update(nonce);
        h.update(hash);

        const final = h.final();
        final.reverse();

        if (powThrehold(final)) {
          nonce.reverse();
          return Buffer.from(nonce).toString("hex").padStart(16, "0");
        }

        ++nonce[7];
      }
      ++nonce[6];
    }
    ++nonce[5];
  }

  return null;
};

blake2.ready(() => {
  parentPort.on("message", async ({ hash, index, nonce, count }) => {
    const _hash = Buffer.from(hash, "hex");
    const result = await pow(_hash, nonce, count);
    parentPort.postMessage({ result, index });
  });
});
