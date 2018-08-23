const cmdRegistry = {};

const path = require("path");
const rqAll = require("require-all");

const CodeError = require("codified-error");

function register(cmdObj) {
	const cmd = Object.assign({}, cmdObj);
	
	if (!cmd.name) {
		throw new CodeError("COMMAND_MISSING_NAME", "A command must have a name.");
	} else if (!typeof cmd === "object") {
		
		throw mew CodeError("COMMAND_NOT_OBJECT", "A command must be specified as an object.");
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
	register,
	registerDirectory,
}
