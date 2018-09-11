# Orangered Parser

A lightweight command parser for Snooful.

## Installation

Install from npm:

    npm install @snooful/orangered-parser

## Usage

Require it in Node.js:

```js
const parser = require("@snooful/orangered-parser");

parser.registerDirectory("./commands");
parser.parse("code 'something very' 1337");
```