const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { User, AuthSession } = require('./models');
const { notFound } = require('./errors');
const { validateBody, validateId, staffListQuery } = require('./validation');
const { staff } = require('./serializers');

function createStaffRouter({ requireAdmin, config }) {
  const router = express.Router();
  router.param('id', validateId);
  router.use(requireAdmin);

  router.get('/staff', staffListQuery, async (req, res) => {
    const filter = { role: 'STAFF' };
    if (req.list.status) filter.isActive = req.list.status === 'ACTIVE';
    const { page, limit } = req.list;
    const [people, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1, _id: 1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ data: people.map(staff), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  });

  router.post('/staff', validateBody('staff'), async (req, res) => {
    const { name, email, password } = req.validated;
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const person = await User.create({ name, email, passwordHash, role: 'STAFF' });
    res.status(201).json({ data: staff(person) });
  });

  async function findStaff(req, res, next) {
    const person = await User.findOne({ _id: req.params.id, role: 'STAFF' });
    if (!person) throw notFound('Staff member');
    req.staffMember = person;
    next();
  }

  router.get('/staff/:id', findStaff, (req, res) => res.json({ data: staff(req.staffMember) }));
  router.patch('/staff/:id', validateBody('staffUpdate', true), findStaff, async (req, res) => {
    const update = { ...req.validated };
    if (update.status) {
      update.isActive = update.status === 'ACTIVE';
      delete update.status;
    }
    const person = await mongoose.connection.transaction(async session => {
      const changed = await User.findOneAndUpdate({ _id: req.staffMember._id, role: 'STAFF' }, { $set: update }, { returnDocument: 'after', runValidators: true, session });
      if (!changed) throw notFound('Staff member');
      if (!changed.isActive) await AuthSession.deleteMany({ userId: changed._id }, { session });
      return changed;
    });
    res.json({ data: staff(person) });
  });
  // Deactivation preserves auditability and lets an administrator reactivate a staff account.
  router.delete('/staff/:id', findStaff, async (req, res) => {
    await mongoose.connection.transaction(async session => {
      const person = await User.findOneAndUpdate({ _id: req.staffMember._id, role: 'STAFF' }, { $set: { isActive: false } }, { returnDocument: 'after', session });
      if (!person) throw notFound('Staff member');
      await AuthSession.deleteMany({ userId: person._id }, { session });
    });
    res.status(204).end();
  });
  return router;
}
module.exports = { createStaffRouter };
