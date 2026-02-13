
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper to check if user is admin
async function isAdmin() {
    const session = await getServerSession(authOptions);
    // @ts-ignore - role is added in auth.ts but typescript might need extension
    if (!session || !session.user || session.user.role !== 'ADMIN') {
        return false;
    }
    return true;
}

export async function GET() {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, email, password, role } = body;

        // Basic validation
        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role // 'ADMIN' or 'USER'
            }
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json(userWithoutPassword, { status: 201 });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    }
}
