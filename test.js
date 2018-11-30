const path = require("path");

const chai = require("chai");
const assert = chai.assert;

describe("arguments", () => {
	const args = require("./src/arguments/index.js");
	Object.keys(args).forEach(key => {
		const arg = args[key];
		describe(key, () => {
			it("extends generic argument", () => {
				assert.isTrue(arg === args.generic || arg.prototype instanceof args.generic);
			});
		});
	});
});
