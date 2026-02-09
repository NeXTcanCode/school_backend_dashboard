const { z } = require('zod');

const signupSchema = z.object({
  schoolCode: z.string().min(3, "School code must be at least 3 characters").max(20),
  schoolName: z.string().min(3, "School name must be at least 3 characters").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  schoolCode: z.string().min(3),
  password: z.string().min(1),
});

module.exports = { signupSchema, loginSchema };
