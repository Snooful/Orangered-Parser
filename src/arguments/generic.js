const InvalidArgumentError = require("../errors/invalid-argument.js");
const defaulter = require("./../util/default.js");
const ArgumentValue = require("./..util/argument-value.js");

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
		 * Whether to make the allowed choices case sensitive.
		 * @type {boolean}
		 */
		this.choiceCaseSensitivity = argument.choiceCaseSensitivity || false;

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
			return new InvalidArgumentError(this, args, "argument_required", value);
		}

		const defaulted = defaulter(val, this.default);

		if (!Array.isArray(this.choices)) {
			return defaulted;
		} else {
			const found = this.choices.find(choice => {
				if (this.choiceCaseSensitivity || typeof choice !== "string" || typeof defaulted !== "string") {
					return choice === defaulted;
				} else {
					return choice.toLowerCase() === defaulted.toLowerCase();
				}
			});

			if (found === null) {
				return new InvalidArgumentError(this, args, "argument_unavailable_choice", value);
			} else {
				return found;
			}
		}
	}

	/**
	 * Resolves and verifies an argument.
	 * @param {*} value The value.
	 * @param {*} args The args.
	 * @param {*} cmdRegistry The command registry.
	 * @returns {ArgumentValue}
	 */
	get(value, args, cmdRegistry) {
		const val = this.getWithDefault(value, args, cmdRegistry);

		if (val instanceof InvalidArgumentError) {
			args.send(val.message);
		}
		return new ArgumentValue(val);
	}
}
module.exports = Argument;