const Joi = require("joi");

exports.createCommentSchema = Joi.object({
  comment: Joi.string().required(),
  post_id: Joi.number().integer().required(),
});

exports.updateCommentSchema = Joi.object({
  comment: Joi.string().required(),
});