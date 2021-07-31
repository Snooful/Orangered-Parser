const Map = require("collections/map");

const path = require("path");
const rqAll = require("require-all");

const { split } = require("smart-splitter");

// This is used to camelcase argument keys in the args object
const camelCase = require("camelcase");

const resolveCommand = require("./util/resolve-command.js");

const argTypes = require("./arguments");
module.exports.argTypes = argTypes;

// Use this error when you want the user to be notified
const InvalidArgumentError = require("./errors/invalid-argument.js");
module.exports.InvalidArgumentError = InvalidArgumentError;

// Use this error when it is command-specific
const CommandError = require("./errors/command.js");
module.exports.CommandError = CommandError;

const Command = require("./command.js");
module.exports.Command = Command;

/**
 * The orangered parser.
 */
class OrangeredParser {
	constructor() {
		/**
		 * The command registry.
		 */
		this.registry = new Map();
	}

	/**
	 * Deregisters every command.
	 * @returns {undefined}
	 */
	clear() {
		return this.registry.clear();
	}

	/**
	 * Deregisters a command.
	 * @param {string} name The name of the command to deregister.
	 * @param {boolean} includeAlternatives If true, also deregisters aliases of the same command (even if the target is an alias).
	 * @returns {Map} The command registry excluding the deregistered commands.
	 */
	deregister(name, includeAlternatives = true) {
		if (includeAlternatives) {
			this.registry = this.registry.filter(command => command.originalName !== name);
		} else {
			this.registry = this.registry.filter(command => command.name !== name);
		}
		return this.registry;
	}

	/**
	 * Gets the command registry.
	 * @returns {Map} The command registry.
	 */
	getCommandRegistry() {
		return this.registry;
	}

	/**
	 * Runs a command by parsing it and its arguments.
	 * @param {string} command The command to parse.
	 * @param {Object} pass Extra values to pass to the command when ran.
	 * @returns {Object} The arguments parsed.
	 */
	parse(command, pass) {
		const cmd = command.toString().trim();
		const firstSpace = cmd.includes(" ") ? cmd.indexOf(" ") : cmd.length;
		const cmdStr = cmd.slice(0, firstSpace);

		if (cmdStr) {
			const cmdSource = this.registry.get(cmdStr);
			if (cmdSource) {
				const args = split(cmd.slice(firstSpace + 1), cmdSource.arguments.length);
				const argsObj = {
					...pass,
				};

				let success = true;

				if (argsObj.testPermission && !cmdSource.permissionless) {
					const cmdPerm = "commands." + (cmdSource.category ? cmdSource.category + "." : "") + cmdSource.originalName;
					if (!argsObj.testPermission(cmdPerm)) {
						success = false;
						if (argsObj.localize && argsObj.send) {
							argsObj.send(argsObj.localize("no_permission"));
						}
					}
				}

				cmdSource.arguments.forEach((argument, index) => {
					const get = argument.get(args[index], pass, this.registry);

					// We camelCase this so it's easier to access
					// Args["casing-example"] vs. args.casingExample
					argsObj[camelCase(argument.key)] = get.value;

					// You can still access it with the exact argument if needed, though
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

	/**
	 * Registers a single command or an array of commands.
	 * @param {(Object|Object[]|Command|Command[])} cmdOrCmds The command(s) to register.
	 * @returns {Map} The registry including the new command(s).
	 */
	register(cmdOrCmds) {
		if (Array.isArray(cmdOrCmds)) {
			cmdOrCmds.forEach(this.registerSingle.bind(this));
			return this.registry;
		} else {
			return this.register(cmdOrCmds);
		}
	}

	/**
	 * Registers every JavaScript file in a directory as a command.
	 * @param {string} directory The path to the directory to register.
	 * @param {boolean} recursive If true, registers commands in subdirectories.
 	 * @returns {Map} The registry including the new commands.
	*/
	registerDirectory(directory = "", recursive = true) {
		rqAll({
			dirname: path.resolve(directory),
			filter: /\.js$/,
			recursive,
			resolve: this.register.bind(this),
		});
		return this.registry;
	}

	/**
	 * Registers a single command.
	 * @param {(Object|Command)} cmd The command to register.
	 * @returns {Map} The registry including the new command.
	 */
	registerSingle(cmd) {
		const name = cmd.name || cmd.command;
		if (!name) {
			throw new CommandError("Commands must have names.", "MISSING_COMMAND_NAME");
		} else {
			const alias = {};
			if (Array.isArray(cmd.aliases)) {
				// Arrays: each alias is as hidden as the base command
				cmd.aliases.forEach(alias2 => {
					alias[alias2] = cmd.hidden;
				});
			} else if (typeof cmd.aliases === "object") {
				// Objects: the key is the alias name and the value is the hiddenness
				Object.entries(cmd.aliases).forEach(aliasEntry => {
					alias[aliasEntry[0]] = aliasEntry[1];
				});
			}

			// The main command is as hidden as you say it is (obviously)
			alias[name] = cmd.hidden;

			alias.forEach(aname => {
				cmd.name = aname;
				cmd.originalName = name;

				cmd.hidden = alias[aname] || cmd.hidden;

				cmd.aliases = Object.keys(alias).filter(name2 => name2 !== aname);

				// Make it into a Command and actually add it to the registry
				const cmdFixed = resolveCommand(cmd);
				this.registry.set(aname, cmdFixed);
			});

			return this.registry;
		}
	}
}
module.exports.OrangeredParser = OrangeredParser;
