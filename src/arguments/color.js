const InvalidArgumentError = require("../errors/invalid-argument.js");
const Argument = require("./generic.js");

const chroma = require("chroma-js");

class ColorArgument extends Argument {
	constructor(argument) {
		super(argument);

		this.type = "color";
		this.allowAlias = argument.allowAlias || true;
	}

	getValue(value, args) {
		if (value === undefined) {
			return undefined;
		}

		try {
			return chroma(value);
		} catch (error) {
			if (typeof error === "string" && error.startsWith("unknown color:")) {
				return new InvalidArgumentError(this, args, "color_argument_invalid", value);
			} else {
				throw error;
			}
		}
	}
}
module.exports = ColorArgument;