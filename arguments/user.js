const InvalidArgumentError = require("./../errors/invalid-argument-error.js");
const StringArgument = require("./string.js");

class UserArgument extends StringArgument {
	constructor(argument) {
		super(argument);
	}

	getValue(value, args) {
		const string = super.getValue(value, args);

		// :thinking:
		const noU = /(u\/)?(.*)/i.exec(string)[2];

		if (/^[\w-]+$/.test(noU)) {
			if (noU.length < 3) {
				return new InvalidArgumentError(this.constructor, args, "user_argument_too_short", this, value);
			} else if (noU.length > 20) {
				return new InvalidArgumentError(this.constructor, args, "user_argument_too_long", this, value);
			} else {
				return noU;
			}
		} else {
			return new InvalidArgumentError(this.constructor, args, "user_argument_invalid", this, value);
		}
	}
}
module.exports = UserArgument;