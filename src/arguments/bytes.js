const InvalidArgumentError = require("../errors/invalid-argument.js");
const Argument = require("./generic.js");

const { parse } = require("bytes");

class BytesArgument extends Argument {
	constructor(argument) {
		super(argument);
		this.type = "bytes";
	}

	getValue(value, args) {
		if (value === undefined) {
			return undefined;
		}

		const bytes = parse(value);
		if (bytes === null) {
			return new InvalidArgumentError(this, args, "bytes_argument_invalid", value);
		} else {
			return bytes;
		}
	}
}
module.exports = BytesArgument;