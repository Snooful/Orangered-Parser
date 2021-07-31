/**
 * Defaults a value.
 * @param {*} val The user's value.
 * @param {*} defaultTo The value to default to.
 * @returns {*}
 */
function defaulter(val, defaultTo) {
	if (!defaultTo) {
		return val;
	}
	return (val === undefined || val instanceof Error) ? defaultTo : val;
}
module.exports = defaulter;
