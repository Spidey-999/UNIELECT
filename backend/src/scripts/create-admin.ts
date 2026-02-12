import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin(email: string, password: string) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await prisma.adminUser.create({
      data: {
        email,
        passwordHash: hashedPassword
      }
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 ID: ${admin.id}`);
    console.log(`⚠️  Please save the password securely as it won't be shown again.`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`❌ Admin user with email ${email} already exists`);
    } else {
      console.error('❌ Error creating admin:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: tsx create-admin.ts <email> <password>');
  process.exit(1);
}

const [email, password] = args;
createAdmin(email, password);
