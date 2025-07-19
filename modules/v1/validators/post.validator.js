const Joi = require("joi");

const createPostSchema = Joi.object({
  title: Joi.string().max(255).required(),
  content: Joi.string().required(),
  image_url: Joi.string().uri().optional().allow("", null),
  category_id: Joi.number().integer().optional().allow(null)
});

const updatePostSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  content: Joi.string().optional(),
  image_url: Joi.string().uri().optional().allow("", null),
  category_id: Joi.number().integer().optional().allow(null)
}).min(1);        // must send at least one field

module.exports = { createPostSchema, updatePostSchema };
