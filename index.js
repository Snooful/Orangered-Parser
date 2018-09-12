const cmdRegistry = {};

const path = require("path");
const rqAll = require("require-all");

class CommandArgument {
	constructor(argument) {
		this.key = argument.key;

		this.default = argument.default;
		this.choices = argument.choices;
	}

	getValue(value) {
		return value;
	}

	get(value, args) {
		const val = this.getValue(value, args);
		const defaulted = val === undefined ? this.default : val;
		if (!Array.isArray(this.choices) || this.choices.includes(defaulted)) {
			return defaulted;
		} else {
			return new InvalidArgumentError(this.constructor, args, "argument_unavailable_choice", this.key);
		}
	}
}

class InvalidArgumentError extends Error {
	constructor(sourceArg, args, localizationCode, argKey) {
		super();

		this.message = args.localize(localizationCode, argKey) || args.localize("argument_invalid", argKey);
		args.send(this.message);
		this.code = localizationCode.toUpperCase();

		this.sourceArg = sourceArg;
	}
}

const argTypes = {
	generic: CommandArgument,
	string: class extends CommandArgument {
		constructor(argument) {
			super(argument);

			this.min = argument.minLength || 0;
			this.max = argument.maxLength || Infinity;

			this.matches = new RegExp(argument.matches);
		}

		getValue(value, args) {
			const str = value.toString();
			if (!this.matches.test(str)) {
				return new InvalidArgumentError(this.constructor, args, "string_argument_regexp_fail", this.key);
			} else if (str.length >= this.max) {
				return new InvalidArgumentError(this.constructor, args, "string_argument_too_long", this.key);
			} else if (str.length <= this.min) {
				return new InvalidArgumentError(this.constructor, args, "string_argument_too_short", this.key);
			} else {
				return str;
			}
		}
	},
	integer: class extends CommandArgument {
		constructor(argument) {
			super(argument);

			this.min = argument.min || -Infinity;
			this.max = argument.max || Infinity;
		}

		getValue(value, args) {
			const int = parseInt(value);

			if (isNaN(int) || !Number.isInteger(int)) {
				return new InvalidArgumentError(this.constructor, args, "invalid_integer_argument", this.key);
			} else if (int >= this.max) {
				return new InvalidArgumentError(this.constructor, args, "integer_argument_too_high", this.key);
			} else if (int <= this.min) {
				return new InvalidArgumentError(this.constructor, args, "integer_argument_too_low", this.key);
			} else {
				return int;
			}
		}
	},
	custom: class extends CommandArgument {
		constructor(argument) {
			super(argument);
			this.custom = argument.custom;
		}

		getValue() {
			this.custom(...arguments);
		}
	},
};

function findName(obj) {
	return obj.name || obj.command;
}

class Command {
	constructor(command) {
		this.name = findName(command);

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

		this.check = command.check;

		this.handler = command.handler;
	}

	toString() {
		const wrapped = this.arguments.map(arg => `<${arg.key}>`);
		return `${this.name} ${wrapped.join(" ")}`;
	}

	run(args) {
		if (this.handler) {
			this.handler(args);
		}
	}
}

function register(cmd) {
	const name = findName(cmd);
	const alias = cmd.aliases || cmd.alias;

	if (!name) {
		throw new Error("A command must have a name.");
	} else if (!(typeof cmd === "object" || cmd instanceof Command)) {
		throw new TypeError("A command must be specified as an object or Command type.");
	} else {
		const cmdFixed = typeof cmd === "object" ? new Command(cmd) : cmd;

		cmdRegistry[name] = cmdFixed;
		if (alias) {
			const aliases = Array.isArray(alias) ? alias : [alias];
			aliases.forEach(alias2 => cmdRegistry[alias2] = cmdFixed);
		}
	}
}

function registerDirectory(directory = "", recursive = true) {
	return rqAll({
		dirname: path.resolve(directory),
		filter: /\.js$/,
		recursive,
		resolve: register,
	});
}

function parse(command, pass) {
	const cmd = command.toString().trim();
	const parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g);

	if (parts.length > 0) {
		const cmdSource = cmdRegistry[parts[0]];
		if (cmdSource) {
			const args = parts.slice(1);
			const argsObj = Object.assign({}, pass);

			cmdSource.arguments.forEach((argument, index) => {
				argsObj[argument.key] = argument.get(args[index], pass);
			});

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

module.exports = {
	argTypes,
	Command,
	register,
	registerDirectory,
	parse,
	getCommandRegistry() {
		return Object.values(cmdRegistry);
	},
};