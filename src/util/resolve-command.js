const Command = require("./../command.js");
const CommandError = require("./../errors/command.js");

/**
 * Resolves a value into a Command.
 * @param {(Object|Command)} cmd The value to resolve into a Command.
 * @returns {Command} The resolved command.
 */
function resolveCommand(cmd) {
	if (cmd instanceof Command) {
		// It's already resolved
		return cmd;
	} else if (typeof cmd === "object") {
		// Let's make a new Command
		return new Command(cmd);
	} else {
		throw new CommandError("Commands must be specified as an object or Command type.", "INVALID_COMMAND_TYPE");
	}
}
module.exports = resolveCommand;
