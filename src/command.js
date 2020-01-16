const argTypes = require("./arguments");

/**
 * A command.
 */
class Command {
	constructor(command) {
		if (command.name.includes(" ")) {
			const error = new Error("Command names may not include spaces.");
			error.code = "SPACE_IN_COMMAND_NAME";
			throw error;
		}

		/**
		 * The name of the command.
		 * It may not include spaces.
		 * @type {string}
		 */
		this.name = command.name;

		/**
		 * The name of the parent command of an alias.
		 * If this command is not an alias, it will be the same as {@link Command#name}.
		 * @type {string}
		 */
		this.originalName = command.originalName || this.name;

		/**
		 * The command's description.
		 * @type {string}
		 */
		this.description = command.description || command.describe;
		/**
		 * A longer version of the command's description.
		 * @type {string}
		 */
		this.longDescription = command.longDescription;

		/**
		 * The command's category.
		 * @type {string}
		 */
		this.category = command.category;
		/**
		 * Whether the command is hidden.
		 */
		this.hidden = !!command.hidden;

		/**
		 * Whether the command does not require permission to use.
		 * @type {boolean}
		 */
		this.permissionless = !!command.permissionless;

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

		/**
		 * The command's aliases.
		 */
		this.aliases = Array.isArray(command.aliases) ? command.aliases : [];

		this.check = command.check;

		/**
		 * The function to run when the command is called.
		 * @type {Function}
		 */
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

	/**
	 * Runs the command if it has {@link Command#handler a handler}.
	 * @param {any[]} args The command call's arguments.
	 */
	run(args) {
		if (this.handler) {
			this.handler(args);
		}
	}
}
module.exports = Command;
