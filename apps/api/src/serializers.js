const profile = user => ({ id: user._id, name: user.name, email: user.email, role: user.role });
const staff = user => ({
  id: user._id, name: user.name, email: user.email, role: user.role,
  status: user.isActive ? 'ACTIVE' : 'INACTIVE', createdAt: user.createdAt, updatedAt: user.updatedAt,
});
const timestamps = doc => ({ createdAt: doc.createdAt, updatedAt: doc.updatedAt });
const customer = doc => ({ id: doc._id, name: doc.name, email: doc.email, phone: doc.phone, company: doc.company, status: doc.status, notes: doc.notes, ...timestamps(doc) });
const interaction = doc => ({ id: doc._id, customerId: doc.customerId, type: doc.type, description: doc.description, date: doc.date, ...timestamps(doc) });
const followUpStatus = (doc, now = new Date()) => doc.completedAt ? 'COMPLETED' : doc.dueAt < now ? 'OVERDUE' : 'PENDING';
const followUp = (doc, now = new Date()) => ({ id: doc._id, customerId: doc.customerId, title: doc.title, description: doc.description, dueAt: doc.dueAt, status: followUpStatus(doc, now), completedAt: doc.completedAt, ...timestamps(doc) });
module.exports = { profile, staff, customer, interaction, followUp, followUpStatus };
