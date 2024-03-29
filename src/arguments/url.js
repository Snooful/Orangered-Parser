const InvalidArgumentError = require("../errors/invalid-argument.js");
const StringArgument = require("./string.js");

/**
 * A URL argument.
 */
class URLArgument extends StringArgument {
	constructor(argument) {
		super(argument);
		this.type = "url";
	}

	getValue(value, args) {
		const string = super.getValue(value, args);
		try {
			const url = new URL(string);
			return url;
		} catch (error) {
			return new InvalidArgumentError(this, args, "url_argument_invalid", value);
		}
	}
}
module.exports = URLArgument;
