const cmdRegistry = {};

const path = require("path");
const rqAll = require("require-all");

function defaulter(val, defaultTo) {
	if (!defaultTo) {
		return val;
	}
	return val === undefined || val instanceof Error ? defaultTo : val;
}

class CommandArgument {
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

	getWithDefault(value, args) {
		const val = this.getValue(value, args);

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

	get(value, args) {
		const val = this.getWithDefault(value, args);
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

const argTypes = {
	command: class extends CommandArgument {
		constructor(argument) {
			super(argument);

			this.type = "command";
			this.allowAlias = argument.allowAlias || true;
		}

		getValue(value, args) {
			if (value === undefined) {
				return undefined;
			}

			const cmd = cmdRegistry[value];
			if (cmd) {
				if (!this.allowAlias && cmd.name !== cmd.originalName) {
					return new InvalidArgumentError(this.constructor, args, "command_argument_not_original", this, value);
				} else {
					return cmd;
				}
			} else {
				return new InvalidArgumentError(this.constructor, args, "command_argument_nonexistent", this, value);
			}
		}
	},
	custom: class extends CommandArgument {
		constructor(argument) {
			super(argument);

			this.type = "custom";
			this.custom = argument.custom;
		}

		getValue() {
			this.custom(...arguments);
		}
	},
	generic: CommandArgument,
	integer: class extends CommandArgument {
		constructor(argument) {
			super(argument);

			this.type = "integer";

			this.min = argument.min || -Infinity;
			this.max = argument.max || Infinity;
		}

		getValue(value, args) {
			if (value === undefined) {
				return undefined;
			}

			const int = parseInt(value);

			if (isNaN(int) || !Number.isInteger(int)) {
				return new InvalidArgumentError(this.constructor, args, "integer_argument_invalid", this, value);
			} else if (int >= this.max) {
				return new InvalidArgumentError(this.constructor, args, "integer_argument_too_high", this, value);
			} else if (int <= this.min) {
				return new InvalidArgumentError(this.constructor, args, "integer_argument_too_low", this, value);
			} else {
				return int;
			}
		}
	},
	string: class extends CommandArgument {
		constructor(argument) {
			super(argument);

			this.type = "string";

			this.min = argument.minLength || 0;
			this.max = argument.maxLength || Infinity;

			this.matches = new RegExp(argument.matches);
		}

		getValue(value, args) {
			if (value === undefined) {
				return undefined;
			}

			const str = value.toString();
			if (!this.matches.test(str)) {
				return new InvalidArgumentError(this.constructor, args, "string_argument_regexp_fail", this, value);
			} else if (str.length >= this.max) {
				return new InvalidArgumentError(this.constructor, args, "string_argument_too_long", this, value);
			} else if (str.length <= this.min) {
				return new InvalidArgumentError(this.constructor, args, "string_argument_too_short", this, value);
			} else {
				return str;
			}
		}
	},
};

function findName(obj) {
	return obj.name || obj.command;
}

class Command {
	constructor(command) {
		this.name = findName(command);
		this.originalName = command.originalName || this.name;

		this.description = command.description || command.describe || "";
		this.longDescription = command.longDescription || this.description || "";

		if (command.arguments) {
			this.arguments = command.arguments.map(arg => {
				if (arg instanceof CommandArgument) {
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
		* @returns {string} The command with arguments.
	*/
	usage() {
		const wrapped = this.arguments.map(arg => `<${arg.key}>`);
		return `${this.name} ${wrapped.join(" ")}`;
	}

	run(args) {
		if (this.handler) {
			this.handler(args);
		}
	}
}

/**
 * Registers a single command.
 * @param {(object|Command)} cmd The command to register.
 * @returns {object} The registry including the new command.
 */
function register(cmd) {
	const name = findName(cmd);
	if (!name) {
		throw new Error("A command must have a name.");
	} else if (!(typeof cmd === "object" || cmd instanceof Command)) {
		throw new TypeError("A command must be specified as an object or Command type.");
	} else {
		const alias = cmd.aliases || [];
		alias.push(name);

		alias.forEach(aname => {
			cmd.name = aname;
			cmd.originalName = name;

			cmd.aliases = alias.filter(name2 => name2 !== aname);

			// Make it into a Command and actually add it to the registry
			const cmdFixed = typeof cmd === "object" ? new Command(cmd) : cmd;
			cmdRegistry[aname] = cmdFixed;
		});

		return cmdRegistry;
	}
}

/**
	* Registers every JavaScript file in a directory as a command.
	* @param {string} directory The path to the directory to register.
	* @param {boolean} recursive If true, registers commands in subdirectories.
 	* @returns {object} The registry including the new commands.

*/
function registerDirectory(directory = "", recursive = true) {
	rqAll({
		dirname: path.resolve(directory),
		filter: /\.js$/,
		recursive,
		resolve: register,
	});
	return cmdRegistry;
}

/**
	* Runs a command by parsing it and its arguments.
	* @param {string} command The command to parse.
	* @param {object} pass Extra values to pass to the command when ran.
	* @returns {object} The arguments parsed.
*/
function parse(command, pass) {
	const cmd = command.toString().trim();
	const parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g);

	if (parts.length > 0) {
		const cmdSource = cmdRegistry[parts[0]];
		if (cmdSource) {
			const args = parts.slice(1);
			const argsObj = Object.assign({}, pass);

			let success = true;

			cmdSource.arguments.forEach((argument, index) => {
				const get = argument.get(args[index], pass);
				argsObj[argument.key] = get.value;
				if (!get.success) {
					success = false;
				}
			});

			if (success) {
				if (Array.isArray(cmdSource.check)) {
					if (cmdSource.check.every(check => check(argsObj))) {
						cmdSource.run(argsObj);
					}
				} else if (cmdSource.check) {
					if (cmdSource.check(argsObj)) {
						cmdSource.run(argsObj);
					}
				} else {
					cmdSource.run(argsObj);
				}
				return argsObj;
			}
		}
	}
}

module.exports = {
	Command,
	argTypes,
	getCommandRegistry() {
		return Object.values(cmdRegistry);
	},
	parse,
	register,
	registerDirectory,
};
