const cmdRegistry = {};

const path = require("path");
const rqAll = require("require-all");

function register(cmdObj) {
	const cmd = Object.assign({}, cmdObj);

	cmdRegistry[cmd.name] = cmd;
	cmd.aliases.forEach(alias => cmdRegistry[alias] = cmd);
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
