import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next"

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        const json = await request.json();
        const { itemId, type, quantity, reason, referenceDocument, gerencia, subArea, receiver } = json;
        const id = parseInt(itemId);
        const qty = parseInt(quantity);

        if (!id || !type || !qty) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validation for new detailed tracking
        if (type === 'IN') {
            if (!referenceDocument) {
                return NextResponse.json({ error: 'Falta Constancia de Salida de Almacén' }, { status: 400 });
            }
        }

        if (type === 'OUT') {
            if (!referenceDocument || !receiver) {
                return NextResponse.json({ error: 'Faltan datos obligatorios para Salida (Oficio/Receptor)' }, { status: 400 });
            }
            // Gerencia/SubArea are optional but recommended, let's enforce if user wants strictness, 
            // but user prompt said "pida... a que gerencia y sub area va destinado". Let's make them required for data quality.
            if (!gerencia || !subArea) {
                return NextResponse.json({ error: 'Indique Gerencia y Sub-Área de destino' }, { status: 400 });
            }
        }

        // Transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current item to check stock for OUT
            const item = await tx.warehouseItem.findUnique({ where: { id } });
            if (!item) throw new Error("Item not found");

            if (type === 'OUT' && item.quantity < qty) {
                throw new Error("Insufficient stock");
            }

            // 2. Create Movement Log with new fields
            const movement = await tx.warehouseMovement.create({
                data: {
                    type,
                    quantity: qty,
                    reason,
                    referenceDocument,
                    gerencia,
                    subArea,
                    receiver,
                    warehouseItemId: id,
                    userId: session?.user?.name || 'Sistema'
                }
            });

            // 3. Update Item Stock
            let newQuantity = item.quantity;
            if (type === 'IN') newQuantity += qty;
            else if (type === 'OUT') newQuantity -= qty;
            else if (type === 'ADJUSTMENT') {
                // For direct adjustment, the quantity passed is the *difference* or the *new total*?
                // Usually direct edit sends the NEW TOTAL. 
                // But this route seems designed for + / - movements.
                // Let's decide: If ADJUSTMENT, we expect 'quantity' to be the DELTA or handle it differently.
                // However, the prompt says "permit edit stock without marking as output".
                // Best approach: "Adjust" usually means we set the value. 
                // BUT, to calculate delta we need previous value. 
                // Let's assume for this route 'ADJUSTMENT' means a manual + or - correction passed as such.
                // OR, we can handle absolute value updates in the item PUT route and create an ADJUSTMENT record there.
                // Let's keep this route for explicit movements.
                // If type is ADJUSTMENT here, we assume 'quantity' is a signed integer? Or just magnitude?
                // Let's assume 'quantity' is the magnitude of change, and we need a 'direction' or 'operation'.
                // To keep it simple: Use this route for IN/OUT. Detailed adjustments might be better in the PUT route or a specific logic.
                // Re-reading Plan: "Update API: Implement Stock Adjustment (Direct Edit)".
                // Let's support ADJUSTMENT here as a delta. 
                // If the user *Sets* stock from 10 to 12, frontend sends ADJUSTMENT, quantity: 2 (add).
                // If the user *Sets* stock from 10 to 8, frontend sends ADJUSTMENT, quantity: -2 (subtract).
                newQuantity += qty; // Allow negative for adjustment
            }

            const updatedItem = await tx.warehouseItem.update({
                where: { id },
                data: { quantity: newQuantity }
            });

            return { movement, updatedItem };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Error processing movement' }, { status: 400 });
    }
}
