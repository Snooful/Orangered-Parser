const cmdRegistry = {};

const path = require("path");
const rqAll = require("require-all");

const CodeError = require("codified-error");

class CommandArgument {
	constructor(argument) {
		this.key = argument.key;
		
	}
	
	getValue(sourceChannel) {
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

const argumentTypes = {
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
		
		this.arguments = command.arguments(arg => new CommandArgument(arg));
	});
}

function register(cmdObj) {
	const cmd = Object.assign({}, cmdObj);
	
	if (!cmd.name) {
		throw new CodeError("COMMAND_MISSING_NAME", "A command must have a name.");
	} else if (!typeof cmd === "object") {
		throw new CodeError("COMMAND_NOT_OBJECT", "A command must be specified as an object.");
	} else {
		cmdRegistry[cmd.name] = cmd;
		cmd.aliases.forEach(alias => cmdRegistry[alias] = cmd);
	}
}

function registerDirectory(directory = "", recursive = true) {
	return rqAll({
	  dirname: path.normalize(directory),
	  filter: /\.js$/,
	  recursive,
	}).forEach(register);
}

module.exports = {
	Command,
	register,
	registerDirectory,
}
