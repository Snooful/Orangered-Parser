const Argument = require("./generic.js");

class CustomArgument extends Argument {
	constructor(argument) {
		super(argument);

		this.type = "custom";
		this.custom = argument.custom;
	}

	getValue() {
		this.custom(...arguments);
	}
}
module.exports = CustomArgument;