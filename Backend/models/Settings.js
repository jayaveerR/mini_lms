const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  platform: {
    siteName: { type: String, default: "EduNexus" },
    siteDescription: { type: String, default: "The premier online learning platform" },
    supportEmail: { type: String, default: "support@edunexus.com" },
    defaultLanguage: { type: String, default: "en" },
    timezone: { type: String, default: "UTC" },
    maintenanceMode: { type: Boolean, default: false }
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    newUserWelcome: { type: Boolean, default: true },
    courseEnrollment: { type: Boolean, default: true },
    courseCompletion: { type: Boolean, default: true },
    paymentReceipts: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: false }
  },
  security: {
    twoFactorRequired: { type: Boolean, default: false },
    passwordMinLength: { type: Number, default: 8 },
    sessionTimeout: { type: Number, default: 30 },
    maxLoginAttempts: { type: Number, default: 5 },
    ipWhitelist: { type: String, default: "" }
  },
  payment: {
    currency: { type: String, default: "USD" },
    platformFee: { type: Number, default: 15 },
    minWithdrawal: { type: Number, default: 50 },
    payoutSchedule: { type: String, default: "monthly" }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
