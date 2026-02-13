-- CreateTable
CREATE TABLE "EquipmentLog" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EquipmentLog" ADD CONSTRAINT "EquipmentLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
