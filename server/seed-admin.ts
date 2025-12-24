import bcrypt from 'bcrypt';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const BCRYPT_ROUNDS = 12;

async function seedAdmin() {
  const email = process.argv[2] || 'admin@ourshiksha.ai';
  const password = process.argv[3] || 'AdminPassword123!';
  const username = process.argv[4] || 'admin';

  console.log('Seeding admin user...');
  console.log('Email:', email);
  console.log('Username:', username);

  try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    if (existingUser) {
      console.log('Admin user already exists. Updating password...');
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email));
      console.log('Password updated successfully!');
    } else {
      await db.insert(users).values({
        email,
        username,
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: false,
      });
      console.log('Admin user created successfully!');
    }

    console.log('\nAdmin credentials:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('\nUse these credentials to login at /login');
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedAdmin();
