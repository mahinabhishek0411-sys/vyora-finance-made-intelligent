import { pgTable, text, doublePrecision, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(), // We can use the Firebase Auth uid or custom string ID as the primary key
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  securityQuestion: text('security_question'),
  securityAnswer: text('security_answer'),
  passwordHash: text('password_hash'),
  theme: text('theme').default('light').notNull(),
  financialScore: integer('financial_score').default(65).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Transactions Table
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  amount: doublePrecision('amount').notNull(),
  type: text('type').notNull(), // 'income' | 'expense'
  category: text('category').notNull(),
  description: text('description').notNull(),
  paymentMethod: text('payment_method').default('UPI').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  notes: text('notes'),
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurrenceInterval: text('recurrence_interval').default('none').notNull(), // 'weekly' | 'monthly' | 'none'
  upiRef: text('upi_ref'),
  isOffline: boolean('is_offline').default(false).notNull(),
  syncStatus: text('sync_status').default('synced').notNull(), // 'synced' | 'pending'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Budgets Table
export const budgets = pgTable('budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  category: text('category').notNull(),
  amount: doublePrecision('amount').notNull(),
  month: text('month').notNull(), // YYYY-MM
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Goals Table (Savings Goals)
export const goals = pgTable('goals', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  targetAmount: doublePrecision('target_amount').notNull(),
  currentAmount: doublePrecision('current_amount').default(0).notNull(),
  dateCreated: text('date_created').notNull(), // YYYY-MM-DD
  targetDate: text('target_date'), // YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Savings Table (Savings logs/contributions)
export const savings = pgTable('savings', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  goalId: text('goal_id')
    .references(() => goals.id, { onDelete: 'cascade' }),
  amount: doublePrecision('amount').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Monthly Savings Table (Monthly savings summary/logs)
export const monthlySavings = pgTable('monthly_savings', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  month: text('month').notNull(), // YYYY-MM
  amount: doublePrecision('amount').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Reports Table
export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'monthly' | 'annual' | 'custom'
  content: text('content').notNull(), // Markdown or stringified JSON report data
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Notifications Table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  text: text('text').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  timestamp: text('timestamp').notNull(),
  parsed: text('parsed'), // JSON string of transaction parsing or metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Settings Table
export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. Categories Table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').default('expense').notNull(), // 'income' | 'expense' | 'both'
  icon: text('icon').default('Tag').notNull(),
  color: text('color').default('#3B82F6').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships definitions for easy querying
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
  goals: many(goals),
  savings: many(savings),
  monthlySavings: many(monthlySavings),
  reports: many(reports),
  notifications: many(notifications),
  settings: many(settings),
  categories: many(categories),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  savings: many(savings),
}));

export const savingsRelations = relations(savings, ({ one }) => ({
  user: one(users, {
    fields: [savings.userId],
    references: [users.id],
  }),
  goal: one(goals, {
    fields: [savings.goalId],
    references: [goals.id],
  }),
}));

export const monthlySavingsRelations = relations(monthlySavings, ({ one }) => ({
  user: one(users, {
    fields: [monthlySavings.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));
