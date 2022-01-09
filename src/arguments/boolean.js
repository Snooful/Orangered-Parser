const InvalidArgumentError = require("../errors/invalid-argument.js");
const Argument = require("./generic.js");

const yn = require("yn");

/**
 * A boolean argument.
 */
class BooleanArgument extends Argument {
	constructor(argument) {
		super(argument);

		this.type = "boolean";
		this.lenient = argument.lenient || true;
	}

	getValue(value, args) {
		if (value === undefined) {
			return undefined;
		}

		const boolean = yn(value, {
			lenient: this.lenient,
		});
		return boolean === undefined ? new InvalidArgumentError(this, args, "boolean_argument_invalid", value) : boolean;
	}
}
module.exports = BooleanArgument;
