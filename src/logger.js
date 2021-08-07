const { createLogger, transports, format } = require('winston');

let instance = null;

/**
 * Initialize logger
 *
 * @return {Logger}
 */
exports.init = () => {
  instance = createLogger({
    level: 'debug',
    format: format.simple(),

    transports: [new transports.Console()],
  });

  return this;
};

/**
 * Get logger instance
 *
 * @return {Logger}
 */
exports.getInstance = () => instance;

/**
 * Log generic message
 *
 * @param  {String} message Log message
 * @return {Logger}
 */
exports.log = (message) => instance.log(message);

/**
 * Log info message
 *
 * @param  {String} message Log message
 * @return {Logger}
 */
exports.info = (message) => instance.info(message);

/**
 * Log error message
 *
 * @param  {String} message Log message
 * @return {Logger}
 */
exports.error = (message) => instance.error(message);

/**
 * Log warning message
 *
 * @param  {String} message
 * @return {Logger}
 */
exports.warn = (message) => instance.warn(message);

/**
 * Log debug message
 *
 * @param  {String} message
 * @return {Logger}
 */
exports.debug = (message) => instance.debug(message);
