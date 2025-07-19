const db = require("../models");

class Common {
  // Check if email is unique
  checkUniqueEmail = async (email) => {
    const user = await db.User.findOne({ where: { email } });
    return !user;
  }

  // Check if username is unique
  checkUniqueUsername = async (username) => {
    const user = await db.User.findOne({ where: { username } });
    return !user; 
  }

  // Check if phone is unique
  checkUniquePhone = async (phone) => {
    const user = await db.User.findOne({ where: { phone } });
    return !user;
  }

};


module.exports = new Common();