const InvalidArgumentError = require("./../errors/invalid-argument-error.js");
const StringArgument = require("./string.js");

class SubredditArgument extends StringArgument {
	constructor(argument) {
		super(argument);
	}

	getValue(value, args) {
		const string = super.getValue(value, args);
		const noR = /(r\/)?(.*)/i.exec(string)[2];

		if (/^[A-Za-z0-9]\w+$/.test(noR)) {
			if (noR.length < 3) {
				return new InvalidArgumentError(this.constructor, args, "subreddit_argument_too_short", this, value);
			} else if (noR.length > 20) {
				return new InvalidArgumentError(this.constructor, args, "subreddit_argument_too_long", this, value);
			} else {
				return noR;
			}
		} else {
			return new InvalidArgumentError(this.constructor, args, "subreddit_argument_invalid", this, value);
		}
	}
}
module.exports = SubredditArgument;