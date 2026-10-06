const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomBytes, createHash } = require('node:crypto');
const mongoose = require('mongoose');
const { User, AuthSession } = require('./models');
const { ApiError, unauthorized, forbidden } = require('./errors');
const { validateBody, UUID } = require('./validation');
const { profile } = require('./serializers');
const hashToken = token => createHash('sha256').update(token).digest('hex');
const issuer = 'small-business-crm', audience = 'crm-api';

function createAuth(config) {
  const accessToken = session => jwt.sign({ sid: session._id }, config.jwtSecret, {
    algorithm: 'HS256', subject: session.userId, issuer, audience,
    expiresIn: Math.min(config.accessTtlSeconds, Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000))),
  });
  async function newSession(user, dbSession) {
    const refreshToken = randomBytes(48).toString('base64url');
    const [session] = await AuthSession.create([{
      userId: user._id, refreshHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + config.refreshTtlDays * 86400000),
    }], { session: dbSession });
    return { user: profile(user), accessToken: accessToken(session), refreshToken };
  }
  async function protect(req, res, next) {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') || '');
    if (!match) throw unauthorized();
    let claims;
    try {
      claims = jwt.verify(match[1], config.jwtSecret, { algorithms: ['HS256'], issuer, audience });
      if (!UUID.test(claims.sub) || !UUID.test(claims.sid)) throw unauthorized();
    } catch { throw unauthorized(); }
    const session = await AuthSession.findOne({ _id: claims.sid, userId: claims.sub, expiresAt: { $gt: new Date() } });
    if (!session) throw unauthorized();
    const user = await User.findOne({ _id: claims.sub, isActive: true });
    if (!user) throw unauthorized();
    req.user = user;
    req.authSession = session;
    next();
  }
  const router = express.Router();
  router.post('/register', validateBody('register'), async (req, res) => {
    const { name, email, password } = req.validated;
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const data = await mongoose.connection.transaction(async session => {
      const [user] = await User.create([{ name, email, passwordHash, role: 'ADMIN' }], { session });
      return newSession(user, session);
    });
    res.status(201).json({ data });
  });
  // Unknown accounts still perform a bcrypt comparison.
  const dummyHash = bcrypt.hash('unused-' + randomBytes(32).toString('hex'), config.bcryptRounds);
  router.post('/login', validateBody('login'), async (req, res) => {
    const { email, password } = req.validated;
    const user = await User.findOne({ email }).select('+passwordHash');
    const matches = await bcrypt.compare(password, user?.passwordHash || await dummyHash);
    if (!user || !user.isActive || !matches) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    res.json({ data: await newSession(user) });
  });
  router.post('/refresh', validateBody('refresh'), async (req, res) => {
    const session = await AuthSession.findOne({ refreshHash: hashToken(req.validated.refreshToken), expiresAt: { $gt: new Date() } });
    if (!session || !await User.exists({ _id: session.userId, isActive: true })) throw unauthorized();
    res.json({ data: { accessToken: accessToken(session) } });
  });
  router.post('/logout', protect, async (req, res) => {
    await AuthSession.deleteOne({ _id: req.authSession._id, userId: req.user._id });
    res.status(204).end();
  });
  router.get('/me', protect, (req, res) => res.json({ data: profile(req.user) }));
  const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') throw forbidden();
    next();
  };
  return { router, protect, requireAdmin };
}
module.exports = { createAuth };
