import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET() {
    const equipment = await prisma.equipment.findMany({
        include: {
            area: true,
            technician: true,
        },
        orderBy: {
            entryDate: 'desc',
        },
    })
    return NextResponse.json(equipment)
}

export async function POST(request: Request) {
    try {
        const json = await request.json()

        const equipment = await prisma.equipment.upsert({
            where: { serialNumber: json.serialNumber },
            update: {
                type: json.type,
                model: json.model,
                status: json.status, // Keep status if provided
                reportedFailure: json.reportedFailure,

                diagnosisFinishedAt: json.diagnosisFinishedAt ? new Date(json.diagnosisFinishedAt) : null,
                reportedBy: json.reportedBy,
                personInCharge: json.personInCharge,
                addedBy: json.addedBy,

                areaId: json.areaId ? parseInt(json.areaId) : null,
                technicianId: json.technicianId ? parseInt(json.technicianId) : null,
                logs: {
                    create: {
                        action: 'UPDATED',
                        details: 'Actualizado vía Importación/API',
                    }
                }
            },
            create: {
                type: json.type,
                model: json.model,
                serialNumber: json.serialNumber,
                status: json.status || "Pending",
                reportedFailure: json.reportedFailure || null,

                diagnosisFinishedAt: json.diagnosisFinishedAt ? new Date(json.diagnosisFinishedAt) : null,
                reportedBy: json.reportedBy,
                personInCharge: json.personInCharge,
                addedBy: json.addedBy,

                areaId: json.areaId ? parseInt(json.areaId) : null,
                technicianId: json.technicianId ? parseInt(json.technicianId) : null,
                logs: {
                    create: {
                        action: 'CREATED',
                        details: 'Equipo agregado al inventario',
                        userName: json.addedBy || 'Admin' // Use addedBy as the initial userName
                    }
                }
            },
        })
        return NextResponse.json(equipment)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error processing equipment' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const json = await request.json();

        if (json.ids && Array.isArray(json.ids)) {
            // Bulk delete
            // First delete related maintenances
            await prisma.maintenance.deleteMany({
                where: { equipmentId: { in: json.ids } }
            });

            // Delete equipment logs
            await prisma.equipmentLog.deleteMany({
                where: { equipmentId: { in: json.ids } }
            });

            await prisma.equipment.deleteMany({
                where: { id: { in: json.ids } }
            });

            return NextResponse.json({ success: true, count: json.ids.length });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error deleting equipment' }, { status: 500 });
    }
}
