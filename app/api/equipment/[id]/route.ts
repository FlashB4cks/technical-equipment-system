import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const equipment = await prisma.equipment.findUnique({
            where: { id },
            include: {
                area: true,
                technician: true,
                maintenances: {
                    include: { technician: true },
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!equipment) {
            return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
        }

        return NextResponse.json(equipment);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const json = await request.json();

        const updated = await prisma.equipment.update({
            where: { id },
            data: {
                type: json.type,
                model: json.model,
                serialNumber: json.serialNumber,
                status: json.status,
                reportedFailure: json.reportedFailure,
                areaId: json.areaId ? parseInt(json.areaId) : null,
                technicianId: json.technicianId ? parseInt(json.technicianId) : null,
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating equipment' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        // First delete related maintenances to avoid constraint errors
        await prisma.maintenance.deleteMany({
            where: { equipmentId: id }
        });

        await prisma.equipment.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting equipment' }, { status: 500 });
    }
}
