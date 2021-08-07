/**
 * Resolve promise after the specified duration
 * @param  {Number} duration Timeout duration in milliseconds
 * @return {Promise}
 */
exports.timeout = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
