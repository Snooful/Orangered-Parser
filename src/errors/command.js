const chalk = require("chalk");

class CommandError extends Error {
	constructor(message, code, commandName) {
		super(message);

		this.code = code;
		this.commandName = commandName;

		this.stack = this.getColorInfo();
	}

	getColorInfo() {
		let msg = chalk.redBright(this.constructor.name);

		if (this.commandName) {
			msg += chalk.red(" [" + this.commandName + "]");
		}

		if (this.message || this.code) {
			msg += chalk.redBright(":");
		}

		if (this.message) {
			msg += " " + chalk.italic(this.message);
		}

		if (this.code) {
			msg += " " + chalk.dim("(" + this.code + ")");
		}

		return msg;
	}
}
module.exports = CommandError;
