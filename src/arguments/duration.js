const InvalidArgumentError = require("../errors/invalid-argument.js");
const Argument = require("./generic.js");

const dur = require("parse-duration");

// Add some extra (large) units
dur.decade = dur.dec = (dur.year * 10);
dur.century = dur.cen = (dur.decade * 10);
dur.millennium = dur.mil = (dur.century * 10);

/**
 * A duration argument.
 */
class DurationArgument extends Argument {
	constructor(argument) {
		super(argument);
		this.type = "duration";
	}

	getValue(value, args) {
		if (value === undefined) {
			return undefined;
		}

		try {
			return dur(value);
		} catch (error) {
			return new InvalidArgumentError(this, args, "duration_argument_invalid", value);
		}
	}
}

module.exports = DurationArgument;