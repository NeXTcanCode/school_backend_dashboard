const { z } = require('zod');

const newsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  fromDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid fromDate",
  }),
  toDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid toDate",
  }),
  existingImages: z.array(z.string()).max(5, "Maximum 5 images allowed").optional(),
  attachment: z.string().optional(),
});

module.exports = { newsSchema };
