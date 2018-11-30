const path = require("path");

const chai = require("chai");
const assert = chai.assert;

describe("arguments", () => {
	const args = require("./src/arguments/index.js");
	
	args.forEach(key => {
		const arg = args[key];
		
		describe(key, () => {
			it("instance of generic argument", () => {
				assert.isTrue(arg instanceof args.generic);
			});
		});
	});
});
