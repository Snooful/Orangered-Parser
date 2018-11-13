/**
 * An error when a value for an argument is not allowed or cannot be parsed.
 */
class InvalidArgumentError extends Error {
	constructor(sourceArg, args, localizationCode, argument, value) {
		super();

		// Set the message
		const localized = args.localize(localizationCode, argument, value, args.localize("argument_type_" + argument.type));
		if (localized) {
			this.message = localized;
		} else {
			this.message = args.localize("argument_invalid", argument, value, args.localize("argument_type_" + argument.type));
		}

		this.code = localizationCode.toUpperCase();

		this.sourceArg = sourceArg;
	}
}
module.exports = InvalidArgumentError;