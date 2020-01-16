const InvalidArgumentError = require("../errors/invalid-argument.js");
const StringArgument = require("./string.js");

/**
 * A user argument.
 */
class UserArgument extends StringArgument {
	constructor(argument) {
		super(argument);
		this.type = "user";
	}

	getValue(value, args) {
		const string = super.getValue(value, args);

		// :thinking:
		const noU = /(u\/)?(.*)/i.exec(string)[2];

		if (/^[\w-]+$/.test(noU)) {
			if (noU.length < 3) {
				return new InvalidArgumentError(this, args, "user_argument_too_short", value);
			} else if (noU.length > 20) {
				return new InvalidArgumentError(this, args, "user_argument_too_long", value);
			} else {
				return noU;
			}
		} else {
			return new InvalidArgumentError(this, args, "user_argument_invalid", value);
		}
	}
}
module.exports = UserArgument;