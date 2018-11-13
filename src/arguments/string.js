const InvalidArgumentError = require("./../errors/invalid-argument-error.js");
const Argument = require("./generic.js");

class StringArgument extends Argument {
	constructor(argument) {
		super(argument);

		this.type = "string";

		this.min = argument.minLength || 0;
		this.max = argument.maxLength || Infinity;

		this.matches = new RegExp(argument.matches);
	}

	getValue(value, args) {
		if (value === undefined) {
			return undefined;
		}

		const str = value.toString();
		if (!this.matches.test(str)) {
			return new InvalidArgumentError(this.constructor, args, "string_argument_regexp_fail", this, value);
		} else if (str.length >= this.max) {
			return new InvalidArgumentError(this.constructor, args, "string_argument_too_long", this, value);
		} else if (str.length <= this.min) {
			return new InvalidArgumentError(this.constructor, args, "string_argument_too_short", this, value);
		} else {
			return str;
		}
	}
}
module.exports = StringArgument;