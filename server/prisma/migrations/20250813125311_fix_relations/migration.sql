/*
  Warnings:

  - You are about to alter the column `price` on the `order_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `totalAmount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `products` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - Added the required column `agentId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `area` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bathrooms` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bedrooms` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `neighborhood` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyType` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `products` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `products` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'OFF_MARKET');

-- AlterTable
ALTER TABLE "public"."order_items" ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."orders" ALTER COLUMN "totalAmount" SET DEFAULT 0.0,
ALTER COLUMN "totalAmount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "category",
DROP COLUMN "imageUrl",
DROP COLUMN "isActive",
DROP COLUMN "name",
DROP COLUMN "stock",
ADD COLUMN     "agentId" TEXT NOT NULL,
ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "area" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "bathrooms" INTEGER NOT NULL,
ADD COLUMN     "bedrooms" INTEGER NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "neighborhood" TEXT NOT NULL,
ADD COLUMN     "propertyType" "public"."PropertyType" NOT NULL,
ADD COLUMN     "status" "public"."ProductStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."product_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_city_idx" ON "public"."products"("city");

-- CreateIndex
CREATE INDEX "products_neighborhood_idx" ON "public"."products"("neighborhood");

-- CreateIndex
CREATE INDEX "products_price_idx" ON "public"."products"("price");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "public"."products"("status");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
