const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const { Schema } = mongoose;
const USER_ROLES = ['ADMIN', 'STAFF'];
const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE'];
const INTERACTION_TYPES = ['PHONE_CALL', 'EMAIL', 'MEETING', 'MESSAGE', 'GENERAL_NOTE'];
const text = (max, required = false) => ({ type: String, trim: true, maxlength: max, required });
const id = () => ({ type: String, default: randomUUID });
const reference = ref => ({ type: String, ref, required: true, immutable: true });
const options = { timestamps: true, versionKey: false, strict: 'throw' };

const userSchema = new Schema({
  _id: id(), name: text(120, true),
  email: { ...text(254, true), lowercase: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  // New public registrations are company administrators. Staff accounts are only
  // created by an administrator through the staff API.
  role: { type: String, enum: USER_ROLES, default: 'ADMIN', required: true },
  isActive: { type: Boolean, default: true, required: true },
}, options);
const customerSchema = new Schema({
  _id: id(), name: text(120, true),
  email: { ...text(254), default: '' }, phone: { ...text(40), default: '' },
  company: { ...text(160), default: '' }, notes: { ...text(2000), default: '' },
  status: { type: String, enum: CUSTOMER_STATUSES, default: 'ACTIVE', required: true },
  // Child creation writes this field to serialize with parent deletion.
  activityVersion: { type: Number, default: 0, select: false },
}, options);
// Customers, interactions, and follow-ups are a single company-wide dataset.
// There is intentionally no business, workspace, tenant, or owner identifier.
customerSchema.index({ createdAt: -1, _id: 1 });
customerSchema.index({ status: 1 });
const interactionSchema = new Schema({
  _id: id(), customerId: reference('Customer'),
  type: { type: String, enum: INTERACTION_TYPES, required: true },
  description: text(5000, true), date: { type: Date, required: true, default: Date.now },
}, options);
interactionSchema.index({ customerId: 1, date: -1, _id: 1 });
const followUpSchema = new Schema({
  _id: id(), customerId: reference('Customer'), title: text(200, true),
  description: { ...text(2000), default: '' }, dueAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
}, options);
followUpSchema.index({ customerId: 1, completedAt: 1, dueAt: 1 });
const sessionSchema = new Schema({
  _id: id(), userId: reference('User'),
  refreshHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true },
}, options);
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1 });

module.exports = {
  User: mongoose.model('User', userSchema), Customer: mongoose.model('Customer', customerSchema),
  Interaction: mongoose.model('Interaction', interactionSchema), FollowUp: mongoose.model('FollowUp', followUpSchema),
  AuthSession: mongoose.model('AuthSession', sessionSchema), USER_ROLES, CUSTOMER_STATUSES, INTERACTION_TYPES,
};
