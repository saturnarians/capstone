const { ApiError } = require('./errors');
const { CUSTOMER_STATUSES, INTERACTION_TYPES } = require('./models');
const isEmail = require('validator/lib/isEmail');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = fields => { throw new ApiError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', fields); };
const string = (max, required = false, extra = {}) => ({ max, required, ...extra });
const schemas = {
  register: { name: string(120, true), email: string(254, true, { email: true }), password: string(72, true, { password: true }) },
  login: { email: string(254, true, { email: true }), password: string(72, true, { password: true, login: true }) },
  refresh: { refreshToken: string(128, true) },
  staff: { name: string(120, true), email: string(254, true, { email: true }), password: string(72, true, { password: true }) },
  staffUpdate: { name: string(120), email: string(254, false, { email: true }), status: string(20, false, { enum: ['ACTIVE', 'INACTIVE'] }) },
  customer: { name: string(120, true), email: string(254, false, { email: true }), phone: string(40), company: string(160), status: string(20, false, { enum: CUSTOMER_STATUSES }), notes: string(2000) },
  interaction: { type: string(30, true, { enum: INTERACTION_TYPES }), description: string(5000, true), date: { date: true } },
  followUp: { title: string(200, true), description: string(2000), dueAt: { date: true, required: true } },
};

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  return calendar.getUTCFullYear() === year && calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day && Number.isFinite(Date.parse(value)) && Number(value.slice(11, 13)) < 24;
}

function validateBody(kind, partial = false) {
  return (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail({ body: 'Send a JSON object.' });
    const schema = schemas[kind], fields = Object.create(null), data = {};
    for (const key of Object.keys(body)) if (!Object.hasOwn(schema, key)) fields[key] = 'This field is not editable.';
    if (partial && Object.keys(body).length === 0) fields.body = 'Supply at least one editable field.';
    for (const [key, rule] of Object.entries(schema)) {
      if (!Object.hasOwn(body, key)) {
        if (rule.required && !partial) fields[key] = 'This field is required.';
        continue;
      }
      const raw = body[key];
      if (rule.date) {
        if (!validDate(raw)) fields[key] = 'Use a valid ISO 8601 timestamp with a timezone.';
        else data[key] = new Date(raw);
        continue;
      }
      if (typeof raw !== 'string') { fields[key] = 'Must be a string.'; continue; }
      const value = rule.password ? raw : raw.trim();
      if (rule.required && !value.length) fields[key] = 'This field is required.';
      else if (value.length > rule.max) fields[key] = `Must be at most ${rule.max} characters.`;
      else if (rule.email && value && !isEmail(value)) fields[key] = 'Enter a valid email address.';
      else if (rule.enum && !rule.enum.includes(value)) fields[key] = `Must be one of ${rule.enum.join(', ')}.`;
      else if (rule.password && (Buffer.byteLength(value, 'utf8') > 72 || (!rule.login && value.length < 8))) fields[key] = 'Password must be at least 8 characters and at most 72 UTF-8 bytes.';
      data[key] = rule.email ? value.toLowerCase() : value;
    }
    if (Object.keys(fields).length) return fail(fields);
    req.validated = data;
    next();
  };
}

function validateId(req, res, next, value, name) {
  if (!UUID.test(value)) return fail({ [name]: 'Enter a valid UUID.' });
  req.params[name] = value.toLowerCase();
  next();
}

function listQuery(customer = false) {
  return (req, res, next) => {
    const fields = Object.create(null), query = req.query;
    const allowed = customer ? ['page', 'limit', 'search', 'status'] : ['page', 'limit'];
    for (const key of Object.keys(query)) if (!allowed.includes(key)) fields[key] = 'Unknown query parameter.';
    const parse = (key, fallback, max) => {
      if (query[key] === undefined) return fallback;
      const value = query[key];
      if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) { fields[key] = `Must be an integer from 1 to ${max}.`; return fallback; }
      return Number(value);
    };
    const page = parse('page', 1, 1000000), limit = parse('limit', 20, 100);
    if (customer && query.search !== undefined && (typeof query.search !== 'string' || query.search.length > 200)) fields.search = 'Search must be a string of at most 200 characters.';
    if (customer && query.status !== undefined && !CUSTOMER_STATUSES.includes(query.status)) fields.status = 'Must be ACTIVE or INACTIVE.';
    if (Object.keys(fields).length) return fail(fields);
    req.list = { page, limit, search: query.search?.trim(), status: query.status };
    next();
  };
}

function staffListQuery(req, res, next) {
  const fields = Object.create(null), query = req.query;
  for (const key of Object.keys(query)) if (!['page', 'limit', 'status'].includes(key)) fields[key] = 'Unknown query parameter.';
  const parse = (key, fallback, max) => {
    if (query[key] === undefined) return fallback;
    const value = query[key];
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) { fields[key] = `Must be an integer from 1 to ${max}.`; return fallback; }
    return Number(value);
  };
  const page = parse('page', 1, 1000000), limit = parse('limit', 20, 100);
  if (query.status !== undefined && !['ACTIVE', 'INACTIVE'].includes(query.status)) fields.status = 'Must be ACTIVE or INACTIVE.';
  if (Object.keys(fields).length) return fail(fields);
  req.list = { page, limit, status: query.status };
  next();
}

module.exports = { validateBody, validateId, listQuery, staffListQuery, UUID, validDate };
