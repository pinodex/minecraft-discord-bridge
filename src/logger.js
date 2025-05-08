
const { createLogger, transports, format } = require('winston');

let instance = null;

/**
 * Initialize logger
 *
 * @return {Logger}
 */
/** @deprecated init() is now deprecated. Please use logger inside /lib instead */
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
/** @deprecated getInstance() is now deprecated. Please use logger inside /lib instead */
exports.getInstance = () => instance;

/**
 * Log generic message
 *
 * @param  {String} message Log message
 * @return {Logger}
 */
/** @deprecated log() is now deprecated. Please use logger inside /lib instead */
exports.log = (message) => instance.log(message);

/**
 * Log info message
 *
 * @param  {String} message Log message
 * @return {Logger}
 */
/** @deprecated info() is now deprecated. Please use logger inside /lib instead */
exports.info = (message) => instance.info(message);

/**
 * Log error message
 *
 * @param  {String} message Log message
 * @return {Logger}
 */
/** @deprecated error() is now deprecated. Please use logger inside /lib instead */
exports.error = (message) => instance.error(message);

/**
 * Log warning message
 *
 * @param  {String} message
 * @return {Logger}
 */
/** @deprecated warn() is now deprecated. Please use logger inside /lib instead */
exports.warn = (message) => instance.warn(message);

/**
 * Log debug message
 *
 * @param  {String} message
 * @return {Logger}
 */
/** @deprecated debug() is now deprecated. Please use logger inside /lib instead */
exports.debug = (message) => instance.debug(message);
