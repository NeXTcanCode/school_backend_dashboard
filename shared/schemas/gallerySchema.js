const { z } = require('zod');

const gallerySchema = z.object({
  title: z.string().max(120).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }).optional(),
  existingImages: z.array(z.string()).optional(),
  attachment: z.string().optional(),
});

module.exports = { gallerySchema };
