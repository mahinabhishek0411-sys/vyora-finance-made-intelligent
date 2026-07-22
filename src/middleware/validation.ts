/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: issues,
          status: 400
        });
        return;
      }
      next(err);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: issues,
          status: 400
        });
        return;
      }
      next(err);
    }
  };
};

// =========================================
// ZOD SCHEMAS FOR ALL VYORA MODULES
// =========================================

// Module 1: Auth
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  securityQuestion: z.string().min(2, 'Security question required'),
  securityAnswer: z.string().min(1, 'Security answer required')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const verifyQuestionSchema = z.object({
  email: z.string().email('Invalid email address'),
  securityAnswer: z.string().min(1, 'Security answer is required')
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  securityAnswer: z.string().min(1, 'Security answer is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional()
});

// Module 2: Transactions
export const transactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional().default(''),
  paymentMethod: z.string().optional().default('UPI'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().nullable().optional(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceInterval: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional().default('none'),
  upiRef: z.string().nullable().optional(),
  isOffline: z.boolean().optional().default(false),
  syncStatus: z.string().optional().default('synced')
});

// Module 3: Budgets
export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Budget limit must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
});

// Module 4: Savings Goals
export const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  targetAmount: z.coerce.number().positive('Target amount must be positive'),
  currentAmount: z.coerce.number().nonnegative().optional().default(0),
  targetDate: z.string().optional().default(''),
  category: z.string().optional().default('Savings')
});

export const contributeGoalSchema = z.object({
  amount: z.coerce.number().positive('Contribution amount must be positive')
});

// Module 5: Reminders
export const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.coerce.number().nonnegative().optional().default(0),
  dueDate: z.string().min(1, 'Due date is required'),
  category: z.string().optional().default('Bills'),
  frequency: z.enum(['once', 'monthly', 'weekly', 'yearly']).optional().default('monthly'),
  isAutoPay: z.boolean().optional().default(false),
  status: z.enum(['pending', 'paid', 'dismissed']).optional().default('pending')
});

// Module 6: Custom Categories
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['income', 'expense']).optional().default('expense'),
  icon: z.string().optional().default('Tag'),
  color: z.string().optional().default('#3B82F6')
});

// Module 7: AI Advisor
export const advisorChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  history: z.array(z.any()).optional()
});

// Module 8: Reports Import
export const reportsImportSchema = z.object({
  transactions: z.array(z.any()).optional(),
  budgets: z.array(z.any()).optional(),
  goals: z.array(z.any()).optional(),
  reminders: z.array(z.any()).optional()
});
