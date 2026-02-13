
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';

async function getSessionUser() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    return session?.user;
}

export async function GET() {
    const technicians = await prisma.technician.findMany({
        include: {
            _count: {
                select: { assignedEquipment: true },
            },
        },
    })
    return NextResponse.json(technicians)
}

export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const json = await request.json();

        // Allow if Admin OR if creating own profile
        // @ts-ignore
        const isSelfCreation = json.userId === parseInt(user.id);
        // @ts-ignore
        if (user.role !== 'ADMIN' && !isSelfCreation) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Transaction to create User and Technician
        const result = await prisma.$transaction(async (tx) => {
            let userId = json.userId ? parseInt(json.userId) : null;

            // If creating a NEW user along with technician
            if (json.email && json.password) {
                const hashedPassword = await bcrypt.hash(json.password, 10);
                const newUser = await tx.user.create({
                    data: {
                        name: json.name,
                        email: json.email,
                        password: hashedPassword,
                        role: 'TECH' // Force role to TECH
                    }
                });
                userId = newUser.id;
            }

            const technician = await tx.technician.create({
                data: {
                    name: json.name,
                    userId: userId,
                },
            });

            return technician;
        });

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error creating technician:', error);
        return NextResponse.json({ error: 'Error creating technician/user' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    const user = await getSessionUser();
    // @ts-ignore
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const json = await request.json()
        const technician = await prisma.technician.update({
            where: { id: parseInt(json.id) },
            data: {
                name: json.name,
                userId: json.userId ? parseInt(json.userId) : null,
            },
        })
        return NextResponse.json(technician)
    } catch (error) {
        return NextResponse.json({ error: 'Error updating technician' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const user = await getSessionUser();
    // @ts-ignore
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const json = await request.json()
        await prisma.technician.delete({
            where: { id: parseInt(json.id) },
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting technician' }, { status: 500 })
    }
}
