# Orangered Parser

A lightweight command parser for [Snooful](https://github.com/Snooful/Snooful).

## Installation

Install from the npm registry:

    npm install @snooful/orangered-parser

## Usage

Require it in Node.js:

```js
const parser = require("@snooful/orangered-parser");
```

### Registering Commands

You can parse a command via an object or a `Command` class.

```js
parser.register(command);
parser.register(new parser.Command(command));
```

You can also register a command from another file using Node.js' `require`:

```js
parser.register(require("./command.js"));
```

Furthermore, you can register an entire directory. The first argument is the relative path to the directory and the second controls whether to do this recursively (it defaults to `true`).

```js
parser.registerDirectory("./commands");
parser.registerDirectory("./more_commands", false);
```

### Parsing Input

Parsing a command will automatically run it. 

```js
// Parse and execute a registered command
parser.parse("code 'something very' 1337");
```

If you would like to pass extra data to a command, use the `pass` argument. Arguments will replace these if they have the same keys, so be careful.

```js
parse.parse("nodejs 11", {
    version: "11",
});
```

### Accessing the Registry

You can access the command registry by calling `parser.getCommandRegistry()`. This provides you with a [`Map`](http://www.collectionsjs.com/map).

```js
const registry = parser.getCommandRegistry();
```

To get a command from the registry, simply call `registry.get(command)`.

```js
const cmd = registry.get("code");
```

You can filter out aliases by checking if the command's original name is the same as its name:

```js
registry.filter(command => {
	return command.originalName !== command.name;
});
```
