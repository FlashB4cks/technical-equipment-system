import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next"

const prisma = new PrismaClient();

export async function GET() {
    try {
        const items = await prisma.warehouseItem.findMany({
            orderBy: { name: 'asc' },
            include: {
                movements: {
                    orderBy: { date: 'desc' },
                    take: 5 // Get last 5 movements for preview
                }
            }
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching warehouse items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession()
        // @ts-ignore
        if (session?.user?.role !== 'ADMIN') {
            // Optional: Restrict creation to Admin? For now let's allow authenticated users or restrict. 
            // Let's assume admins for now or standard users if they manage stock.
        }

        const json = await request.json();

        const item = await prisma.warehouseItem.create({
            data: {
                name: json.name,
                category: json.category,
                quantity: parseInt(json.quantity) || 0,
                minQuantity: parseInt(json.minQuantity) || 5,
                unit: json.unit || 'unidades'
            }
        });

        // Log initial creation as a movement if quantity > 0
        if (item.quantity > 0) {
            await prisma.warehouseMovement.create({
                data: {
                    type: 'IN',
                    quantity: item.quantity,
                    reason: 'Inventario Inicial',
                    warehouseItemId: item.id,
                    userId: session?.user?.name || 'Sistema'
                }
            });
        }

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating item' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession()
        // @ts-ignore
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const json = await request.json();
        const { ids } = json;

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid ids' }, { status: 400 });
        }

        await prisma.warehouseItem.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting items' }, { status: 500 });
    }
}
