const InvalidArgumentError = require("../errors/invalid-argument.js");
const Argument = require("./generic.js");

const yn = require("yn");

class BooleanArgument extends Argument {
	constructor(argument) {
		super(argument);

		this.type = "boolean";
		this.lenient = argument.lenient || true;
	}

	getValue(value) {
		if (value === undefined) {
			return undefined;
		}

		return yn(value, {
			lenient: this.lenient,
		});
	}
}
module.exports = BooleanArgument;