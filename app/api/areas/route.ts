
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function isAdmin() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.user || session.user.role !== 'ADMIN') {
        return false;
    }
    return true;
}

export async function GET() {
    try {
        const areas = await prisma.area.findMany({
            include: {
                gerencia: true,
                _count: {
                    select: { equipment: true }
                }
            }
        });
        return NextResponse.json(areas);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching areas' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const area = await prisma.area.create({
            data: {
                name: body.name,
                gerenciaId: body.gerenciaId ? parseInt(body.gerenciaId) : null
            }
        });
        return NextResponse.json(area);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating area' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const area = await prisma.area.update({
            where: { id: body.id },
            data: {
                name: body.name,
                gerenciaId: body.gerenciaId ? parseInt(body.gerenciaId) : null
            }
        });
        return NextResponse.json(area);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating area' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        await prisma.area.delete({
            where: { id: body.id }
        });
        return NextResponse.json({ message: 'Area deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting area' }, { status: 500 });
    }
}
