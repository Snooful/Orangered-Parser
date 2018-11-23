const InvalidArgumentError = require("../errors/invalid-argument.js");

/**
 * Defaults a value.
 * @param {*} val The user's value.
 * @param {*} defaultTo The value to default to.
 * @returns {*}
 */
function defaulter(val, defaultTo) {
	if (!defaultTo) {
		return val;
	}
	return (val === undefined || val instanceof Error) ? defaultTo : val;
}

class Argument {
	constructor(argument) {
		/**
		 * A string to represent the argument type to the user.
		 * @type {string}
		 */
		this.type = "generic";

		/**
		 * The key to represent this argument.
		 * @type {string}
		 */
		this.key = argument.key;

		/**
		 * The value for this argument if one is not specified.
		 * @type {*}
		 */
		this.default = argument.default;

		/**
		 * Whether to allow no input for this argument.
		 * You may not set a default if this is enabled.
		 * @type {boolean}
		 */
		this.required = argument.required || false;

		/**
		 * The values allowed to be selected.
		 * @type {*[]}
		 */
		this.choices = argument.choices;

		/**
		 * A description of the argument.
		 * @type {string}
		 */
		this.description = argument.description;
	}

	getValue(value) {
		return value;
	}

	getWithDefault(value, args, cmdRegistry) {
		const val = this.getValue(value, args, cmdRegistry);

		if (this.required && val === undefined) {
			return new InvalidArgumentError(this.constructor, args, "argument_required", this, value);
		}

		const defaulted = defaulter(val, this.default);

		if (!Array.isArray(this.choices) || this.choices.includes(defaulted)) {
			return defaulted;
		} else {
			return new InvalidArgumentError(this.constructor, args, "argument_unavailable_choice", this, value);
		}
	}

	get(value, args, cmdRegistry) {
		const val = this.getWithDefault(value, args, cmdRegistry);
		if (val instanceof InvalidArgumentError) {
			args.send(val.message);
			return {
				success: false,
			};
		} else {
			return {
				success: true,
				value: val,
			};
		}
	}
}
module.exports = Argument;