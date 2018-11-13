const InvalidArgumentError = require("../errors/invalid-argument.js");
const Argument = require("./generic.js");

class IntegerArgument extends Argument {
	constructor(argument) {
		super(argument);

		this.type = "integer";

		this.min = argument.min || -Infinity;
		this.max = argument.max || Infinity;
	}

	getValue(value, args) {
		if (value === undefined) {
			return undefined;
		}

		const int = parseInt(value);

		if (isNaN(int) || !Number.isInteger(int)) {
			return new InvalidArgumentError(this.constructor, args, "integer_argument_invalid", this, value);
		} else if (int >= this.max) {
			return new InvalidArgumentError(this.constructor, args, "integer_argument_too_high", this, value);
		} else if (int <= this.min) {
			return new InvalidArgumentError(this.constructor, args, "integer_argument_too_low", this, value);
		} else {
			return int;
		}
	}
}
module.exports = IntegerArgument;