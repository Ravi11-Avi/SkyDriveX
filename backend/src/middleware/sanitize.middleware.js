/**
 * Recursively sanitize an object by stripping keys that start with '$' or contain '.'
 * @param {any} target - The object or value to sanitize
 * @returns {any} Sanitized value
 */
const sanitize = (target) => {
  if (target instanceof Object) {
    for (const key in target) {
      if (/^\$/.test(key) || /\./.test(key)) {
        delete target[key];
      } else {
        sanitize(target[key]);
      }
    }
  }
  return target;
};

/**
 * Middleware to sanitize incoming request payloads against NoSQL query injection
 */
const sanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};

module.exports = sanitizeMiddleware;
