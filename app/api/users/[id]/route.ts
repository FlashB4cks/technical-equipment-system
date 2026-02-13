
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper to check if user is admin
async function isAdmin() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.user || session.user.role !== 'ADMIN') {
        return false;
    }
    return true;
}

// Helper to get current user ID
async function getCurrentUserId() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.user) {
        return null;
    }
    // @ts-ignore
    return parseInt(session.user.id);
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const id = parseInt(params.id);
        const body = await request.json();
        const { name, email, role, password } = body;

        // Validation
        if (!name || !email || !role) {
            return NextResponse.json({ error: 'Name, email and role are required' }, { status: 400 });
        }

        const updateData: any = {
            name,
            email,
            role
        };

        // Only update password if provided
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = updatedUser;

        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const id = parseInt(params.id);
        const currentUserId = await getCurrentUserId();

        // Prevent self-deletion
        if (id === currentUserId) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
    }
}
