import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next"

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const session = await getServerSession();
        const json = await request.json();
        const { name, category, quantity, minQuantity, unit } = json;

        const result = await prisma.$transaction(async (tx) => {
            // Get current to compare
            const currentItem = await tx.warehouseItem.findUnique({ where: { id } });
            if (!currentItem) throw new Error("Item not found");

            const newQty = parseInt(quantity);
            const oldQty = currentItem.quantity;

            // Update Item
            const updated = await tx.warehouseItem.update({
                where: { id },
                data: {
                    name,
                    category,
                    quantity: parseInt(quantity),
                    minQuantity: parseInt(minQuantity),
                    unit
                }
            });

            // Log Adjustment if quantity changed directly
            if (newQty !== oldQty) {
                const diff = newQty - oldQty;
                await tx.warehouseMovement.create({
                    data: {
                        type: 'ADJUSTMENT',
                        quantity: Math.abs(diff), // Magnitude
                        reason: diff > 0 ? 'Ajuste Manual (Incremento)' : 'Ajuste Manual (Disminución)',
                        referenceDocument: 'Edición Directa',
                        warehouseItemId: id,
                        userId: session?.user?.name || 'Admin'
                    }
                });
            }
            return updated;
        });

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating item' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        await prisma.warehouseItem.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting item' }, { status: 500 });
    }
}
