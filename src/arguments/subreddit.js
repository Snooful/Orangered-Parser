const InvalidArgumentError = require("../errors/invalid-argument.js");
const StringArgument = require("./string.js");

/**
 * A string argument.
 */
class SubredditArgument extends StringArgument {
	constructor(argument) {
		super(argument);
		this.type = "subreddit";
	}

	getValue(value, args) {
		const string = super.getValue(value, args);
		const noR = /(r\/)?(.*)/i.exec(string)[2];

		if (/^[\dA-Za-z]\w+$/.test(noR)) {
			if (noR.length < 3) {
				return new InvalidArgumentError(this, args, "subreddit_argument_too_short", value);
			} else if (noR.length > 20) {
				return new InvalidArgumentError(this, args, "subreddit_argument_too_long", value);
			} else {
				return noR;
			}
		} else {
			return new InvalidArgumentError(this, args, "subreddit_argument_invalid", value);
		}
	}
}
module.exports = SubredditArgument;
