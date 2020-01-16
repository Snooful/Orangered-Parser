const Argument = require("./generic.js");

/**
 * A custom argument.
 */
class CustomArgument extends Argument {
	constructor(argument) {
		super(argument);

		this.type = "custom";
		this.custom = argument.custom;
	}

	getValue(...args) {
		this.custom(...args);
	}
}
module.exports = CustomArgument;