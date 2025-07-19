const Joi = require("joi");

const userSignupSchema = Joi.object({
  fullname: Joi.string().max(100).required(),
  username: Joi.string().max(50).required(),
  // email: Joi.string().email().max(100).required(),
email: Joi.string().email().max(100)
  .when("social_id", { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),

  // password required only when social_id is absent
  password: Joi.string().min(6).max(255)
               .when("social_id", { is: Joi.exist(), then: Joi.allow(null, "") , otherwise: Joi.required() }),

  social_id: Joi.string().optional().allow(null, ""),  // present for Google / Facebook etc.

  country_code: Joi.string().max(10).optional().allow(null, ""),
  phone: Joi.string().max(20).optional().allow(null, ""),
  profile_pic: Joi.string().uri().optional().allow(null, "")
});


const userLoginSchema = Joi.object({
  login_email_phone: Joi.string().required().messages({
    "any.required": "Email or phone is required",
    "string.empty": "Email or phone cannot be empty"
  }),

  // password is required only when social_id is not provided
  password: Joi.string()
    .min(6)
    .max(255)
    .when("social_id", {
      is: Joi.exist(),
      then: Joi.optional().allow(null, ""),
      otherwise: Joi.required()
    })
    .messages({
      "any.required": "Password is required for normal login",
      "string.min": "Password must be at least 6 characters"
    }),

  social_id: Joi.string().optional().allow(null, "")
});

const userPasswordUpdateSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(6).required(),
});

const userResetPasswordSchema = Joi.object({
  new_password: Joi.string().min(6).required(),
});

const usernameRule = Joi.string()
  .pattern(/^[a-zA-Z0-9_]+$/)
  .min(3)
  .max(30);


const userEditProfileSchema = Joi.object({
  fullname: Joi.string().optional(),
  username: usernameRule.optional(),
  email: Joi.string().email(),
  country_code: Joi.string().optional(),
  phone: Joi.string().optional(),
  profile_pic: Joi.string().uri().optional(),
});



module.exports = { userSignupSchema,userLoginSchema,userPasswordUpdateSchema,userResetPasswordSchema,userEditProfileSchema };
