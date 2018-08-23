const cmdRegistry = {};

const path = require("path");
const rqAll = require("require-all");

function register(cmdObj) {
	const cmd = Object.assign({}, cmdObj);
	
	if (!cmd.name) {
		const err = new TypeError("A command must have a name.");
		err.code = "COMMAND_MISSING_NAME";
		
		throw err;
	} else if (!typeof cmd === "object") {
		const err = new TypeError("A command must be specified as an object.");
		err.code = "COMMAND_NOT_OBJECT";
		
		throw err;
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
