
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
 id: serial('id').primaryKey(),
 fullName: text('full_name'),
 phone: varchar('phone', { length: 256 }),
 createdAt: timestamp("created_at").defaultNow()
});

export const usersRelations = relations(users,({many}) =>({
    orders: many(orders)
}))

export const products = pgTable('products',{
  id: serial('id').primaryKey(),
  productName: text("product_name"),
  productCode: text('product_code'),
  productPrice: text('product_price'),
  createdAt: timestamp("created_at").defaultNow()
})

export const productsRelations = relations(products,({many}) =>({
    orders: many(orders)
}))

export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    orderNo: integer('order_number'),
    productCode: text('product_code'),
    productPrice: text('product_price'),
    quantity: integer('quantity'),
    total: integer("total"),
    userId: integer("user_id"),
    createdAt: timestamp("created_at").defaultNow()
})


export const orderRelations = relations(orders, ({one}) => ({
    user: one(users,{
        fields: [orders.userId],
        references: [users.id]
    }),
    product: one(products, {
        fields: [orders.productCode],
        references: [products.id]
    })
}))