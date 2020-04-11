const assert = require("assert");

const Blake = require("../src/hash");

describe("#blake2b", () => {
  it("verify valid pow", async () => {
    const pow = "5d0b9cf2860d2683";
    const hash =
      "63239BD69BFA87A843A5A4092A08C023D0824FC4AB30F3F24ED04382EF78C005";
    assert.ok(await Blake.powValidate(pow, hash));
  });

  it("generate valid pow", async function () {
    this.timeout(0);

    const hash =
      "63239BD69BFA87A843A5A4092A08C023D0824FC4AB30F3F24ED04382EF78C005";
    const pow = await Blake.powGenerate(hash, 5);
    assert.ok(await Blake.powValidate(pow, hash));
  });
});
