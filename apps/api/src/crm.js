const express = require('express');
const mongoose = require('mongoose');
const { Customer, Interaction, FollowUp } = require('./models');
const { notFound } = require('./errors');
const { validateBody, validateId, listQuery } = require('./validation');
const serialize = require('./serializers');

async function customerById(id) {
  const customer = await Customer.findById(id);
  if (!customer) throw notFound('Customer');
  return customer;
}
async function list(Model, filter, sort, pagination, serializer) {
  const { page, limit } = pagination;
  const [docs, total] = await Promise.all([
    Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit), Model.countDocuments(filter),
  ]);
  return { data: docs.map(doc => serializer(doc)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
function createCrmRouter({ requireAdmin }) {
  const router = express.Router();
  router.param('id', validateId);
  router.param('customerId', validateId);
  router.get('/customers', listQuery(true), async (req, res) => {
    const filter = {};
    if (req.list.status) filter.status = req.list.status;
    if (req.list.search) {
      // Search is literal text, never client-controlled regex syntax.
      const pattern = req.list.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = ['name', 'email', 'phone', 'company'].map(key => ({ [key]: { $regex: pattern, $options: 'i' } }));
    }
    res.json(await list(Customer, filter, { createdAt: -1, _id: 1 }, req.list, serialize.customer));
  });
  router.post('/customers', validateBody('customer'), async (req, res) => {
    const customer = await Customer.create(req.validated);
    res.status(201).json({ data: serialize.customer(customer) });
  });
  router.get('/customers/:id', async (req, res) => res.json({ data: serialize.customer(await customerById(req.params.id)) }));
  router.patch('/customers/:id', validateBody('customer', true), async (req, res) => {
    const customer = await Customer.findByIdAndUpdate(req.params.id, { $set: req.validated }, { returnDocument: 'after', runValidators: true });
    if (!customer) throw notFound('Customer');
    res.json({ data: serialize.customer(customer) });
  });
  router.delete('/customers/:id', requireAdmin, async (req, res) => {
    await mongoose.connection.transaction(async session => {
      const customer = await Customer.findByIdAndDelete(req.params.id, { session });
      if (!customer) throw notFound('Customer');
      await Interaction.deleteMany({ customerId: customer._id }, { session });
      await FollowUp.deleteMany({ customerId: customer._id }, { session });
    });
    res.status(204).end();
  });
  function childRoutes({ path, Model, kind, label, serializer, sort }) {
    router.get(`/customers/:customerId/${path}`, listQuery(), async (req, res) => {
      await customerById(req.params.customerId);
      const now = new Date();
      res.json(await list(Model, { customerId: req.params.customerId }, sort, req.list, doc => serializer(doc, now)));
    });
    router.post(`/customers/:customerId/${path}`, validateBody(kind), async (req, res) => {
      const child = await mongoose.connection.transaction(async session => {
        // This write serializes child creation with parent deletion, preventing orphans.
        const parent = await Customer.findByIdAndUpdate(req.params.customerId, { $inc: { activityVersion: 1 } }, { session, timestamps: false });
        if (!parent) throw notFound('Customer');
        const [doc] = await Model.create([{ ...req.validated, customerId: parent._id }], { session });
        return doc;
      });
      res.status(201).json({ data: serializer(child) });
    });
    async function existingChild(req, res, next) {
      const child = await Model.findById(req.params.id);
      if (!child || !await Customer.exists({ _id: child.customerId })) throw notFound(label);
      req.child = child;
      next();
    }
    router.get(`/${path}/:id`, existingChild, (req, res) => res.json({ data: serializer(req.child) }));
    router.patch(`/${path}/:id`, validateBody(kind, true), existingChild, async (req, res) => {
      const child = await Model.findOneAndUpdate({ _id: req.child._id, customerId: req.child.customerId }, { $set: req.validated }, { returnDocument: 'after', runValidators: true });
      if (!child) throw notFound(label);
      res.json({ data: serializer(child) });
    });
    router.delete(`/${path}/:id`, requireAdmin, existingChild, async (req, res) => {
      const result = await Model.deleteOne({ _id: req.child._id, customerId: req.child.customerId });
      if (!result.deletedCount) throw notFound(label);
      res.status(204).end();
    });
    if (kind === 'followUp') router.post(`/${path}/:id/complete`, existingChild, async (req, res) => {
      // Compare-and-set keeps the original completion timestamp under concurrency.
      let child = await Model.findOneAndUpdate({ _id: req.child._id, completedAt: null }, { $set: { completedAt: new Date() } }, { returnDocument: 'after' });
      if (!child) child = await Model.findById(req.child._id);
      if (!child) throw notFound(label);
      res.json({ data: { id: child._id, status: 'COMPLETED', completedAt: child.completedAt } });
    });
  }
  childRoutes({ path: 'interactions', Model: Interaction, kind: 'interaction', label: 'Interaction', serializer: serialize.interaction, sort: { date: -1, _id: 1 } });
  childRoutes({ path: 'follow-ups', Model: FollowUp, kind: 'followUp', label: 'Follow-up', serializer: serialize.followUp, sort: { dueAt: 1, _id: 1 } });
  router.get('/dashboard', async (req, res) => {
    const aggregate = (collection, stages) => Customer.aggregate([
      { $lookup: { from: collection, localField: '_id', foreignField: 'customerId', as: 'activity' } },
      { $unwind: '$activity' }, ...stages,
    ]);
    const [totalCustomers, pending, interactions, followUps] = await Promise.all([
      Customer.countDocuments(),
      aggregate(FollowUp.collection.name, [{ $match: { 'activity.completedAt': null } }, { $count: 'total' }]),
      aggregate(Interaction.collection.name, [{ $sort: { 'activity.date': -1, 'activity._id': 1 } }, { $limit: 5 }, { $project: { name: 1, activity: 1 } }]),
      aggregate(FollowUp.collection.name, [{ $match: { 'activity.completedAt': null } }, { $sort: { 'activity.dueAt': 1, 'activity._id': 1 } }, { $limit: 5 }, { $project: { name: 1, activity: 1 } }]),
    ]);
    const now = new Date();
    res.json({ data: {
      summary: { totalCustomers, pendingFollowUps: pending[0]?.total || 0 },
      recentInteractions: interactions.map(({ _id, name, activity }) => ({ id: activity._id, customer: { id: _id, name }, type: activity.type, description: activity.description, date: activity.date })),
      upcomingFollowUps: followUps.map(({ _id, name, activity }) => ({ id: activity._id, customer: { id: _id, name }, title: activity.title, dueAt: activity.dueAt, status: serialize.followUpStatus(activity, now) })),
    } });
  });
  return router;
}
module.exports = { createCrmRouter };
