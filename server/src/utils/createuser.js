import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import User from '../models/User.js';

dotenv.config();

const rl = readline.createInterface({ input, output });

const createUser = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in server/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('\n=== FixMyCampus Account Setup ===\n');

    const name = (await rl.question('Enter full name: ')).trim();
    const email = (
      await rl.question('Enter email address: ')
    ).trim().toLowerCase();

    const password = await rl.question(
      'Enter password (minimum 8 characters): '
    );

    const role = (
      await rl.question('Enter role (admin/staff): ')
    ).trim().toLowerCase();

    const department = (
      await rl.question('Enter department: ')
    ).trim();

    if (!name || name.length < 2) {
      throw new Error('Name must contain at least 2 characters.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Please enter a valid email address.');
    }

    if (password.length < 8) {
      throw new Error('Password must contain at least 8 characters.');
    }

    if (!['admin', 'staff'].includes(role)) {
      throw new Error('Role must be either admin or staff.');
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
    });

    console.log('\nAccount created successfully!');

    console.log({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
  } catch (error) {
    console.error('\nAccount creation failed:', error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
};

createUser();