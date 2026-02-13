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
                },
                logs: {
                    orderBy: { timestamp: 'desc' }
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

        // Get user from session/request if available (passed from client or server session)
        // Since this is an API route, we might rely on the client sending 'updatedBy' or check server session
        // For now, let's assume client sends 'userName' or we try to get it.
        // Actually, the best way for a purely server-side tracking is getServerSession.

        let userName = json.userName || 'Sistema'; // Fallback if not provided

        const current = await prisma.equipment.findUnique({ where: { id } });

        let changes = [];
        if (current) {
            if (current.status !== json.status) changes.push(`Estado: ${current.status || 'N/A'} -> ${json.status}`);
            if (current.type !== json.type) changes.push(`Tipo: ${current.type} -> ${json.type}`);
            if (current.model !== json.model) changes.push(`Modelo: ${current.model} -> ${json.model}`);
            if (current.serialNumber !== json.serialNumber) changes.push(`Serial: ${current.serialNumber} -> ${json.serialNumber}`);
            if (current.reportedFailure !== json.reportedFailure) changes.push(`Falla descrita modificada`);
            if (current.reportedBy !== json.reportedBy) changes.push(`Reportado por: ${current.reportedBy || '-'} -> ${json.reportedBy}`);
            if (current.personInCharge !== json.personInCharge) changes.push(`Encargado: ${current.personInCharge || '-'} -> ${json.personInCharge}`);

            // Handle Dates
            const oldDate = current.diagnosisFinishedAt ? new Date(current.diagnosisFinishedAt).toISOString().split('T')[0] : null;
            const newDate = json.diagnosisFinishedAt ? new Date(json.diagnosisFinishedAt).toISOString().split('T')[0] : null;
            if (oldDate !== newDate) changes.push(`Fin Diagnóstico: ${oldDate || '-'} -> ${newDate || '-'}`);

            if (current.areaId !== (json.areaId ? parseInt(json.areaId) : null)) changes.push('Área reasignada');
            if (current.technicianId !== (json.technicianId ? parseInt(json.technicianId) : null)) changes.push('Técnico reasignado');
        }

        const updated = await prisma.equipment.update({
            where: { id },
            data: {
                type: json.type,
                model: json.model,
                serialNumber: json.serialNumber,
                status: json.status,
                reportedFailure: json.reportedFailure,
                reportedBy: json.reportedBy,
                personInCharge: json.personInCharge,
                diagnosisFinishedAt: json.diagnosisFinishedAt ? new Date(json.diagnosisFinishedAt) : null,

                areaId: json.areaId ? parseInt(json.areaId) : null,
                technicianId: json.technicianId ? parseInt(json.technicianId) : null,
                logs: {
                    create: {
                        action: 'UPDATED',
                        details: changes.length > 0 ? changes.join(' | ') : 'Actualización de datos',
                        userName: userName
                    }
                }
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
