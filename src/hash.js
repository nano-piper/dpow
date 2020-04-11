const crypto = require("crypto");
const blake2 = require("blake2.wasm");
const { StaticPool } = require("node-worker-threads-pool");

const count = 16;

const incNonce = (nonce) => {
  if (nonce[4] === 255) {
    if (nonce[3] === 255) {
      if (nonce[2] === 255) {
        if (nonce[1] === 255 && nonce[5] === 256 - count) {
          ++nonce[0];
        }
        ++nonce[1];
      } else if (nonce[5] === 256 - count) {
        ++nonce[2];
      }
    } else if (nonce[5] === 256 - count) {
      ++nonce[3];
    }
  } else if (nonce[5] === 256 - count) {
    ++nonce[4];
  }
  nonce[5] += count;

  return nonce;
};

const Hash = {
  ready: () => {
    return new Promise((resolve) => {
      blake2.ready(() => resolve());
    });
  },

  powGenerate: async (hash, threads = 1) => {
    const pool = new StaticPool({
      size: threads,
      task: `${__dirname}/worker.js`,
    });

    const b = crypto.randomBytes(8);
    const nonce = new Uint8Array(
      b.buffer,
      b.byteOffset,
      b.byteLength / Uint8Array.BYTES_PER_ELEMENT
    );

    const promises = new Array(threads);
    for (let i = 0; i < threads; ++i) {
      promises[i] = pool.exec({ hash, nonce, count, index: i });

      incNonce(nonce);
    }

    let i = 0;
    const date = new Date();
    const chunk = 256 * 256 * count;
    while (true) {
      const { result, index } = await Promise.race(promises);
      console.log("%d hashes, %ds", ++i * chunk, (new Date() - date) / 1000.0);

      if (result) {
        pool.destroy();
        return result;
      }

      promises[index] = pool.exec({ hash, nonce, count, index });

      incNonce(nonce);
    }
  },

  powThrehold: (buf) => {
    const threshold = Buffer.from("ffffffc000000000", "hex");
    return Buffer.compare(buf, threshold) >= 0;
  },

  powValidate: async (pow, hash) => {
    const _pow = Buffer.from(pow, "hex");
    _pow.reverse();

    await Hash.ready();

    const h = blake2.Blake2b(8);
    h.update(_pow);
    h.update(Buffer.from(hash, "hex"));

    const final = h.final();
    final.reverse();

    return Hash.powThrehold(final);
  },
};

module.exports = Hash;
