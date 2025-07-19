const db = require("../../../../models");
const { custom_code } = require("../../../../utilities/response_error_code");
const common = require("../../../../utilities/common");
const jwt = require("../../../../utilities/jwt");
const helper = require("../../../../utilities/helper");
const {
  userSignupSchema,
  userLoginSchema,
  userPasswordUpdateSchema,
  userResetPasswordSchema,
  userEditProfileSchema,
} = require("../../../../modules/v1/validators/user.validator");

const { Op } = db.Sequelize;

class User_Controller {
  //sample test api:
  sampleAPI = (req, res) => {
    res.send("Server with MySQL Pool is running Final Exam.....!");
  };

  //user registeration
  user_signup = async (req, res) => {
    try {
      /* 1. Validate ------------------------------------------------------- */
      const { error, value: req_data } = userSignupSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: error.details[0].message,
        });
      }

      /* 2. Uniqueness checks --------------------------------------------- */
      const [isEmailUnique, isPhoneUnique, isUsernameUnique] =
        await Promise.all([
          common.checkUniqueEmail(req_data.email),
          req_data.phone ? common.checkUniquePhone(req_data.phone) : true,
          common.checkUniqueUsername(req_data.username),
        ]);

      if (!isEmailUnique) {
        return res.status(409).json({
          code: custom_code.ALREADY_EXITS,
          message: `Email ${req_data.email} already exists.`,
        });
      }
      if (!isUsernameUnique) {
        return res.status(409).json({
          code: custom_code.ALREADY_EXITS,
          message: `Username ${req_data.username} already exists.`,
        });
      }
      if (req_data.phone && !isPhoneUnique) {
        return res.status(409).json({
          code: custom_code.ALREADY_EXITS,
          message: `Phone ${req_data.phone} already exists.`,
        });
      }

      /* 3. Assemble user_data -------------------------------------------- */
      const user_data = {
        fullname: req_data.fullname,
        username: req_data.username,
        email: req_data.email,
        password: req_data.social_id
          ? null
          : await helper.hashPassword(req_data.password),
        country_code: req_data.country_code,
        phone: req_data.phone,
        profile_pic: req_data.profile_pic,
        login_type: req_data.social_id ? "social" : "normal",
        social_id: req_data.social_id || null,
        is_verified: 1,
        step: 1,
      };

      /* 4. Persist -------------------------------------------------------- */
      const user = await db.User.create(user_data);

      return res.status(201).json({
        code: custom_code.SUCCESS,
        message: "Signup successful",
        data: { id: user.id, email: user.email, username: user.username },
      });
    } catch (err) {
      console.error("Signup Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  //user login
  user_login = async (req, res) => {
    try {
      const { error, value } = userLoginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: error.details[0].message,
        });
      }

      const { login_email_phone, password, social_id } = value;

      let user = null;

      // --- SOCIAL LOGIN FLOW ---
      if (social_id) {
        user = await db.User.findOne({
          where: {
            email: login_email_phone,
            social_id: social_id,
            login_type: "social",
          },
        });
      }
      // --- NORMAL LOGIN FLOW ---
      else {
        user = await db.User.findOne({
          where: {
            login_type: "normal",
            [Op.or]: [
              { email: login_email_phone }, // e‑mail login
              { phone: login_email_phone }, // phone login
            ],
          },
        });

        if (!user || !(await helper.comparePassword(password, user.password))) {
          return res.status(401).json({
            code: custom_code.INVALID_CREDENTIALS,
            message: "Invalid credentials",
          });
        }
      }

      // --- NO USER FOUND ---
      if (!user) {
        return res.status(401).json({
          code: custom_code.INVALID_CREDENTIALS,
          message: "Invalid credentials",
        });
      }

      // --- STATUS CHECKS ---
      if (user.is_deleted === 1) {
        return res.status(404).json({
          code: custom_code.USER_ACCOUNT_NOT_FOUND,
          message: "User account not found",
        });
      }

      if (user.is_active !== 1) {
        return res.status(403).json({
          code: custom_code.INACTIVE_ACCOUNT,
          message: "Unauthorized access",
        });
      }

      if (user.is_verified !== 1) {
        return res.status(403).json({
          code: custom_code.OTP_NOT_VERIFIED,
          message: "User not verified",
        });
      }

      // --- UPDATE LOGIN STATUS ---
      user.is_login = 1;
      await user.save();

      // --- GENERATE JWT ---
      const token = jwt.generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      // --- RESPONSE ---
      return res.status(200).json({
        code: custom_code.SUCCESS,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            token: token,
          },
        },
      });
    } catch (err) {
      console.error("Login Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  //user logout
  user_logout = async (req, res) => {
    try {
      const user_id = req.user?.id;

      //console.log(req.user.id);

      if (!user_id) {
        return res.status(401).json({
          code: custom_code.UNAUTHORIZED,
          message: "Unauthorized User Access",
        });
      }

      const user = await db.User.findByPk(user_id);

      if (!user) {
        return res.status(404).json({
          code: custom_code.USER_ACCOUNT_NOT_FOUND,
          message: "User not found",
        });
      }

      user.is_login = 0;
      await user.save();

      return res.status(200).json({
        code: custom_code.SUCCESS,
        message: "Logout successful",
      });
    } catch (err) {
      console.error("Logout Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  //user forgot password
  user_forgot_password = async (req, res) => {
    try {
      const { error, value } = userPasswordUpdateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: error.details[0].message,
        });
      }
      const { old_password, new_password } = value;
      const user_id = req.user?.id;

      //console.log(req.user.id);

      if (!user_id) {
        return res.status(401).json({
          code: custom_code.UNAUTHORIZED,
          message: "Unauthorized User Access",
        });
      }

      if (!old_password || !new_password) {
        return res.status(400).json({
          code: custom_code.MISSING_FIELDS,
          message: "All fields are required",
        });
      }

      const user = await db.User.findOne({
        where: {
          id: user_id,
          login_type: "normal", //Only allow normal login users
        },
      });

      if (!user) {
        return res.status(404).json({
          code: custom_code.USER_ACCOUNT_NOT_FOUND,
          message: "User not found or not eligible for password change",
        });
      }

      const isMatch = await helper.comparePassword(old_password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          code: custom_code.INVALID_CREDENTIALS,
          message: "Old password does not match",
        });
      }

      user.password = await helper.hashPassword(new_password);
      await user.save();

      return res.status(200).json({
        code: custom_code.SUCCESS,
        message: "Password changed successfully",
      });
    } catch (err) {
      console.error("Forgot Password Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  //user reset password
  user_reset_password = async (req, res) => {
    try {
      const { error, value } = userResetPasswordSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: error.details[0].message,
        });
      }

      const { new_password } = value;

      const user_id = req.user?.id;

      //console.log(req.user.id);

      if (!user_id) {
        return res.status(401).json({
          code: custom_code.UNAUTHORIZED,
          message: "Unauthorized User Access",
        });
      }

      if (!new_password) {
        return res.status(400).json({
          code: custom_code.MISSING_FIELDS,
          message: "new password are required",
        });
      }

      const user = await db.User.findOne({ where: { id: user_id } });

      if (!user) {
        return res.status(404).json({
          code: custom_code.USER_ACCOUNT_NOT_FOUND,
          message: "User not found",
        });
      }

      //Require the user to be logged in
      if (user.is_login !== 1) {
        return res.status(401).json({
          code: custom_code.UNAUTHORIZED,
          message: "You must be logged in to reset password",
        });
      }

      if (user.login_type !== "normal") {
        return res.status(403).json({
          code: custom_code.OPERATION_FAILED,
          message: "Password reset is not allowed for social login users",
        });
      }

      user.password = await helper.hashPassword(new_password);
      await user.save();

      return res.status(200).json({
        code: custom_code.SUCCESS,
        message: "Password reset successful",
      });
    } catch (err) {
      console.error("Reset Password Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  //user edit profile
  user_edit_profile = async (req, res) => {
    try {
      const { error, value } = userEditProfileSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: error.details[0].message,
        });
      }

      const { fullname, username, email, country_code, phone, profile_pic } =
        value;

      const user_id = req.user?.id;

      //console.log(req.user.id);

      if (!user_id) {
        return res.status(401).json({
          code: custom_code.UNAUTHORIZED,
          message: "Unauthorized User Access",
        });
      }

      const user = await db.User.findOne({ where: { id: user_id } });

      if (!user) {
        return res.status(404).json({
          code: custom_code.USER_ACCOUNT_NOT_FOUND,
          message: "User not found",
        });
      }

      //Require the user to be logged in
      if (user.is_login !== 1) {
        return res.status(401).json({
          code: custom_code.UNAUTHORIZED,
          message: "You must be logged in to edit profile",
        });
      }

      // Check uniqueness for email, username, phone (if changed)
      if (email && email !== user.email) {
        const exists = await db.User.findOne({ where: { email } });
        if (exists) {
          return res.status(409).json({
            code: custom_code.ALREADY_EXITS,
            message: `Email '${email}' already exists.`,
          });
        }
        user.email = email;
      }

      if (username && username !== user.username) {
        const exists = await db.User.findOne({ where: { username } });
        if (exists) {
          return res.status(409).json({
            code: custom_code.ALREADY_EXITS,
            message: `Username '${username}' already exists.`,
          });
        }
        user.username = username;
      }

      if (phone && phone !== user.phone) {
        const exists = await db.User.findOne({ where: { phone } });
        if (exists) {
          return res.status(409).json({
            code: custom_code.ALREADY_EXITS,
            message: `Phone '${phone}' already exists.`,
          });
        }
        user.phone = phone;
      }

      // Update optional fields
      user.fullname = fullname ?? user.fullname;
      user.country_code = country_code ?? user.country_code;
      user.profile_pic = profile_pic ?? user.profile_pic;

      await user.save();

      return res.status(200).json({
        code: custom_code.SUCCESS,
        message: "Profile updated successfully",
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      });
    } catch (err) {
      console.error("Edit Profile Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };
}

module.exports = new User_Controller();
