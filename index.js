const Map = require("collections/map");
let cmdRegistry = new Map();

const path = require("path");
const rqAll = require("require-all");

const dur = require("parse-duration");

// Add some extra (large) units
dur.decade = dur.dec = (dur.year * 10);
dur.century = dur.cen = (dur.decade * 10);
dur.millennium = dur.mil = (dur.century * 10);

const { split } = require("smart-splitter");

// This is used to camelcase argument keys in the args object
const camelCase = require("camelcase");

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
module.exports.Argument = Argument;

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

class StringArgument extends Argument {
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
}

class UserArgument extends StringArgument {
	constructor(argument) {
		super(argument);
	}

	getValue(value, args) {
		const string = super.getValue(value, args);

		// :thinking:
		const noU = /(u\/)?(.*)/i.exec(string)[2];

		if (/^[\w-]+$/.test(noU)) {
			if (noU.length < 3) {
				return new InvalidArgumentError(this.constructor, args, "user_argument_too_short", this, value);
			} else if (noU.length > 20) {
				return new InvalidArgumentError(this.constructor, args, "user_argument_too_long", this, value);
			} else {
				return noU;
			}
		} else {
			return new InvalidArgumentError(this.constructor, args, "user_argument_invalid", this, value);
		}
	}
}
class SubredditArgument extends StringArgument {
	constructor(argument) {
		super(argument);
	}

	getValue(value, args) {
		const string = super.getValue(value, args);
		const noR = /(r\/)?(.*)/i.exec(string)[2];

		if (/^[A-Za-z0-9]\w+$/.test(noR)) {
			if (noR.length < 3) {
				return new InvalidArgumentError(this.constructor, args, "subreddit_argument_too_short", this, value);
			} else if (noR.length > 20) {
				return new InvalidArgumentError(this.constructor, args, "subreddit_argument_too_long", this, value);
			} else {
				return noR;
			}
		} else {
			return new InvalidArgumentError(this.constructor, args, "subreddit_argument_invalid", this, value);
		}
	}
}

const argTypes = {
	command: class extends Argument {
		constructor(argument) {
			super(argument);

			this.type = "command";
			this.allowAlias = argument.allowAlias || true;
		}

		getValue(value, args) {
			if (value === undefined) {
				return undefined;
			}

			const cmd = cmdRegistry.get(value);
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
	custom: class extends Argument {
		constructor(argument) {
			super(argument);

			this.type = "custom";
			this.custom = argument.custom;
		}

		getValue() {
			this.custom(...arguments);
		}
	},
	duration: class extends Argument {
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
				return new InvalidArgumentError(this.constructor, args, "duration_argument_invalid", this, value);
			}
		}
	},
	generic: Argument,
	integer: class extends Argument {
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
	string: StringArgument,
	subreddit: SubredditArgument,
	user: UserArgument,
};
module.exports.argTypes = argTypes;

class Command {
	constructor(command) {
		if (command.name.includes(" ")) {
			const error = new Error("Command names may not include spaces.");
			error.code = "SPACE_IN_COMMAND_NAME";
			throw error;
		}
		this.name = command.name;

		this.originalName = command.originalName || command.name;

		this.description = command.description;
		this.longDescription = command.longDescription;

		if (command.arguments) {
			this.arguments = command.arguments.map(arg => {
				if (arg instanceof Argument) {
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
		const wrapped = this.arguments.map(arg => {
			if (arg.required) {
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
module.exports.Command = Command;

/**
 * Registers a single command.
 * @param {(Object|Command)} cmd The command to register.
 * @returns {Map} The registry including the new command.
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
			cmdRegistry.set(aname, cmdFixed);
		});

		return cmdRegistry;
	}
}
module.exports.register = register;

/**
	* Registers every JavaScript file in a directory as a command.
	* @param {string} directory The path to the directory to register.
	* @param {boolean} recursive If true, registers commands in subdirectories.
 	* @returns {Map} The registry including the new commands.

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
module.exports.registerDirectory = registerDirectory;

/**
	* Runs a command by parsing it and its arguments.
	* @param {string} command The command to parse.
	* @param {Object} pass Extra values to pass to the command when ran.
	* @returns {Object} The arguments parsed.
*/
function parse(command, pass) {
	const cmd = command.toString().trim();
	const cmdStr = cmd.substr(0, cmd.indexOf(" "));
	if (cmdStr) {
		const cmdSource = cmdRegistry.get(cmdStr);
		if (cmdSource) {
			const args = split(cmd.substr(cmd.indexOf(" ") + 1), cmdSource.arguments.length);
			const argsObj = { ...pass };

			let success = true;

			cmdSource.arguments.forEach((argument, index) => {
				const get = argument.get(args[index], pass);

				// We camelCase this so it's easier to access
				// Args["casing-example"] vs. args.casingExample
				argsObj[camelCase(argument.key)] = get.value;

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
module.exports.parse = parse;

/**
 * Deregisters every command.
 * @returns {undefined}
 */
function clear() {
	return cmdRegistry.clear();
}
module.exports.clear = clear;

/**
 * Deregisters a command.
 * @param {string} name The name of the command to deregister.
 * @param {boolean} includeAlternatives If true, also deregisters aliases of the same command (even if the target is an alias).
 * @returns {Map} The command registry excluding the deregistered commands.
 */
function deregister(name, includeAlternatives = true) {
	if (includeAlternatives) {
		cmdRegistry = cmdRegistry.filter(command => command.originalName !== name);
	} else {
		cmdRegistry = cmdRegistry.filter(command => command.name !== name);
	}
	return cmdRegistry;
}
module.exports.deregister = deregister;

/**
 * Gets the command registry.
 * @returns {Map} The command registry.
 */
function getCommandRegistry() {
	return cmdRegistry;
}
module.exports.getCommandRegistry = getCommandRegistry;
