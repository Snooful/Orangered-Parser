const argTypes = require("./arguments");

class Command {
	constructor(command) {
		if (command.name.includes(" ")) {
			const error = new Error("Command names may not include spaces.");
			error.code = "SPACE_IN_COMMAND_NAME";
			throw error;
		}
		this.name = command.name;

		this.originalName = command.originalName || this.name;

		this.description = command.description || command.describe;
		this.longDescription = command.longDescription;

		this.hidden = command.hidden || false;

		if (command.arguments) {
			this.arguments = command.arguments.map(arg => {
				if (arg instanceof argTypes.generic) {
					return arg;
				} else if (argTypes[arg.type]) {
					return new argTypes[arg.type](arg);
				} else {
					return new argTypes.string(arg);
				}
			});
		} else {
			this.arguments = [];
		}

		this.aliases = command.aliases || [];

		this.check = command.check;

		this.handler = command.handler;
	}

	/**
	 * Generates a string based off of the command and its arguments.
	 * @param {boolean} differentiateRequired If true, uses a separate set of brackets for required arguments.
	 * @returns {string} The command with arguments.
	 */
	usage(differentiateRequired = true) {
		const wrapped = this.arguments.map(arg => {
			if (arg.required && differentiateRequired) {
				return `<${arg.key}>`;
			} else {
				return `[${arg.key}]`;
			}
		});
		return `${this.name} ${wrapped.join(" ")}`;
	}

	run(args) {
		if (this.handler) {
			this.handler(args);
		}
	}
}
module.exports = Command;