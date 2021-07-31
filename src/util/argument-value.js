const InvalidArgumentError = require("../errors/invalid-argument.js");

/**
 * The result of an parsed argument value.
 */
class ArgumentValue {
	constructor(value) {
		const isInvalidError = value instanceof InvalidArgumentError;

		/**
		 * Whether the argument input could be resolved to a value.
		 * @type {boolean}
		 */
		this.success = !isInvalidError;

		if (isInvalidError) {
			/**
			 * The error.
			 * @type {InvalidArgumentError}
			 */
			this.error = value;
		} else {
			/**
			 * The value that the argument was resolved to.
			 */
			this.value = value;
		}
	}
}
module.exports = ArgumentValue;
