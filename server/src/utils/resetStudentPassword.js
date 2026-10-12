import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import User from '../models/User.js';

dotenv.config();

const rl = readline.createInterface({ input, output });

const resetStudentPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = (
      await rl.question('Enter student email: ')
    ).trim().toLowerCase();

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('Student account not found.');
      return;
    }

    if (user.role !== 'student') {
      console.log('This account is not a student account.');
      return;
    }

    const newPassword = await rl.question(
      'Enter new password (minimum 8 characters): '
    );

    if (newPassword.length < 8) {
      console.log('Password must contain at least 8 characters.');
      return;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    console.log('Student password reset successfully!');
    console.log('You can now log in using the new password.');
  } catch (error) {
    console.error('Password reset failed:', error.message);
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
};

resetStudentPassword();