const InvalidArgumentError = require("../errors/invalid-argument.js");
const Argument = require("./generic.js");

/**
 * A comment argument.
 */
class CommandArgument extends Argument {
	constructor(argument) {
		super(argument);

		this.type = "command";
		this.allowAlias = argument.allowAlias || true;
	}

	getValue(value, args, cmdRegistry) {
		if (value === undefined) {
			return undefined;
		}

		const cmd = cmdRegistry.get(value);
		if (cmd) {
			if (!this.allowAlias && cmd.name !== cmd.originalName) {
				return new InvalidArgumentError(this, args, "command_argument_not_original", value);
			} else {
				return cmd;
			}
		} else {
			return new InvalidArgumentError(this, args, "command_argument_nonexistent", value);
		}
	}
}
module.exports = CommandArgument;
