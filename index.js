const cmdRegistry = {};

const path = require("path");
const rqAll = require("require-all");

class CommandArgument {
	constructor(argument) {
		this.key = argument.key;
		
	}
	
	getValue(value) {
			return value;
	}
}

class InvalidArgumentError extends Error {
	constructor(sourceArg, args, localizationCode, argKey) {
		super();
		
		this.message = args.localize(localizationCode, argKey) || "An argument could not be parsed.";
		args.send(this.message);
		this.code = localizationCode.toUpperCase();
		
		this.sourceArg = sourceArg;
	}
}

const argTypes = {
	generic: CommandArgument,
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
			} else if (int > this.max) {
				return new InvalidArgumentError(this.constructor, args, "integer_argument_too_high", this.key);
			} else if (int < this.min) {
				return new InvalidArgumentError(this.constructor, args, "integer_argument_too_low", this.key);
			} else {
				return int;
			}
		}
	}
}

class Command {
	constructor(command) {
		this.name = command.name;
		
		this.description = command.description || "";
		this.longDescription = command.longDescription || this.description || "";
		
		if (command.arguments) {
			this.arguments = command.arguments.map(arg => {
				if (arg instanceof CommandArgument) {
					return arg;
				} else {
					if (argTypes[arg.type]) {
						return new argTypes[arg.type](arg);
					} else {
						return new argTypes.generic(arg);
					}
				}
			});
		} else {
			this.arguments = [];
		}

		this.handler = command.handler;
	}
	
	run(args) {
		if (this.handler) {
			this.handler(args);
		}
	}
}

function register(cmd) {
	if (!cmd.name) {
		throw new Error("COMMAND_MISSING_NAME", "A command must have a name.");
	} else if (!(typeof cmd === "object" || cmd instanceof Command)) {
		throw new Error("COMMAND_NOT_OBJECT", "A command must be specified as an object or Command type.");
	} else {
		const cmdFixed = typeof cmd === "object" ? new Command(cmd) : cmd;

		cmdRegistry[cmd.name] = cmdFixed;
		if (cmd.aliases) {
			cmd.aliases.forEach(alias => cmdRegistry[alias] = cmdFixed);
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
	const cmdSource = cmdRegistry[parts[0]];

	const args = parts.slice(1);
	const argsObj = Object.assign({}, pass);

	cmdSource.arguments.forEach((argument, index) => {
		argsObj[argument.key] = argument.getValue(args[index], pass);
	});

	cmdSource.run(argsObj);
	return argsObj;
}

module.exports = {
	argTypes,
	Command,
	register,
	registerDirectory,
	parse,
	getCommandRegistry() {
		return cmdRegistry;
	}
}
